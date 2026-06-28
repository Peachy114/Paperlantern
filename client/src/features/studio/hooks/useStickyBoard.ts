// hooks/useStickyBoard.ts
import { useState, useEffect, useRef, useCallback } from 'react'
import { useStickyNotes, type StickyNote } from './useStickyNotes'

export function useStickyBoard() {
    const { notes, loading, addNote, updatePosition, removeNote } = useStickyNotes()

    const [localPositions, setLocalPositions] = useState<Record<number, { x: number; y: number }>>(
        {}
    )
    const [zOrder, setZOrder] = useState<number[]>([])
    const [dragging, setDragging] = useState<number | null>(null)
    const boardRef = useRef<HTMLDivElement>(null)
    const dragOffset = useRef({ x: 0, y: 0 })

    // Sync z-order when notes change
    useEffect(() => {
        setZOrder((prev) => {
            const existing = new Set(prev)
            const newIds = notes.filter((n) => !existing.has(n.id)).map((n) => n.id)
            const merged = [...prev.filter((id) => notes.some((n) => n.id === id)), ...newIds]
            if (prev.length === 0) {
                const photos = merged.filter(
                    (id) => notes.find((n) => n.id === id)?.imageMode !== 'sticker'
                )
                const stickers = merged.filter(
                    (id) => notes.find((n) => n.id === id)?.imageMode === 'sticker'
                )
                return [...photos, ...stickers]
            }
            return merged
        })
    }, [notes])

    const getNote = (id: number): StickyNote | null => {
        const note = notes.find((n) => n.id === id)
        if (!note) return null
        const pos = localPositions[id]
        return pos ? { ...note, ...pos } : note
    }

    const displayedNotes = zOrder
        .map((id) => getNote(id))
        .filter((n): n is StickyNote => n !== null)

    const handleAdd = async (note: {
        type: 'text' | 'image'
        text?: string
        color?: string
        imageFile?: File
        imageMode?: 'photo' | 'sticker'
    }) => {
        const board = boardRef.current
        const boardWidth = board ? board.getBoundingClientRect().width : 400
        const safeX = Math.min(220 + Math.random() * 80, boardWidth - 150)
        await addNote({
            ...note,
            rotate: `${(Math.random() * 6 - 3).toFixed(1)}deg`,
            x: Math.max(10, safeX),
            y: 20 + Math.random() * 60,
        })
    }

    const handleRemove = (id: number) => {
        setLocalPositions((prev) => {
            const p = { ...prev }
            delete p[id]
            return p
        })
        removeNote(id)
    }

    const onMouseDown = useCallback(
        (e: React.MouseEvent, id: number) => {
            e.preventDefault()
            const board = boardRef.current
            if (!board) return
            const boardRect = board.getBoundingClientRect()
            const note = getNote(id)
            if (!note) return
            dragOffset.current = {
                x: e.clientX - boardRect.left - note.x,
                y: e.clientY - boardRect.top - note.y,
            }
            setDragging(id)
            setZOrder((prev) => [...prev.filter((i) => i !== id), id])
        },
        [notes, localPositions]
    )

    const onMouseMove = useCallback(
        (e: MouseEvent) => {
            if (dragging === null) return
            const board = boardRef.current
            if (!board) return
            const boardRect = board.getBoundingClientRect()
            const x = Math.max(
                0,
                Math.min(e.clientX - boardRect.left - dragOffset.current.x, boardRect.width - 60)
            )
            const y = Math.max(
                0,
                Math.min(e.clientY - boardRect.top - dragOffset.current.y, boardRect.height - 60)
            )
            setLocalPositions((prev) => ({ ...prev, [dragging]: { x, y } }))
        },
        [dragging]
    )

    const onMouseUp = useCallback(() => {
        if (dragging !== null) {
            const pos = localPositions[dragging]
            if (pos) updatePosition(dragging, pos.x, pos.y)
        }
        setDragging(null)
    }, [dragging, localPositions])

    const onTouchStart = useCallback(
        (e: React.TouchEvent, id: number) => {
            const board = boardRef.current
            if (!board) return
            const boardRect = board.getBoundingClientRect()
            const touch = e.touches[0]
            const note = getNote(id)
            if (!note) return
            dragOffset.current = {
                x: touch.clientX - boardRect.left - note.x,
                y: touch.clientY - boardRect.top - note.y,
            }
            setDragging(id)
            setZOrder((prev) => [...prev.filter((i) => i !== id), id])
        },
        [notes, localPositions]
    )

    const onTouchMove = useCallback(
        (e: TouchEvent) => {
            if (dragging === null) return
            if (e.cancelable) e.preventDefault()
            e.preventDefault()
            const board = boardRef.current
            if (!board) return
            const boardRect = board.getBoundingClientRect()
            const touch = e.touches[0]
            const x = Math.max(
                0,
                Math.min(
                    touch.clientX - boardRect.left - dragOffset.current.x,
                    boardRect.width - 60
                )
            )
            const y = Math.max(
                0,
                Math.min(
                    touch.clientY - boardRect.top - dragOffset.current.y,
                    boardRect.height - 60
                )
            )
            setLocalPositions((prev) => ({ ...prev, [dragging]: { x, y } }))
        },
        [dragging]
    )

    // Attach/detach window listeners while dragging — after all callbacks are declared
    useEffect(() => {
        if (dragging !== null) {
            window.addEventListener('mousemove', onMouseMove)
            window.addEventListener('mouseup', onMouseUp)
            window.addEventListener('touchmove', onTouchMove, { passive: false })
            window.addEventListener('touchend', onMouseUp)
        }
        return () => {
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
            window.removeEventListener('touchmove', onTouchMove)
            window.removeEventListener('touchend', onMouseUp)
        }
    }, [dragging, onMouseMove, onMouseUp, onTouchMove])

    return {
        notes,
        loading,
        dragging,
        boardRef,
        displayedNotes,
        handleAdd,
        handleRemove,
        onMouseDown,
        onTouchStart,
    }
}
