import { type AdminTicketFilters } from '../api/adminTickets'
import { TICKET_STATUS_FILTERS, TICKET_CATEGORY_FILTERS } from '../constants'

interface Props {
    filters: AdminTicketFilters
    onChange: (filters: AdminTicketFilters) => void
}

export default function TicketFilters({ filters, onChange }: Props) {
    return (
        <div className="flex gap-3 mb-4">
            <select
                value={filters.status ?? ''}
                onChange={(e) =>
                    onChange({ ...filters, status: (e.target.value || undefined) as any })
                }
                className="border rounded-md px-3 py-2"
            >
                {TICKET_STATUS_FILTERS.map((s) => (
                    <option key={s.value} value={s.value}>
                        {s.label}
                    </option>
                ))}
            </select>

            <select
                value={filters.category ?? ''}
                onChange={(e) => onChange({ ...filters, category: e.target.value || undefined })}
                className="border rounded-md px-3 py-2"
            >
                {TICKET_CATEGORY_FILTERS.map((c) => (
                    <option key={c.value} value={c.value}>
                        {c.label}
                    </option>
                ))}
            </select>
        </div>
    )
}
