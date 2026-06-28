import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { authApi } from '@/api/auth'

const schema = yup.object({
    current_password: yup.string().required('Current password is required'),
    password: yup.string().required('New password is required').min(8, 'Minimum 8 characters'),
    password_confirmation: yup
        .string()
        .oneOf([yup.ref('password')], 'Passwords do not match')
        .required('Please confirm your password'),
})

type PasswordFields = yup.InferType<typeof schema>

export function usePasswordForm() {
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<PasswordFields>({
        resolver: yupResolver(schema),
    })

    const mutation = useMutation({
        mutationFn: (data: PasswordFields) => authApi.updatePassword(data),
        onSuccess: () => {
            setSuccess(true)
            setError(null)
            reset()
        },
        onError: (err: any) => {
            setError(err?.response?.data?.message ?? 'Failed to update password.')
            setSuccess(false)
        },
    })

    return {
        register,
        handleSubmit: handleSubmit((data) => mutation.mutate(data)),
        errors,
        loading: mutation.isPending,
        error,
        success,
    }
}
