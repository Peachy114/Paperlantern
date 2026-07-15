import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { getPaymentSettings, updatePaymentSettings, type PaymentSettings as PaymentSettingsType } from '@/api/wallet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const EMPTY: PaymentSettingsType = {
    gcash: { account_name: '', account_number: '' },
    maya: { account_name: '', account_number: '' },
}

export default function PaymentSettings() {
    const queryClient = useQueryClient()
    const [form, setForm] = useState<PaymentSettingsType>(EMPTY)

    const { data, isLoading } = useQuery({
        queryKey: ['payment-settings'],
        queryFn: getPaymentSettings,
    })

    useEffect(() => {
        if (data?.payment_settings) setForm(data.payment_settings)
    }, [data])

    const save = useMutation({
        mutationFn: () => updatePaymentSettings(form),
        onSuccess: () => {
            toast.success('Payment settings saved.')
            queryClient.invalidateQueries({ queryKey: ['payment-settings'] })
        },
        onError: () => toast.error('Could not save payment settings.'),
    })

    function setField(method: 'gcash' | 'maya', key: 'account_name' | 'account_number', value: string) {
        setForm((current) => ({
            ...current,
            [method]: {
                ...current[method],
                [key]: value,
            },
        }))
    }

    return (
        <div className="mx-auto max-w-2xl px-4 py-8">
            <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
                <Link to="/settings">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Settings
                </Link>
            </Button>
            <div className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight">Payment Settings</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Save GCash and Maya details for withdrawals. Bank transfer details are filled
                    every time for safety.
                </p>
            </div>

            <div className="space-y-4 rounded-xl border bg-background p-4">
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        <PaymentBlock
                            title="GCash"
                            name={form.gcash.account_name}
                            number={form.gcash.account_number}
                            onName={(value) => setField('gcash', 'account_name', value)}
                            onNumber={(value) => setField('gcash', 'account_number', value)}
                        />
                        <PaymentBlock
                            title="Maya"
                            name={form.maya.account_name}
                            number={form.maya.account_number}
                            onName={(value) => setField('maya', 'account_name', value)}
                            onNumber={(value) => setField('maya', 'account_number', value)}
                        />
                        <Button onClick={() => save.mutate()} disabled={save.isPending}>
                            {save.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Save Payment Settings
                        </Button>
                    </>
                )}
            </div>
        </div>
    )
}

function PaymentBlock({
    title,
    name,
    number,
    onName,
    onNumber,
}: {
    title: string
    name: string
    number: string
    onName: (value: string) => void
    onNumber: (value: string) => void
}) {
    return (
        <section className="rounded-lg border p-3">
            <h2 className="mb-3 text-sm font-semibold">{title}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label>Account name</Label>
                    <Input value={name} onChange={(event) => onName(event.target.value)} />
                </div>
                <div className="space-y-1.5">
                    <Label>Account number</Label>
                    <Input value={number} onChange={(event) => onNumber(event.target.value)} />
                </div>
            </div>
        </section>
    )
}
