import { useState, type ReactNode } from 'react'
import { ChevronDown, PlusCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type {
    ClientFields,
    ConfirmAction,
    InfoQuestion,
    PromoDiscount,
    RequestQuestion,
} from '@/features/commissions/types/studioCommission'
import { ToggleLine } from '@/features/commissions/components/ServiceFormFields'
import { ConfirmActionDialog } from '@/features/commissions/components/CommissionDashboard'
import {
    DEFAULT_LICENSE_QUESTION,
    defaultLicenseOptions,
} from '@/features/commissions/constants/serviceEditor'

// Service editor sections ----
export function RequestQuestionsSection({
    questions,
    onAdd,
    onUpdate,
    onRemove,
}: {
    questions: RequestQuestion[]
    onAdd: () => void
    onUpdate: (index: number, patch: Partial<RequestQuestion>) => void
    onRemove: (index: number) => void
}) {
    const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
    const handleQuestionTypeChange = (questionIndex: number, type: RequestQuestion['type']) => {
        const currentQuestion = questions[questionIndex]

        onUpdate(questionIndex, {
            type,
            options:
                type === 'multiple_choice'
                    ? currentQuestion.options.length > 0
                        ? currentQuestion.options
                        : ['Option 1']
                    : [],
        })
    }

    const handleAddOption = (questionIndex: number) => {
        const currentOptions = questions[questionIndex].options

        onUpdate(questionIndex, {
            options: [...currentOptions, `Option ${currentOptions.length + 1}`],
        })
    }

    const handleUpdateOption = (questionIndex: number, optionIndex: number, value: string) => {
        const updatedOptions = questions[questionIndex].options.map((option, index) =>
            index === optionIndex ? value : option
        )

        onUpdate(questionIndex, {
            options: updatedOptions,
        })
    }

    const removeOption = (questionIndex: number, optionIndex: number) => {
        const updatedOptions = questions[questionIndex].options.filter(
            (_, index) => index !== optionIndex
        )

        onUpdate(questionIndex, {
            options: updatedOptions,
        })
    }

    const confirmRemoveOption = (questionIndex: number, optionIndex: number) => {
        const option = questions[questionIndex]?.options[optionIndex] || `Option ${optionIndex + 1}`
        setConfirmAction({
            title: 'Delete option?',
            description: `Remove "${option}" from this question?`,
            confirmLabel: 'Delete option',
            destructive: true,
            onConfirm: () => removeOption(questionIndex, optionIndex),
        })
    }

    return (
        <div className="rounded-lg border p-3">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-sm font-semibold">Request form questions</h3>

                    <p className="text-xs text-muted-foreground">
                        Ask wanderers for the details you need before quoting.
                    </p>
                </div>

                <Button type="button" size="sm" variant="outline" onClick={onAdd}>
                    <PlusCircle className="h-4 w-4" />
                    Add question
                </Button>
            </div>

            <div className="grid gap-3">
                {questions.map((question, questionIndex) => (
                    <div key={question.id} className="rounded-lg border bg-muted/20 p-3">
                        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_170px]">
                            <Input
                                value={question.title}
                                onChange={(event) =>
                                    onUpdate(questionIndex, {
                                        title: event.target.value,
                                    })
                                }
                                placeholder="Question title"
                            />

                            <select
                                value={question.type}
                                onChange={(event) =>
                                    handleQuestionTypeChange(
                                        questionIndex,
                                        event.target.value as RequestQuestion['type']
                                    )
                                }
                                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                            >
                                <option value="textarea">Textarea</option>

                                <option value="short_text">Short text</option>

                                <option value="multiple_choice">Multiple choice</option>

                                <option value="date">Date</option>

                                <option value="checkbox">Checkbox</option>
                            </select>
                        </div>

                        <Textarea
                            value={question.description}
                            onChange={(event) =>
                                onUpdate(questionIndex, {
                                    description: event.target.value,
                                })
                            }
                            className="mt-2 min-h-16"
                            placeholder="Optional helper text or description"
                        />

                        {question.type === 'multiple_choice' && (
                            <div className="mt-3 rounded-lg border bg-background p-3">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <div>
                                        <h4 className="text-sm font-medium">
                                            Multiple-choice options
                                        </h4>

                                        <p className="text-xs text-muted-foreground">
                                            Add the choices the user can select from.
                                        </p>
                                    </div>

                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleAddOption(questionIndex)}
                                    >
                                        <PlusCircle className="h-4 w-4" />
                                        Add option
                                    </Button>
                                </div>

                                <div className="grid gap-2">
                                    {question.options.map((option, optionIndex) => (
                                        <div
                                            key={`${question.id}-option-${optionIndex}`}
                                            className="flex items-center gap-2"
                                        >
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-muted/30 text-xs font-semibold text-muted-foreground">
                                                {optionIndex + 1}
                                            </div>

                                            <Input
                                                value={option}
                                                onChange={(event) =>
                                                    handleUpdateOption(
                                                        questionIndex,
                                                        optionIndex,
                                                        event.target.value
                                                    )
                                                }
                                                placeholder={`Option ${optionIndex + 1}`}
                                            />

                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() =>
                                                    confirmRemoveOption(questionIndex, optionIndex)
                                                }
                                                aria-label={`Delete option ${optionIndex + 1}`}
                                                title="Delete option"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}

                                    {question.options.length === 0 && (
                                        <div className="rounded-lg border border-dashed p-4 text-center">
                                            <p className="text-sm text-muted-foreground">
                                                No options added yet.
                                            </p>

                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="mt-3"
                                                onClick={() => handleAddOption(questionIndex)}
                                            >
                                                <PlusCircle className="h-4 w-4" />
                                                Create first option
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {question.type === 'checkbox' && (
                            <div className="mt-3 rounded-lg border bg-background p-3">
                                <label className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        disabled
                                        className="mt-0.5 h-4 w-4 rounded border"
                                    />

                                    <div>
                                        <p className="text-sm font-medium">
                                            {question.title || 'Checkbox question'}
                                        </p>

                                        <p className="text-xs text-muted-foreground">
                                            The user can check or uncheck this single option.
                                        </p>
                                    </div>
                                </label>
                            </div>
                        )}

                        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={question.required}
                                    onChange={(event) =>
                                        onUpdate(questionIndex, {
                                            required: event.target.checked,
                                        })
                                    }
                                    className="h-4 w-4 rounded border"
                                />
                                Required
                            </label>

                            <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => onRemove(questionIndex)}
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete question
                            </Button>
                        </div>
                    </div>
                ))}

                {questions.length === 0 && (
                    <div className="rounded-lg border border-dashed p-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            No custom request questions yet.
                        </p>

                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="mt-3"
                            onClick={onAdd}
                        >
                            <PlusCircle className="h-4 w-4" />
                            Create first question
                        </Button>
                    </div>
                )}
            </div>
            <ConfirmActionDialog
                action={confirmAction}
                busy={false}
                onOpenChange={(open) => {
                    if (!open) setConfirmAction(null)
                }}
            />
        </div>
    )
}

export function InfoQuestionsSection({
    items,
    onAdd,
    onUpdate,
    onRemove,
}: {
    items: InfoQuestion[]
    onAdd: () => void
    onUpdate: (index: number, patch: Partial<InfoQuestion>) => void
    onRemove: (index: number) => void
}) {
    return (
        <div className="rounded-lg border p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold">Public questions and answers</h3>
                    <p className="text-xs text-muted-foreground">
                        Show helpful answers before wanderers request.
                    </p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={onAdd}>
                    Add Q&A
                </Button>
            </div>
            <div className="grid gap-3">
                {items.map((item, index) => (
                    <div key={item.id} className="rounded-lg border bg-muted/20 p-3">
                        <Input
                            value={item.question}
                            onChange={(event) => onUpdate(index, { question: event.target.value })}
                            placeholder="Question"
                        />
                        <Textarea
                            value={item.answer}
                            onChange={(event) => onUpdate(index, { answer: event.target.value })}
                            className="mt-2 min-h-20"
                            placeholder="Answer"
                        />
                        <div className="mt-2 flex justify-end">
                            <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => onRemove(index)}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                ))}
                {items.length === 0 && (
                    <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                        No public Q&A yet.
                    </p>
                )}
            </div>
        </div>
    )
}

export function LicenseSection({
    questions,
    onUpdate,
    onAdd,
}: {
    questions: RequestQuestion[]
    onUpdate: (index: number, patch: Partial<RequestQuestion>) => void
    onAdd: () => void
}) {
    const licenseIndex = questions.findIndex(
        (question) => question.id === DEFAULT_LICENSE_QUESTION.id
    )
    const license = licenseIndex >= 0 ? questions[licenseIndex] : null
    const [customLicense, setCustomLicense] = useState('')

    if (!license) {
        return (
            <div className="rounded-lg border border-dashed p-6 text-center">
                <h3 className="text-sm font-semibold">Licenses</h3>
                <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">
                    Add the default license question so wanderers can choose Personal, Commercial
                    Content, or Commercial Merchandising.
                </p>
                <Button type="button" className="mt-4" variant="outline" onClick={onAdd}>
                    Add default licenses
                </Button>
            </div>
        )
    }

    const selectedOptions = license.options ?? []
    const defaultOptions = defaultLicenseOptions()
    const customOptions = selectedOptions.filter((option) => !defaultOptions.includes(option))
    const visibleOptions = [...defaultOptions, ...customOptions]

    const toggleLicense = (option: string, checked: boolean) => {
        const next = checked
            ? [...selectedOptions, option]
            : selectedOptions.filter((item) => item !== option)

        onUpdate(licenseIndex, { options: Array.from(new Set(next)) })
    }

    const addCustomLicense = () => {
        const value = customLicense.trim()
        if (!value) {
            toast.error('Write the custom license first.')
            return
        }

        toggleLicense(value, true)
        setCustomLicense('')
    }

    return (
        <div className="rounded-lg border p-3">
            <div className="mb-3">
                <h3 className="text-sm font-semibold">Licenses</h3>
                <p className="text-xs text-muted-foreground">
                    This appears in the wanderer request form.
                </p>
            </div>
            <div className="grid gap-3">
                <div>
                    <Label>Question</Label>
                    <Input
                        value={license.title}
                        onChange={(event) => onUpdate(licenseIndex, { title: event.target.value })}
                    />
                </div>
                <div>
                    <Label>Helper text</Label>
                    <Input
                        value={license.description}
                        onChange={(event) =>
                            onUpdate(licenseIndex, { description: event.target.value })
                        }
                    />
                </div>
                <div className="space-y-2">
                    <Label>License choices</Label>
                    {visibleOptions.map((option) => {
                        const checked = selectedOptions.includes(option)
                        const isCustom = !defaultOptions.includes(option)

                        return (
                            <div
                                key={option}
                                className="flex items-center gap-3 rounded-lg border px-3 py-2"
                            >
                                <label className="flex flex-1 items-start gap-3 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(event) =>
                                            toggleLicense(option, event.target.checked)
                                        }
                                        className="mt-0.5 h-4 w-4"
                                    />
                                    <span>
                                        <span className="font-medium">
                                            {licenseOptionTitle(option)}
                                        </span>
                                        <span className="mt-0.5 block text-xs text-muted-foreground">
                                            {licenseOptionDescription(option)}
                                        </span>
                                    </span>
                                </label>
                                {isCustom && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => toggleLicense(option, false)}
                                    >
                                        Remove
                                    </Button>
                                )}
                            </div>
                        )
                    })}
                    <div className="flex gap-2">
                        <Input
                            value={customLicense}
                            onChange={(event) => setCustomLicense(event.target.value)}
                            placeholder="Other license, for example NDA required or streaming allowed"
                        />
                        <Button type="button" variant="outline" onClick={addCustomLicense}>
                            Add custom
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Toggle the license choices that wanderers can select. Custom licenses appear
                        with the defaults.
                    </p>
                </div>
                <ToggleLine
                    label="Required"
                    checked={license.required}
                    onChange={(checked) => onUpdate(licenseIndex, { required: checked })}
                />
            </div>
        </div>
    )
}

