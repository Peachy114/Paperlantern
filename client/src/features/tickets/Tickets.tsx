import { useState } from 'react'
import CreateTicketForm from './components/CreateTicketForm'
import MyTicketList from './components/MyTicketList'
import { useMyTickets } from './hooks/useMyTickets'

export default function Tickets() {
    const [showForm, setShowForm] = useState(false)
    const { tickets, loading, error, refetch } = useMyTickets()

    const handleCreated = () => {
        setShowForm(false)
        refetch()
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-semibold">My Tickets</h1>
                <button
                    onClick={() => setShowForm((s) => !s)}
                    className="px-4 py-2 rounded-md bg-blue-600 text-white"
                >
                    {showForm ? 'Cancel' : 'New Ticket'}
                </button>
            </div>

            {showForm && (
                <div className="mb-6 border rounded-md p-4">
                    <CreateTicketForm onCreated={handleCreated} />
                </div>
            )}

            <MyTicketList tickets={tickets} loading={loading} error={error} />
        </div>
    )
}
