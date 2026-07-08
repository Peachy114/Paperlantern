import { useState } from 'react'
import { adminTicketsApi, type UpdateTicketPayload } from '../api/adminTickets'

export function useUpdateTicket() {
    const [updating, setUpdating] = useState(false)

    const updateTicket = async (id: string, payload: UpdateTicketPayload) => {
        setUpdating(true)
        try {
            await adminTicketsApi.update(id, payload)
            return true
        } catch {
            return false
        } finally {
            setUpdating(false)
        }
    }

    return { updateTicket, updating }
}
