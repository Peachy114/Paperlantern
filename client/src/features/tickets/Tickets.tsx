// import { useState } from 'react'
// import CreateTicketForm from './components/CreateTicketForm'
// import MyTicketList from './components/MyTicketList'
// import { useMyTickets } from './hooks/useMyTickets'

// export default function Tickets() {
//     const [showForm, setShowForm] = useState(false)
//     const { tickets, loading, error, refetch } = useMyTickets()

//     const handleCreated = () => {
//         setShowForm(false)
//         refetch()
//     }

//     return (
//         <div className="p-6">
//             <div className="flex justify-between items-center mb-4">
//                 <h1 className="text-2xl font-semibold">My Tickets</h1>
//                 <button
//                     onClick={() => setShowForm((s) => !s)}
//                     className="px-4 py-2 rounded-md bg-blue-600 text-white"
//                 >
//                     {showForm ? 'Cancel' : 'New Ticket'}
//                 </button>
//             </div>

//             {showForm && (
//                 <div className="mb-6 border rounded-md p-4">
//                     <CreateTicketForm onCreated={handleCreated} />
//                 </div>
//             )}

//             <MyTicketList tickets={tickets} loading={loading} error={error} />
//         </div>
//     )
// }


import { useState } from 'react'
import CreateTicketForm from './components/CreateTicketForm'
import MyTicketList from './components/MyTicketList'
import { useMyTickets } from './hooks/useMyTickets'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

export default function Tickets() {
    const [showForm, setShowForm] = useState(false)
    const { tickets, loading, error, refetch } = useMyTickets()

    const handleCreated = () => {
        setShowForm(false)
        refetch()
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-semibold">My Tickets</h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 rounded-md bg-blue-600 text-white"
                >
                    New Ticket
                </button>
            </div>

            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent
                    className="
                        w-[95vw]
                        sm:max-w-xl
                        md:max-w-2xl
                        lg:max-w-4xl
                        xl:max-w-5xl
                        max-h-[90vh]
                        overflow-y-auto
                        p-6
                    "
                >
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold">
                            New Ticket
                        </DialogTitle>
                    </DialogHeader>

                    <CreateTicketForm onCreated={handleCreated} />
                </DialogContent>
            </Dialog>

            <MyTicketList tickets={tickets} loading={loading} error={error} />
        </div>
    )
}