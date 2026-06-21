// hooks/useStickyNotes.ts  (replace existing)
import { useState, useEffect, useRef } from 'react'
import api from '@/api/axios'

export interface StickyNote {
    id: number
    type: 'text' | 'image'
    text?: string
    color?: string
    imageUrl?: string
    imageMode?: 'photo' | 'sticker'
    rotate: string
    x: number
    y: number
}

export function useStickyNotes() {
    const [notes, setNotes] = useState<StickyNote[]>([])
    const [loading, setLoading] = useState(true)
    const positionTimer = useRef<Record<number, ReturnType<typeof setTimeout>>>({})

    useEffect(() => {
        api.get('/studio/sticky-notes')
            .then((r) => setNotes(r.data))
            .finally(() => setLoading(false))
    }, [])

    const addNote = async (payload: {
        type: 'text' | 'image'
        text?: string
        color?: string
        imageFile?: File
        imageMode?: 'photo' | 'sticker'
        rotate: string
        x: number
        y: number
    }) => {
        const form = new FormData()
        form.append('type', payload.type)
        form.append('rotate', payload.rotate)
        form.append('x', String(payload.x))
        form.append('y', String(payload.y))
        if (payload.type === 'text') {
            form.append('text', payload.text ?? '')
            form.append('color', payload.color ?? '#fef08a')
        } else if (payload.imageFile) {
            form.append('image', payload.imageFile)
            if (payload.imageMode) form.append('imageMode', payload.imageMode)
        }
        const res = await api.post('/studio/sticky-notes', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        setNotes((prev) => [...prev, res.data])
        return res.data as StickyNote
    }

    const updatePosition = (id: number, x: number, y: number) => {
        setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)))
        if (positionTimer.current[id]) clearTimeout(positionTimer.current[id])
        positionTimer.current[id] = setTimeout(() => {
            api.patch(`/studio/sticky-notes/${id}/position`, { x, y }).catch(() => {})
        }, 600)
    }

    const removeNote = async (id: number) => {
        setNotes((prev) => prev.filter((n) => n.id !== id))
        await api.delete(`/studio/sticky-notes/${id}`).catch(() => {})
    }

    return { notes, loading, addNote, updatePosition, removeNote }
}
