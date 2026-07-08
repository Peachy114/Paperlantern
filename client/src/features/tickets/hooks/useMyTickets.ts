import { useState, useEffect, useCallback } from 'react'
import { ticketsApi } from '../api/tickets'
import { type Ticket } from '../types/tickets'

export function useMyTickets() {
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchTickets = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await ticketsApi.list()
            setTickets(res.data)
        } catch {
            setError('Failed to load your tickets.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchTickets()
    }, [fetchTickets])

    return { tickets, loading, error, refetch: fetchTickets }
}
