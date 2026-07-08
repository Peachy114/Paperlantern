import * as yup from 'yup'

const CATEGORY_VALUES = ['bug', 'account', 'payment', 'other'] as const

export const createTicketSchema = yup.object({
    category: yup
        .string()
        .oneOf(CATEGORY_VALUES, 'Invalid category')
        .required('Category is required'),
    subject: yup
        .string()
        .max(255, 'Subject must be under 255 characters')
        .required('Subject is required'),
    message: yup
        .string()
        .max(2000, 'Message must be under 2000 characters')
        .required('Message is required'),
})

export type CreateTicketFormValues = yup.InferType<typeof createTicketSchema>
