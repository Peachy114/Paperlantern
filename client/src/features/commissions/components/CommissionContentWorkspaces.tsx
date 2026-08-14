import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import type { CommissionProfile } from '@/types/art'
import type {
    ConfirmAction,
    InfoQuestion,
    PromoDiscount,
    RequestQuestion,
} from '@/features/commissions/types/studioCommission'
import { CommissionRichTextBlock as RichTextBlock } from '@/features/commissions/components/CommissionRichTextEditor'
import { SelectField } from '@/features/commissions/components/ServiceFormFields'
import { ConfirmActionDialog } from '@/features/commissions/components/CommissionDashboard'
import {
    DiscountsSection,
    InfoQuestionsSection,
    RequestQuestionsSection,
} from '@/features/commissions/components/ServiceEditorSections'
import {
    makeCommissionLocalId,
    normalizePromoDiscounts,
    normalizeRequestQuestions,
} from '@/features/commissions/utils/serviceForm'

// Commission content workspaces ----
export function CommissionPoliciesSection({
    profile,
    busy,
    onSave,
}: {
    profile: CommissionProfile
    busy: boolean
    onSave: (policies: Record<string, string>) => void
}) {
    const [policies, setPolicies] = useState({
        terms: profile.policies?.terms ?? profile.terms ?? '',
        refund_policy:
            profile.policies?.refund_policy ??
            '100% refund if no sketch/work has been sent. 50% refund once the first sketch/work has started.',
        required_references: profile.policies?.required_references ?? '',
    })

    const setPolicy = (key: keyof typeof policies, value: string) =>
        setPolicies((current) => ({ ...current, [key]: value }))

    return (
        <section className="rounded-[24px] border border-border bg-background p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <div className="mb-4">
                <h2 className="text-base font-semibold">Policies</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Terms, refund policy, and required references. Use headings, bold markers, and
                    bullets to keep it readable.
                </p>
            </div>
            <Tabs defaultValue="terms" className="space-y-4">
                <TabsList className="flex h-auto w-full flex-wrap justify-start">
                    <TabsTrigger value="terms">Terms of Service</TabsTrigger>
                    <TabsTrigger value="refund">Refund policy</TabsTrigger>
                    <TabsTrigger value="references">Required references</TabsTrigger>
                </TabsList>
                <TabsContent value="terms" className="mt-0">
                    <RichTextBlock
                        label="Terms of Service"
                        value={policies.terms}
                        onChange={(value) => setPolicy('terms', value)}
                        onFormat={(prefix, suffix = '') =>
                            setPolicy(
                                'terms',
                                policies.terms ? `${prefix}${policies.terms}${suffix}` : prefix
                            )
                        }
                    />
                </TabsContent>
                <TabsContent value="refund" className="mt-0">
                    <RichTextBlock
                        label="Refund policy"
                        value={policies.refund_policy}
                        onChange={(value) => setPolicy('refund_policy', value)}
                        onFormat={(prefix, suffix = '') =>
                            setPolicy(
                                'refund_policy',
                                policies.refund_policy
                                    ? `${prefix}${policies.refund_policy}${suffix}`
                                    : prefix
                            )
                        }
                    />
                </TabsContent>
                <TabsContent value="references" className="mt-0">
                    <RichTextBlock
                        label="Required references"
                        value={policies.required_references}
                        onChange={(value) => setPolicy('required_references', value)}
                        onFormat={(prefix, suffix = '') =>
                            setPolicy(
                                'required_references',
                                policies.required_references
                                    ? `${prefix}${policies.required_references}${suffix}`
                                    : prefix
                            )
                        }
                    />
                </TabsContent>
            </Tabs>
            <Button className="mt-4" disabled={busy} onClick={() => onSave(policies)}>
                {busy ? 'Saving...' : 'Save policies'}
            </Button>
        </section>
    )
}

