import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { adminTicketsApi } from './api/adminTickets'
import { useTicketThread } from '../../tickets/hooks/useTicketThread'
import TicketThread from '../../tickets/components/TicketThread'
import { useUpdateTicket } from './hooks/useUpdateTicket'
import { type Ticket } from '../../tickets/types/tickets'
import { STATUS_STYLES, STATUS_LABELS } from '../tickets/constants'

export default function AdminTicketShow() {
    const { id } = useParams<{ id: string }>()
    const { replies, loading, sending, sendReply } = useTicketThread(id!, adminTicketsApi)
    const { updateTicket, updating } = useUpdateTicket()

    const [ticket, setTicket] = useState<Ticket | null>(null)
    const [notes, setNotes] = useState('')

    useEffect(() => {
        adminTicketsApi.show(id!).then((res) => {
            setTicket(res.data)
            setNotes(res.data.admin_notes ?? '')
        })
    }, [id])

    const handleNotesBlur = async () => {
        if (!ticket || notes === (ticket.admin_notes ?? '')) return
        await updateTicket(ticket.id, { admin_notes: notes })
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-semibold mb-4">Ticket Conversation</h1>

            {ticket && (
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{ticket.subject}</p>
                        <span
                            className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[ticket.status]}`}
                        >
                            {STATUS_LABELS[ticket.status]}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 capitalize">{ticket.category}</p>
                    <p className="text-sm mt-1">{ticket.message}</p>
                </div>
            )}

            <div className="mb-6">
                <label className="block text-sm font-medium mb-1">Internal Admin Notes</label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={handleNotesBlur}
                    rows={2}
                    placeholder="Only visible to admins…"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                />
                {updating && <p className="text-xs text-gray-400 mt-1">Saving…</p>}
            </div>

            <TicketThread
                replies={replies}
                loading={loading}
                sending={sending}
                onSend={sendReply}
                currentUserIsAdmin={true}
            />
        </div>
    )
}
