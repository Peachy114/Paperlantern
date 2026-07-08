import { useState, useEffect, useCallback } from 'react'
import { type TicketReply } from '../types/tickets'

interface ThreadApi {
    replies: (ticketId: string) => Promise<{ data: TicketReply[] }>
    sendReply: (ticketId: string, message: string) => Promise<{ data: TicketReply }>
}

export function useTicketThread(ticketId: string, api: ThreadApi) {
    const [replies, setReplies] = useState<TicketReply[]>([])
    const [loading, setLoading] = useState(false)
    const [sending, setSending] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchReplies = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await api.replies(ticketId)
            setReplies(res.data)
        } catch {
            setError('Failed to load replies.')
        } finally {
            setLoading(false)
        }
    }, [ticketId])

    useEffect(() => {
        fetchReplies()
    }, [fetchReplies])

    const sendReply = async (message: string) => {
        setSending(true)
        try {
            const res = await api.sendReply(ticketId, message)
            setReplies((prev) => [...prev, res.data])
            return true
        } catch {
            setError('Failed to send reply.')
            return false
        } finally {
            setSending(false)
        }
    }

    return { replies, loading, sending, error, sendReply, refetch: fetchReplies }
}
