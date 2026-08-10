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
        <div className="flex h-[calc(100dvh-64px)] flex-col px-4 py-4 sm:h-[calc(100dvh-80px)] sm:px-6 sm:py-6">
            <h1 className="mb-4 text-xl font-semibold sm:text-2xl">
                Ticket Conversation
            </h1>

            {ticket && (
                <div className="mb-4 rounded-lg border bg-muted/30 p-4 shadow-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="break-words text-lg font-semibold">
                            {ticket.subject}
                        </h2>

                        {ticket.source_type && (
                            <span className="w-fit rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                                Moderation Appeal
                            </span>
                        )}
                    </div>

                    <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-muted-foreground">
                        {ticket.message}
                    </p>
                </div>
            )}

            <div className="min-h-0 flex-1 overflow-hidden bg-background">
                <TicketThread
                    replies={replies}
                    loading={loading}
                    sending={sending}
                    onSend={sendReply}
                    currentUserIsAdmin={false}
                />
            </div>
        </div>
    )
}