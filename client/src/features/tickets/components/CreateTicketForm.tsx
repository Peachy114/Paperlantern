import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { createTicketSchema, type CreateTicketFormValues } from '../schemas/ticket.schema'
import { useCreateTicket } from '../hooks/useCreateTicket'
import { TICKET_CATEGORIES } from '../constants'

export default function CreateTicketForm({ onCreated }: { onCreated?: () => void }) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors: formErrors },
    } = useForm<CreateTicketFormValues>({
        resolver: yupResolver(createTicketSchema),
        defaultValues: { category: 'bug', subject: '', message: '' },
    })

    const { createTicket, errors: serverErrors, submitting, success } = useCreateTicket()

    const onSubmit = async (values: CreateTicketFormValues) => {
        const ok = await createTicket(values)
        if (ok) {
            reset()
            onCreated?.()
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <label htmlFor="category" className="block text-sm font-medium mb-1">
                    Category
                </label>
                <select
                    id="category"
                    {...register('category')}
                    className="w-full border rounded-md px-3 py-2"
                >
                    {TICKET_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                            {c.label}
                        </option>
                    ))}
                </select>
                {formErrors.category && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.category.message}</p>
                )}
            </div>

            <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-1">
                    Subject
                </label>
                <input
                    id="subject"
                    type="text"
                    {...register('subject')}
                    className="w-full border rounded-md px-3 py-2"
                />
                {formErrors.subject && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.subject.message}</p>
                )}
                {serverErrors.subject && (
                    <p className="text-sm text-red-500 mt-1">{serverErrors.subject[0]}</p>
                )}
            </div>

            <div>
                <label htmlFor="message" className="block text-sm font-medium mb-1">
                    Message
                </label>
                <textarea
                    id="message"
                    {...register('message')}
                    rows={5}
                    className="w-full border rounded-md px-3 py-2"
                />
                {formErrors.message && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.message.message}</p>
                )}
                {serverErrors.message && (
                    <p className="text-sm text-red-500 mt-1">{serverErrors.message[0]}</p>
                )}
            </div>

            {serverErrors.general && (
                <p className="text-sm text-red-500">{serverErrors.general[0]}</p>
            )}
            {success && <p className="text-sm text-green-600">Ticket submitted successfully.</p>}

            <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50"
            >
                {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
        </form>
    )
}
