import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Coins, Loader2, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { adminApi, type CreditPackagePayload } from '@/api/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CreditPackage } from '@/types/wallet'

const EMPTY_FORM: CreditPackagePayload = {
    name: '',
    credits: 30,
    price: 43.5,
    promo_label: '',
    promo_start_at: null,
    promo_end_at: null,
    is_active: true,
    sort_order: 0,
}

export default function TopUpSettings() {
    const queryClient = useQueryClient()
    const [editing, setEditing] = useState<CreditPackage | null>(null)
    const [form, setForm] = useState<CreditPackagePayload>(EMPTY_FORM)

    const { data: packages = [], isLoading } = useQuery({
        queryKey: ['admin-credit-packages'],
        queryFn: () => adminApi.getCreditPackages().then((res) => res.data.data),
    })

    const savePackage = useMutation({
        mutationFn: (payload: CreditPackagePayload) =>
            editing
                ? adminApi.updateCreditPackage(editing.id, payload)
                : adminApi.createCreditPackage(payload),
        onSuccess: () => {
            toast.success(editing ? 'Top-up package updated.' : 'Top-up package created.')
            queryClient.invalidateQueries({ queryKey: ['admin-credit-packages'] })
            queryClient.invalidateQueries({ queryKey: ['credit-packages'] })
            resetForm()
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.message ??
                firstValidationError(error?.response?.data?.errors) ??
                'Could not save top-up package.'
            toast.error(message)
        },
    })

    const deletePackage = useMutation({
        mutationFn: (id: string | number) => adminApi.deleteCreditPackage(id),
        onSuccess: () => {
            toast.success('Top-up package deleted.')
            queryClient.invalidateQueries({ queryKey: ['admin-credit-packages'] })
            queryClient.invalidateQueries({ queryKey: ['credit-packages'] })
        },
        onError: () => toast.error('Could not delete top-up package.'),
    })

    const preview = useMemo(() => {
        const credits = Number(form.credits) || 0
        const price = Number(form.price) || 0
        return credits > 0 ? price / credits : 0
    }, [form.credits, form.price])

    useEffect(() => {
        if (!editing) return
        setForm({
            name: editing.name,
            credits: editing.credits,
            price: Number(editing.price),
            promo_label: editing.promo_label ?? '',
            promo_start_at: toDatetimeLocal(editing.promo_start_at),
            promo_end_at: toDatetimeLocal(editing.promo_end_at),
            is_active: Boolean(editing.is_active),
            sort_order: editing.sort_order ?? 0,
        })
    }, [editing])

    function resetForm() {
        setEditing(null)
        setForm(EMPTY_FORM)
    }

    function updateField<K extends keyof CreditPackagePayload>(
        key: K,
        value: CreditPackagePayload[K]
    ) {
        setForm((current) => ({ ...current, [key]: value }))
    }

    function submit(event: FormEvent) {
        event.preventDefault()

        savePackage.mutate({
            ...form,
            name: form.name.trim(),
            credits: Number(form.credits),
            price: Number(form.price),
            promo_label: form.promo_label?.trim() || null,
            promo_start_at: form.promo_start_at || null,
            promo_end_at: form.promo_end_at || null,
            sort_order: Number(form.sort_order ?? 0),
        })
    }

    return (
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
                        <Link to="/admin">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Admin
                        </Link>
                    </Button>
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        Admin Panel
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight">Top Up Settings</h1>
                    <p className="text-sm text-muted-foreground">
                        Create credit top-up packages and schedule promo visibility.
                    </p>
                </div>
                <Button onClick={resetForm}>
                    <Plus className="h-4 w-4" />
                    New package
                </Button>
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
                <section className="rounded-xl border bg-background overflow-hidden">
                    <div className="border-b px-4 py-3">
                        <h2 className="font-semibold">Credit packages</h2>
                    </div>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : packages.length === 0 ? (
                        <p className="px-4 py-12 text-center text-sm text-muted-foreground">
                            No top-up packages yet.
                        </p>
                    ) : (
                        <div className="divide-y">
                            {packages.map((pkg) => (
                                <PackageRow
                                    key={pkg.id}
                                    pkg={pkg}
                                    onEdit={() => setEditing(pkg)}
                                    onDelete={() => deletePackage.mutate(pkg.id)}
                                    deleting={deletePackage.isPending}
                                />
                            ))}
                        </div>
                    )}
                </section>

                <form onSubmit={submit} className="rounded-xl border bg-background p-4 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h2 className="font-semibold">
                                {editing ? 'Edit top-up credits' : 'Create top-up credits'}
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Promo dates are optional. Expired packages are hidden from buyers.
                            </p>
                        </div>
                        {editing && (
                            <Button type="button" variant="ghost" size="icon" onClick={resetForm}>
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    <Field label="Package name">
                        <Input
                            value={form.name}
                            onChange={(event) => updateField('name', event.target.value)}
                            placeholder="Starter promo"
                            required
                        />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Credits">
                            <Input
                                type="number"
                                min={1}
                                value={form.credits}
                                onChange={(event) =>
                                    updateField('credits', Number(event.target.value))
                                }
                                required
                            />
                        </Field>
                        <Field label="Price PHP">
                            <Input
                                type="number"
                                min={1}
                                step="0.01"
                                value={form.price}
                                onChange={(event) =>
                                    updateField('price', Number(event.target.value))
                                }
                                required
                            />
                        </Field>
                    </div>

                    <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Rate preview</span>
                            <span className="font-semibold">PHP {preview.toFixed(2)} / credit</span>
                        </div>
                    </div>

                    <Field label="Promo label">
                        <Input
                            value={form.promo_label ?? ''}
                            onChange={(event) => updateField('promo_label', event.target.value)}
                            placeholder="Limited promo"
                        />
                    </Field>

                    <div className="grid grid-cols-1 gap-3">
                        <Field label="Promo start">
                            <Input
                                type="datetime-local"
                                value={form.promo_start_at ?? ''}
                                onChange={(event) =>
                                    updateField('promo_start_at', event.target.value || null)
                                }
                            />
                        </Field>
                        <Field label="Promo end">
                            <Input
                                type="datetime-local"
                                value={form.promo_end_at ?? ''}
                                onChange={(event) =>
                                    updateField('promo_end_at', event.target.value || null)
                                }
                            />
                        </Field>
                    </div>

                    <Field label="Sort order">
                        <Input
                            type="number"
                            min={0}
                            value={form.sort_order ?? 0}
                            onChange={(event) =>
                                updateField('sort_order', Number(event.target.value))
                            }
                        />
                    </Field>

                    <label className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                        <Checkbox
                            checked={form.is_active}
                            onCheckedChange={(value) => updateField('is_active', value === true)}
                        />
                        Active package
                    </label>

                    <Button type="submit" className="w-full" disabled={savePackage.isPending}>
                        {savePackage.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        {editing ? 'Save package' : 'Create package'}
                    </Button>
                </form>
            </div>
        </div>
    )
}

function PackageRow({
    pkg,
    onEdit,
    onDelete,
    deleting,
}: {
    pkg: CreditPackage
    onEdit: () => void
    onDelete: () => void
    deleting: boolean
}) {
    return (
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <Coins className="h-4 w-4 text-amber-500" />
                    <h3 className="font-semibold">{pkg.name}</h3>
                    <Badge variant={pkg.is_active ? 'default' : 'outline'}>
                        {pkg.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant={pkg.is_visible ? 'secondary' : 'outline'}>
                        {pkg.is_visible ? 'Visible' : 'Hidden'}
                    </Badge>
                    {pkg.promo_label && <Badge variant="outline">{pkg.promo_label}</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                    {pkg.credits.toLocaleString()} credits for PHP {Number(pkg.price).toFixed(2)}
                    {' · '}
                    PHP {(Number(pkg.price) / Math.max(1, pkg.credits)).toFixed(2)} per credit
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Promo: {formatDate(pkg.promo_start_at) || 'Now'} to{' '}
                    {formatDate(pkg.promo_end_at) || 'No end'} · Sort {pkg.sort_order ?? 0}
                </p>
            </div>
            <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onEdit}>
                    <Pencil className="h-4 w-4" />
                    Edit
                </Button>
                <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={onDelete}
                    disabled={deleting}
                >
                    <Trash2 className="h-4 w-4" />
                    Delete
                </Button>
            </div>
        </div>
    )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            {children}
        </div>
    )
}

function toDatetimeLocal(value?: string | null) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function formatDate(value?: string | null) {
    if (!value) return ''
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value))
}

function firstValidationError(errors?: Record<string, string[]>) {
    if (!errors) return null
    const first = Object.values(errors)[0]
    return first?.[0] ?? null
}
