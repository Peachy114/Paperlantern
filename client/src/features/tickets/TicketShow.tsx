import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ticketsApi } from './api/tickets'
import { useTicketThread } from './hooks/useTicketThread'
import TicketThread from './components/TicketThread'
import { type Ticket } from './types/tickets'

export default function TicketShow() {
    const { id } = useParams<{ id: string }>()
    const { replies, loading, sending, sendReply } = useTicketThread(id!, ticketsApi)
    const [ticket, setTicket] = useState<Ticket | null>(null)

    useEffect(() => {
        ticketsApi.show(id!).then((res) => setTicket(res.data))
    }, [id])

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-semibold mb-4">Ticket Conversation</h1>

            {ticket && (
                <div className="mb-4 rounded-md border bg-muted/30 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold">{ticket.subject}</h2>
                        {ticket.source_type && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                                Moderation appeal
                            </span>
                        )}
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                        {ticket.message}
                    </p>
                </div>
            )}

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
