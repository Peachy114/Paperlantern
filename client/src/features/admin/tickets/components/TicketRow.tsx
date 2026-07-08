import { useState } from 'react'
import { Link } from 'react-router-dom'
import { type Ticket, type TicketStatus } from '../../../tickets/types/tickets'
import { useUpdateTicket } from '../hooks/useUpdateTicket'
import { useDeleteTicket } from '../hooks/useDeleteTicket'
import { TICKET_STATUSES, STATUS_STYLES, STATUS_LABELS } from '../constants'

interface Props {
    ticket: Ticket
    onChanged: () => void
}

export default function TicketRow({ ticket, onChanged }: Props) {
    const [editingStatus, setEditingStatus] = useState(false)
    const { updateTicket, updating } = useUpdateTicket()
    const { deleteTicket, deleting } = useDeleteTicket()

    const handleStatusChange = async (status: TicketStatus) => {
        const ok = await updateTicket(ticket.id, { status })
        if (ok) {
            setEditingStatus(false)
            onChanged()
        }
    }

    const handleDelete = async () => {
        if (!confirm('Delete this ticket permanently?')) return
        const ok = await deleteTicket(ticket.id)
        if (ok) onChanged()
    }

    return (
        <tr className="border-b">
            <td className="px-3 py-2">
                <Link to={`/admin/tickets/${ticket.id}`} className="text-blue-600 hover:underline">
                    {ticket.subject}
                </Link>
            </td>
            <td className="px-3 py-2 capitalize">{ticket.category}</td>
            <td className="px-3 py-2 max-w-xs truncate">{ticket.message}</td>
            <td className="px-3 py-2">
                {editingStatus ? (
                    <select
                        autoFocus
                        value={ticket.status}
                        disabled={updating}
                        onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                        onBlur={() => setEditingStatus(false)}
                        className="border rounded-md px-2 py-1 text-xs"
                    >
                        {TICKET_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                ) : (
                    <button
                        onClick={() => setEditingStatus(true)}
                        className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[ticket.status]}`}
                    >
                        {STATUS_LABELS[ticket.status]}
                    </button>
                )}
            </td>
            <td className="px-3 py-2">
                {ticket.latest_reply?.is_admin ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                        Admin replied
                    </span>
                ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                        Awaiting reply
                    </span>
                )}
            </td>
            <td className="px-3 py-2 text-sm text-gray-500">
                {new Date(ticket.created_at).toLocaleDateString()}
            </td>
            <td className="px-3 py-2">
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-red-500 text-sm hover:underline disabled:opacity-50"
                >
                    Delete
                </button>
            </td>
        </tr>
    )
}