function licenseOptionTitle(option: string) {
    return option.split(' - ')[0] ?? option
}

function licenseOptionDescription(option: string) {
    const [, description] = option.split(' - ')
    return description ?? option
}

export function ClientFieldsSection({
    fields,
    onUpdate,
}: {
    fields: ClientFields
    onUpdate: (field: keyof ClientFields, patch: Partial<ClientFields[keyof ClientFields]>) => void
}) {
    const labels: Record<keyof ClientFields, string> = {
        name: 'Name',
        username: 'Username',
        email: 'Email',
        discord: 'Discord',
        twitter: 'Twitter / X',
        instagram: 'Instagram',
        facebook: 'Facebook',
        tiktok: 'TikTok',
    }

    return (
        <div className="rounded-lg border p-3">
            <h3 className="text-sm font-semibold">Wanderer details</h3>
            <p className="mb-3 text-xs text-muted-foreground">
                Choose what contact details the artist may collect.
            </p>
                <div className="grid gap-2">
                <div className="grid items-center gap-2 rounded-lg border px-3 py-2 text-sm md:grid-cols-[1fr_auto]">
                    <span>{labels.name}</span>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={fields.name.required}
                            onChange={(event) =>
                                onUpdate('name', {
                                    collect: true,
                                    required: event.target.checked,
                                })
                            }
                            className="h-4 w-4"
                        />
                        Required / not
                    </label>
                </div>
                <div className="grid items-center gap-2 rounded-lg border px-3 py-2 text-sm md:grid-cols-[1fr_auto]">
                    <span>{labels.username}</span>
                    <span className="text-xs text-muted-foreground">
                        Always shared from the wanderer account
                    </span>
                </div>
                <div className="grid items-center gap-2 rounded-lg border px-3 py-2 text-sm md:grid-cols-[1fr_auto_auto]">
                    <span>{labels.email}</span>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={fields.email.required}
                            onChange={(event) =>
                                onUpdate('email', {
                                    collect: true,
                                    required: event.target.checked,
                                })
                            }
                            className="h-4 w-4"
                        />
                        Required for guest
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={fields.email.required}
                            onChange={(event) =>
                                onUpdate('email', {
                                    collect: true,
                                    required: event.target.checked,
                                })
                            }
                            className="h-4 w-4"
                        />
                        Required for wanderers
                    </label>
                </div>
                {(['discord', 'twitter', 'instagram', 'facebook', 'tiktok'] as Array<keyof ClientFields>).map(
                    (field) => (
                        <div
                            key={field}
                            className="grid items-center gap-2 rounded-lg border px-3 py-2 text-sm md:grid-cols-[1fr_auto_auto]"
                        >
                            <span>{labels[field]}</span>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={fields[field].collect}
                                    onChange={(event) =>
                                        onUpdate(field, { collect: event.target.checked })
                                    }
                                    className="h-4 w-4"
                                />
                                Collect
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={fields[field].required}
                                    disabled={!fields[field].collect}
                                    onChange={(event) =>
                                        onUpdate(field, { required: event.target.checked })
                                    }
                                    className="h-4 w-4"
                                />
                                Required / not
                            </label>
                        </div>
                    )
                )}
            </div>
        </div>
    )
}

