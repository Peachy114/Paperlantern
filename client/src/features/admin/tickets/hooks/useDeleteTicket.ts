import { useState } from 'react'
import { adminTicketsApi } from '../api/adminTickets'

export function useDeleteTicket() {
    const [deleting, setDeleting] = useState(false)

    const deleteTicket = async (id: string) => {
        setDeleting(true)
        try {
            await adminTicketsApi.destroy(id)
            return true
        } catch {
            return false
        } finally {
            setDeleting(false)
        }
    }

    return { deleteTicket, deleting }
}
