import * as yup from 'yup'

export const violationSchema = yup.object({
    reason: yup
        .string()
        .min(10, 'Reason must be at least 10 characters')
        .max(255, 'Reason too long')
        .required('Reason is required'),
})

export type ViolationFormData = yup.InferType<typeof violationSchema>