export function DiscountsSection({
    discounts,
    onAdd,
    onUpdate,
    onRemove,
}: {
    discounts: PromoDiscount[]
    onAdd: () => void
    onUpdate: (index: number, patch: Partial<PromoDiscount>) => void
    onRemove: (index: number) => void
}) {
    return (
        <div className="rounded-lg border p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold">Discount promos</h3>
                    <p className="text-xs text-muted-foreground">
                        Create optional promo discounts for this service.
                    </p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={onAdd}>
                    Add discount
                </Button>
            </div>
            <div className="grid gap-3">
                {discounts.map((discount, index) => (
                    <div
                        key={discount.id}
                        className="grid gap-2 rounded-lg border bg-muted/20 p-3 md:grid-cols-[1fr_120px_120px_150px_150px_auto]"
                    >
                        <Input
                            value={discount.label}
                            onChange={(event) => onUpdate(index, { label: event.target.value })}
                            placeholder="Promo name"
                        />
                        <select
                            value={discount.type}
                            onChange={(event) =>
                                onUpdate(index, {
                                    type: event.target.value as PromoDiscount['type'],
                                })
                            }
                            className="h-10 rounded-md border bg-background px-3 text-sm"
                        >
                            <option value="percent">Percent</option>
                            <option value="fixed">Fixed</option>
                        </select>
                        <Input
                            type="number"
                            value={discount.amount}
                            onChange={(event) =>
                                onUpdate(index, { amount: Number(event.target.value) })
                            }
                        />
                        <Input
                            type="date"
                            value={discount.starts_at}
                            onChange={(event) => onUpdate(index, { starts_at: event.target.value })}
                        />
                        <Input
                            type="date"
                            value={discount.ends_at}
                            onChange={(event) => onUpdate(index, { ends_at: event.target.value })}
                        />
                        <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => onRemove(index)}
                        >
                            Delete
                        </Button>
                    </div>
                ))}
                {discounts.length === 0 && (
                    <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                        No discount promos yet.
                    </p>
                )}
            </div>
        </div>
    )
}

export function CommissionAccordion({ title, children }: { title: string; children: ReactNode }) {
    return (
        <Collapsible defaultOpen className="rounded-lg border">
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-semibold">
                {title}
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </CollapsibleTrigger>
            <CollapsibleContent className="border-t px-3 py-3">{children}</CollapsibleContent>
        </Collapsible>
    )
}



