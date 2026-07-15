import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { adminApi } from '@/api/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type LabelItem = {
    id: string
    type: 'genre' | 'label'
    name: string
    slug: string
    sort_order: number
    is_active: boolean
}

type CommissionType = {
    id: string
    name: string
    slug: string
    sort_order: number
    is_active: boolean
}

type LabelRequest = {
    id: string
    type: 'genre' | 'label'
    name: string
    reason?: string | null
    status: 'pending' | 'approved' | 'rejected'
    user?: { name?: string; username?: string; email?: string }
}

export default function Labeling() {
    const [loading, setLoading] = useState(true)
    const [genres, setGenres] = useState<LabelItem[]>([])
    const [labels, setLabels] = useState<LabelItem[]>([])
    const [commissionTypes, setCommissionTypes] = useState<CommissionType[]>([])
    const [requests, setRequests] = useState<LabelRequest[]>([])

    const load = async () => {
        setLoading(true)
        try {
            const res = await adminApi.getLabeling()
            setGenres(res.data.genres ?? [])
            setLabels(res.data.labels ?? [])
            setCommissionTypes(res.data.commission_types ?? [])
            setRequests(res.data.requests ?? [])
        } catch {
            toast.error('Could not load labeling settings.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    const pendingRequests = useMemo(
        () => requests.filter((request) => request.status === 'pending'),
        [requests]
    )

    return (
        <main className="mx-auto max-w-6xl px-6 py-10">
            <div className="mb-8">
                <h1 className="text-2xl font-bold">Labeling</h1>
                <p className="text-sm text-muted-foreground">
                    Manage series genres, searchable labels, and commission types.
                </p>
            </div>

            <Tabs defaultValue="genres">
                <TabsList className="h-auto flex-wrap justify-start">
                    <TabsTrigger value="genres">Genres</TabsTrigger>
                    <TabsTrigger value="labels">Labels</TabsTrigger>
                    <TabsTrigger value="commission-types">Commission Types</TabsTrigger>
                    <TabsTrigger value="requests">
                        Requests{pendingRequests.length ? ` (${pendingRequests.length})` : ''}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="genres" className="mt-5">
                    <LabelManager
                        title="Genres"
                        type="genre"
                        items={genres}
                        loading={loading}
                        onChanged={load}
                    />
                </TabsContent>
                <TabsContent value="labels" className="mt-5">
                    <LabelManager
                        title="Labels"
                        type="label"
                        items={labels}
                        loading={loading}
                        onChanged={load}
                    />
                </TabsContent>
                <TabsContent value="commission-types" className="mt-5">
                    <CommissionTypeManager
                        items={commissionTypes}
                        loading={loading}
                        onChanged={load}
                    />
                </TabsContent>
                <TabsContent value="requests" className="mt-5">
                    <RequestsTable requests={requests} loading={loading} onChanged={load} />
                </TabsContent>
            </Tabs>
        </main>
    )
}

function LabelManager({
    title,
    type,
    items,
    loading,
    onChanged,
}: {
    title: string
    type: 'genre' | 'label'
    items: LabelItem[]
    loading: boolean
    onChanged: () => void
}) {
    const [name, setName] = useState('')

    const create = async () => {
        if (!name.trim()) return toast.error('Name is required.')
        await adminApi.createLabel({ type, name: name.trim(), is_active: true })
        setName('')
        toast.success(`${title.slice(0, -1)} added.`)
        onChanged()
    }

    const toggle = async (item: LabelItem) => {
        await adminApi.updateLabel(item.id, { is_active: !item.is_active })
        onChanged()
    }

    return (
        <section className="rounded-lg border border-border bg-card p-4">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                <Input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={`Add ${title.slice(0, -1).toLowerCase()}`}
                />
                <Button onClick={create}>Add</Button>
            </div>
            <ItemTable
                items={items}
                loading={loading}
                onToggle={(item) => toggle(item as LabelItem)}
            />
        </section>
    )
}

function CommissionTypeManager({
    items,
    loading,
    onChanged,
}: {
    items: CommissionType[]
    loading: boolean
    onChanged: () => void
}) {
    const [name, setName] = useState('')

    const create = async () => {
        if (!name.trim()) return toast.error('Name is required.')
        await adminApi.createCommissionCategory({ name: name.trim(), is_active: true })
        setName('')
        toast.success('Commission type added.')
        onChanged()
    }

    const toggle = async (item: CommissionType) => {
        await adminApi.updateCommissionCategory(item.id, { is_active: !item.is_active })
        onChanged()
    }

    return (
        <section className="rounded-lg border border-border bg-card p-4">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                <Input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Add commission type"
                />
                <Button onClick={create}>Add</Button>
            </div>
            <ItemTable items={items} loading={loading} onToggle={(item) => toggle(item as CommissionType)} />
        </section>
    )
}

function ItemTable({
    items,
    loading,
    onToggle,
}: {
    items: Array<LabelItem | CommissionType>
    loading: boolean
    onToggle: (item: LabelItem | CommissionType) => void
}) {
    if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>
    if (items.length === 0) return <p className="text-sm text-muted-foreground">No items yet.</p>

    return (
        <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                    <tr>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Slug</th>
                        <th className="px-3 py-2">Order</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2 text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item) => (
                        <tr key={item.id} className="border-t border-border">
                            <td className="px-3 py-2 font-medium">{item.name}</td>
                            <td className="px-3 py-2 text-muted-foreground">{item.slug}</td>
                            <td className="px-3 py-2">{item.sort_order}</td>
                            <td className="px-3 py-2">
                                {item.is_active ? 'Active' : 'Hidden'}
                            </td>
                            <td className="px-3 py-2 text-right">
                                <Button variant="outline" size="sm" onClick={() => onToggle(item)}>
                                    {item.is_active ? 'Hide' : 'Activate'}
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function RequestsTable({
    requests,
    loading,
    onChanged,
}: {
    requests: LabelRequest[]
    loading: boolean
    onChanged: () => void
}) {
    const review = async (request: LabelRequest, status: 'approved' | 'rejected') => {
        await adminApi.updateLabelRequest(request.id, status)
        toast.success(status === 'approved' ? 'Request approved.' : 'Request rejected.')
        onChanged()
    }

    if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>
    if (requests.length === 0) {
        return <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">No requests yet.</p>
    }

    return (
        <section className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                    <tr>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Requested by</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2 text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.map((request) => (
                        <tr key={request.id} className="border-t border-border">
                            <td className="px-3 py-2 font-medium">{request.name}</td>
                            <td className="px-3 py-2 capitalize">{request.type}</td>
                            <td className="px-3 py-2 text-muted-foreground">
                                {request.user?.username ?? request.user?.email ?? 'Unknown'}
                            </td>
                            <td className="px-3 py-2 capitalize">{request.status}</td>
                            <td className="px-3 py-2 text-right">
                                {request.status === 'pending' ? (
                                    <div className="flex justify-end gap-2">
                                        <Button size="sm" onClick={() => review(request, 'approved')}>
                                            Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => review(request, 'rejected')}
                                        >
                                            Reject
                                        </Button>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground">Reviewed</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    )
}