export function CommissionFormsWorkspace({
    profile,
    busy,
    onSave,
}: {
    profile: CommissionProfile
    busy: boolean
    onSave: (forms: RequestQuestion[]) => void
}) {
    const [forms, setForms] = useState<RequestQuestion[]>(
        normalizeRequestQuestions(profile.request_forms)
    )
    const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
    const [adding, setAdding] = useState(false)
    const [draft, setDraft] = useState<RequestQuestion>({
        id: makeCommissionLocalId(),
        title: '',
        description: '',
        type: 'textarea',
        required: false,
        options: [],
    })

    const openAdd = () => {
        setDraft({
            id: makeCommissionLocalId(),
            title: '',
            description: '',
            type: 'textarea',
            required: false,
            options: [],
        })
        setAdding(true)
    }

    const addDraft = () => {
        if (!draft.title.trim()) {
            toast.error('Question title is required.')
            return
        }
        setForms((current) => [...current, draft])
        setAdding(false)
    }

    const requestRemoveForm = (index: number) => {
        const title = forms[index]?.title || 'this question'
        setConfirmAction({
            title: 'Delete saved question?',
            description: `Remove "${title}" from your reusable commission forms?`,
            confirmLabel: 'Delete question',
            destructive: true,
            onConfirm: () =>
                setForms((current) =>
                    current.filter((_, questionIndex) => questionIndex !== index)
                ),
        })
    }

    return (
        <section className="rounded-[24px] border border-border bg-background p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <RequestQuestionsSection
                questions={forms}
                onAdd={openAdd}
                onUpdate={(index, patch) =>
                    setForms((current) =>
                        current.map((question, questionIndex) =>
                            questionIndex === index ? { ...question, ...patch } : question
                        )
                    )
                }
                onRemove={requestRemoveForm}
            />
            <Button className="mt-4" disabled={busy} onClick={() => onSave(forms)}>
                {busy ? 'Saving...' : 'Save forms'}
            </Button>
            <Dialog open={adding} onOpenChange={setAdding}>
                <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add question</DialogTitle>
                        <DialogDescription>
                            Save a reusable question that can be attached to a commission service.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                        <div>
                            <Label>Question</Label>
                            <Input
                                value={draft.title}
                                onChange={(event) =>
                                    setDraft((current) => ({
                                        ...current,
                                        title: event.target.value,
                                    }))
                                }
                                placeholder="How will you use this commission?"
                            />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Textarea
                                value={draft.description}
                                onChange={(event) =>
                                    setDraft((current) => ({
                                        ...current,
                                        description: event.target.value,
                                    }))
                                }
                                className="min-h-20"
                                placeholder="Optional helper text."
                            />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <SelectField
                                label="Answer type"
                                value={draft.type}
                                options={[
                                    ['textarea', 'Textarea'],
                                    ['short_text', 'Short text'],
                                    ['multiple_choice', 'Multiple choice'],
                                    ['date', 'Date'],
                                    ['checkbox', 'Checkbox'],
                                ]}
                                onChange={(value) =>
                                    setDraft((current) => ({
                                        ...current,
                                        type: value as RequestQuestion['type'],
                                    }))
                                }
                            />
                            <label className="mt-6 flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={draft.required}
                                    onChange={(event) =>
                                        setDraft((current) => ({
                                            ...current,
                                            required: event.target.checked,
                                        }))
                                    }
                                />
                                Required
                            </label>
                        </div>
                        {draft.type === 'multiple_choice' && (
                            <div>
                                <Label>Options</Label>
                                <Textarea
                                    value={draft.options.join('\n')}
                                    onChange={(event) =>
                                        setDraft((current) => ({
                                            ...current,
                                            options: event.target.value
                                                .split(/\r?\n/)
                                                .map((option) => option.trim())
                                                .filter(Boolean),
                                        }))
                                    }
                                    className="min-h-24"
                                    placeholder={'One option per line'}
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setAdding(false)}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={addDraft}>
                            Add question
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <ConfirmActionDialog
                action={confirmAction}
                busy={busy}
                onOpenChange={(open) => {
                    if (!open) setConfirmAction(null)
                }}
            />
        </section>
    )
}

export function CommissionFaqWorkspace({
    profile,
    busy,
    onSave,
}: {
    profile: CommissionProfile
    busy: boolean
    onSave: (faqs: InfoQuestion[]) => void
}) {
    const [faqs, setFaqs] = useState<InfoQuestion[]>(profile.faqs ?? [])
    const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)

    const requestRemoveFaq = (index: number) => {
        const title = faqs[index]?.question || 'this Q&A'
        setConfirmAction({
            title: 'Delete public Q&A?',
            description: `Remove "${title}" from your commission FAQ?`,
            confirmLabel: 'Delete Q&A',
            destructive: true,
            onConfirm: () =>
                setFaqs((current) => current.filter((_, itemIndex) => itemIndex !== index)),
        })
    }

    return (
        <section className="rounded-[24px] border border-border bg-background p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <InfoQuestionsSection
                items={faqs}
                onAdd={() =>
                    setFaqs((current) => [
                        ...current,
                        {
                            id: makeCommissionLocalId(),
                            question: 'Question clients often ask',
                            answer: 'Answer wanderers can read before requesting.',
                        },
                    ])
                }
                onUpdate={(index, patch) =>
                    setFaqs((current) =>
                        current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, ...patch } : item
                        )
                    )
                }
                onRemove={requestRemoveFaq}
            />
            <Button className="mt-4" disabled={busy} onClick={() => onSave(faqs)}>
                {busy ? 'Saving...' : 'Save FAQ'}
            </Button>
            <ConfirmActionDialog
                action={confirmAction}
                busy={busy}
                onOpenChange={(open) => {
                    if (!open) setConfirmAction(null)
                }}
            />
        </section>
    )
}

