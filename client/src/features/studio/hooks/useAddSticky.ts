import { useRef, useState } from 'react'
import { containsBadWord } from '@/lib/badWords'

export const COLORS = ['#fef08a', '#ffc6a6', '#ffbacf', '#86efac', '#c4b5fd', '#bae6fd', '#fca5a5']

export interface StickyNotePayload {
    type: 'text' | 'image'
    text?: string
    color?: string
    imageFile?: File
    imageMode?: 'photo' | 'sticker'
}

export function useAddSticky(onAdd: (note: StickyNotePayload) => void, onClose: () => void) {
    const [tab, setTab] = useState<'text' | 'image'>('text')
    const [text, setText] = useState('')
    const [color, setColor] = useState('#fef08a')
    const [preview, setPreview] = useState<string | null>(null)
    const fileRef = useRef<HTMLInputElement>(null)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imageMode, setImageMode] = useState<'photo' | 'sticker'>('photo')
    const [error, setError] = useState('')

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setImageFile(file)
        const reader = new FileReader()
        reader.onload = () => setPreview(reader.result as string)
        reader.readAsDataURL(file)
    }

    const removeImage = () => {
        setPreview(null)
        setImageFile(null)
    }

    const reset = () => {
        setText('')
        setPreview(null)
        setColor('#fef08a')
        setImageFile(null)
        setError('')
    }

    const handleAdd = () => {
        if (tab === 'text' && !text.trim()) return
        if (tab === 'image' && !imageFile) return

        if (tab === 'text' && containsBadWord(text)) {
            setError('Your note contains inappropriate language. 🚫')
            return
        }

        setError('')
        onAdd(
            tab === 'text'
                ? { type: 'text', text: text.trim(), color }
                : { type: 'image', imageFile: imageFile ?? undefined, imageMode }
        )
        reset()
        onClose()
    }

    const canSubmit = (tab === 'text' && !!text.trim()) || (tab === 'image' && !!preview)

    return {
        tab,
        setTab,
        text,
        setText,
        color,
        setColor,
        preview,
        fileRef,
        imageMode,
        setImageMode,
        error,
        setError,
        handleFile,
        removeImage,
        handleAdd,
        canSubmit,
    }
}
