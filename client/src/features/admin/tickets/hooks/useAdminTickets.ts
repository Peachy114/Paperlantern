import { useState, useEffect, useCallback } from 'react'
import { adminTicketsApi, type AdminTicketFilters } from '../api/adminTickets'
import { type Ticket } from '@/features/tickets/types/tickets'

export function useAdminTickets(filters: AdminTicketFilters) {
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchTickets = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await adminTicketsApi.list(filters)
            setTickets(res.data)
        } catch {
            setError('Failed to load tickets.')
        } finally {
            setLoading(false)
        }
    }, [filters.status, filters.category])

    useEffect(() => {
        fetchTickets()
    }, [fetchTickets])

    return { tickets, loading, error, refetch: fetchTickets }
}
