import { useParams } from 'react-router-dom'
import { ticketsApi } from './api/tickets'
import { useTicketThread } from './hooks/useTicketThread'
import TicketThread from './components/TicketThread'

export default function TicketShow() {
    const { id } = useParams<{ id: string }>()
    const { replies, loading, sending, sendReply } = useTicketThread(id!, ticketsApi)

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-semibold mb-4">Ticket Conversation</h1>
            <TicketThread
                replies={replies}
                loading={loading}
                sending={sending}
                onSend={sendReply}
                currentUserIsAdmin={false}
            />
        </div>
    )
}