export function CommissionDiscountWorkspace({
    profile,
    busy,
    onSave,
}: {
    profile: CommissionProfile
    busy: boolean
    onSave: (discounts: PromoDiscount[]) => void
}) {
    const [discounts, setDiscounts] = useState<PromoDiscount[]>(
        normalizePromoDiscounts(profile.discounts)
    )
    const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
    const [adding, setAdding] = useState(false)
    const [draft, setDraft] = useState<PromoDiscount>({
        id: makeCommissionLocalId(),
        label: 'Opening promo',
        type: 'percent',
        amount: 10,
        starts_at: '',
        ends_at: '',
        active: true,
    })

    const openAdd = () => {
        setDraft({
            id: makeCommissionLocalId(),
            label: 'Opening promo',
            type: 'percent',
            amount: 10,
            starts_at: '',
            ends_at: '',
            active: true,
        })
        setAdding(true)
    }

    const addDraft = () => {
        if (!draft.label.trim()) {
            toast.error('Discount name is required.')
            return
        }
        setDiscounts((current) => [...current, draft])
        setAdding(false)
    }

    const requestRemoveDiscount = (index: number) => {
        const title = discounts[index]?.label || 'this discount'
        setConfirmAction({
            title: 'Delete discount?',
            description: `Remove "${title}" from your reusable commission promotions?`,
            confirmLabel: 'Delete discount',
            destructive: true,
            onConfirm: () =>
                setDiscounts((current) =>
                    current.filter((_, discountIndex) => discountIndex !== index)
                ),
        })
    }

    return (
        <section className="rounded-[24px] border border-border bg-background p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <DiscountsSection
                discounts={discounts}
                onAdd={openAdd}
                onUpdate={(index, patch) =>
                    setDiscounts((current) =>
                        current.map((discount, discountIndex) =>
                            discountIndex === index ? { ...discount, ...patch } : discount
                        )
                    )
                }
                onRemove={requestRemoveDiscount}
            />
            <Button className="mt-4" disabled={busy} onClick={() => onSave(discounts)}>
                {busy ? 'Saving...' : 'Save discounts'}
            </Button>
            <Dialog open={adding} onOpenChange={setAdding}>
                <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add discount</DialogTitle>
                        <DialogDescription>
                            Create a promo the artist can attach to commission services.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                        <div>
                            <Label>Discount name</Label>
                            <Input
                                value={draft.label}
                                onChange={(event) =>
                                    setDraft((current) => ({
                                        ...current,
                                        label: event.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <SelectField
                                label="Type"
                                value={draft.type}
                                options={[
                                    ['percent', 'Percent'],
                                    ['fixed', 'Fixed credits'],
                                ]}
                                onChange={(value) =>
                                    setDraft((current) => ({
                                        ...current,
                                        type: value as PromoDiscount['type'],
                                    }))
                                }
                            />
                            <div>
                                <Label>Amount</Label>
                                <Input
                                    type="number"
                                    value={draft.amount}
                                    onChange={(event) =>
                                        setDraft((current) => ({
                                            ...current,
                                            amount: Number(event.target.value),
                                        }))
                                    }
                                />
                            </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <Label>Promo start</Label>
                                <Input
                                    type="date"
                                    value={draft.starts_at}
                                    onChange={(event) =>
                                        setDraft((current) => ({
                                            ...current,
                                            starts_at: event.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div>
                                <Label>Promo end</Label>
                                <Input
                                    type="date"
                                    value={draft.ends_at}
                                    onChange={(event) =>
                                        setDraft((current) => ({
                                            ...current,
                                            ends_at: event.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={draft.active}
                                onChange={(event) =>
                                    setDraft((current) => ({
                                        ...current,
                                        active: event.target.checked,
                                    }))
                                }
                            />
                            Active
                        </label>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setAdding(false)}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={addDraft}>
                            Add discount
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <ConfirmActionDialog
                action={confirmAction}
                busy={busy}
                onOpenChange={(open) => {
                    if (!open) setConfirmAction(null)
                }}
            />
        </section>
    )
}


