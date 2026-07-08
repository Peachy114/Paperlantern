import AdminTicketList from '@/features/admin/tickets/components/AdminTicketList'

export default function Tickets() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-4">Tickets</h1>
            <AdminTicketList />
        </div>
    )
}
