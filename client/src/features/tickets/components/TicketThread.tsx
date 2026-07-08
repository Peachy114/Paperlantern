import { useState, type SyntheticEvent } from 'react'
import { type TicketReply } from '../types/tickets'

interface Props {
    replies: TicketReply[]
    loading: boolean
    sending: boolean
    onSend: (message: string) => Promise<boolean>
    currentUserIsAdmin: boolean
}

export default function TicketThread({
    replies,
    loading,
    sending,
    onSend,
    currentUserIsAdmin,
}: Props) {
    const [message, setMessage] = useState('')

    const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!message.trim()) return
        const ok = await onSend(message)
        if (ok) setMessage('')
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 max-h-96 overflow-y-auto border rounded-md p-4">
                {loading && <p className="text-sm text-gray-500">Loading conversation…</p>}
                {!loading && replies.length === 0 && (
                    <p className="text-sm text-gray-500">No replies yet.</p>
                )}
                {replies.map((r) => (
                    <div
                        key={r.id}
                        className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                            r.is_admin ? 'bg-blue-100 self-start' : 'bg-gray-100 self-end ml-auto'
                        }`}
                    >
                        <p className="font-medium text-xs mb-1">
                            {r.is_admin ? `${r.user.name} (Admin)` : r.user.name}
                        </p>
                        <p>{r.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">
                            {new Date(r.created_at).toLocaleString()}
                        </p>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={currentUserIsAdmin ? 'Reply as admin…' : 'Type a message…'}
                    className="flex-1 border rounded-md px-3 py-2"
                />
                <button
                    type="submit"
                    disabled={sending || !message.trim()}
                    className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50"
                >
                    {sending ? 'Sending…' : 'Send'}
                </button>
            </form>
        </div>
    )
}
