import { Link } from 'react-router-dom'
import { type Ticket } from '../types/tickets'

const STATUS_STYLES: Record<Ticket['status'], string> = {
    open: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-blue-100 text-blue-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-600',
}

const STATUS_LABELS: Record<Ticket['status'], string> = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
}

interface Props {
    tickets: Ticket[]
    loading: boolean
    error: string | null
}

export default function MyTicketList({ tickets, loading, error }: Props) {
    if (loading) return <p className="text-sm text-gray-500 mt-6">Loading your tickets…</p>
    if (error) return <p className="text-sm text-red-500 mt-6">{error}</p>
    if (tickets.length === 0)
        return <p className="text-sm text-gray-500 mt-6">You haven't submitted any tickets yet.</p>

    return (
        <div className="mt-6 flex flex-col divide-y border rounded-md">
            {tickets.map((t) => (
                <Link
                    key={t.id}
                    to={`/tickets/${t.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                >
                    <div>
                        <p className="font-medium">{t.subject}</p>
                        <p className="text-xs text-gray-500 capitalize">
                            {t.category} · {new Date(t.created_at).toLocaleDateString()}
                        </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[t.status]}`}>
                        {STATUS_LABELS[t.status]}
                    </span>
                </Link>
            ))}
        </div>
    )
}
