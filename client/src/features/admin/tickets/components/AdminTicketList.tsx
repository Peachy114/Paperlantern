import { useState } from 'react'
import { useAdminTickets } from '../hooks/useAdminTickets'
import { type AdminTicketFilters, adminTicketsApi } from '../api/adminTickets'
import TicketFilters from './TicketFilters'
import TicketRow from './TicketRow'

export default function AdminTicketList() {
    const [filters, setFilters] = useState<AdminTicketFilters>({})
    const { tickets, loading, error, refetch } = useAdminTickets(filters)
    const [exporting, setExporting] = useState(false)

    const handleExport = async () => {
        setExporting(true)
        try {
            const res = await adminTicketsApi.export()
            const url = window.URL.createObjectURL(new Blob([res.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `tickets_${new Date().toISOString().slice(0, 10)}.xlsx`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } finally {
            setExporting(false)
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <TicketFilters filters={filters} onChange={setFilters} />
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="px-4 py-2 rounded-md bg-green-600 text-white disabled:opacity-50"
                >
                    {exporting ? 'Exporting…' : 'Export to Excel'}
                </button>
            </div>

            {loading && <p>Loading tickets…</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!loading && !error && (
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b text-left text-sm text-gray-500">
                            <th className="px-3 py-2">Subject</th>
                            <th className="px-3 py-2">Category</th>
                            <th className="px-3 py-2">Message</th>
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2">Last Activity</th>
                            <th className="px-3 py-2">Created</th>
                            <th className="px-3 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {tickets.map((t) => (
                            <TicketRow key={t.id} ticket={t} onChanged={refetch} />
                        ))}
                    </tbody>
                </table>
            )}

            {!loading && !error && tickets.length === 0 && (
                <p className="text-gray-500 mt-4">No tickets found.</p>
            )}
        </div>
    )
}
