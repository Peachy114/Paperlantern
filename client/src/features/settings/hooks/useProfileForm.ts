import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth'
import type { CreatorFeature } from '@/store/authStore'

const schema = yup.object({
    name: yup.string().required('Full name is required').max(255),
    username: yup.string().required('Username is required').max(50),
    email: yup.string().required('Email is required').email('Enter a valid email address'),
    account_menu_style: yup
        .mixed<'circular' | 'detailed'>()
        .oneOf(['circular', 'detailed'])
        .required(),
    bio: yup.string().max(500).nullable().optional(),
    twitter_url: yup.string().url('Enter a valid URL').nullable().optional(),
    discord_url: yup.string().max(255).nullable().optional(),
    instagram_url: yup.string().url('Enter a valid URL').nullable().optional(),
    facebook_url: yup.string().url('Enter a valid URL').nullable().optional(),
    tiktok_url: yup.string().url('Enter a valid URL').nullable().optional(),
    creator_role: yup.mixed<'artist' | 'storyteller'>().oneOf(['artist', 'storyteller']).required(),
    creator_features: yup.array().of(yup.mixed<CreatorFeature>().oneOf(['webcomix', 'novels', 'arts', 'commission', 'shop']).required()).required(),
})

type ProfileFields = yup.InferType<typeof schema>

export function useProfileForm() {
    const { user, setUser } = useAuthStore()
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors }, watch, setValue, setError: setFieldError,
    } = useForm<ProfileFields>({
        resolver: yupResolver(schema) as unknown as Resolver<ProfileFields>,
        defaultValues: {
            name: user?.name ?? '',
            username: user?.username ?? '',
            email: user?.email ?? '',
            account_menu_style: user?.account_menu_style ?? 'circular',
            bio: user?.bio ?? '',
            twitter_url: user?.twitter_url ?? '',
            discord_url: user?.discord_url ?? '',
            instagram_url: user?.instagram_url ?? '',
            facebook_url: user?.facebook_url ?? '',
            tiktok_url: user?.tiktok_url ?? '',
            creator_role: user?.creator_role ?? (user?.role === 'storyteller' ? 'storyteller' : 'artist'),
            creator_features: user?.creator_features ?? (user?.role === 'storyteller' ? ['webcomix', 'novels', 'shop'] : ['arts', 'commission', 'shop']),
        },
    })

    const mutation = useMutation({
        mutationFn: (data: ProfileFields) => {
            const form = new FormData()
            form.append('name', data.name)
            form.append('username', data.username)
            form.append('email', data.email)
            form.append('account_menu_style', data.account_menu_style)
            form.append('bio', data.bio ?? '')

            // Always append social fields, even if empty
            form.append('twitter_url', data.twitter_url ?? '')
            form.append('discord_url', data.discord_url ?? '')
            form.append('instagram_url', data.instagram_url ?? '')
            form.append('facebook_url', data.facebook_url ?? '')
            form.append('tiktok_url', data.tiktok_url ?? '')
            form.append('creator_role', data.creator_role)
            data.creator_features.forEach((feature) => form.append('creator_features[]', feature))

            return authApi.updateProfile(form)
        },
        onSuccess: (res) => {
            setUser(res.data.user)
            setSuccess(true)
            setError(null)
        },
        onError: (err: unknown) => {
            setError(getErrorMessage(err) ?? 'Failed to update profile.')
            setSuccess(false)
            const fieldErrors = getFieldErrors(err)
            Object.entries(fieldErrors).forEach(([field, messages]) => {
                if (field in schema.fields && messages[0]) {
                    setFieldError(field as keyof ProfileFields, { type: 'server', message: messages[0] })
                }
            })
        },
    })

    return {
        register,
        handleSubmit: handleSubmit((data) => mutation.mutate(data)),
        errors,
        loading: mutation.isPending,
        error,
        success,
        watch,
        setValue,
    }
}

function getErrorMessage(err: unknown) {
    if (typeof err !== 'object' || err === null || !('response' in err)) return null

    const response = (err as { response?: { data?: { message?: unknown } } }).response
    return typeof response?.data?.message === 'string' ? response.data.message : null
}

function getFieldErrors(err: unknown): Record<string, string[]> {
    if (typeof err !== 'object' || err === null || !('response' in err)) return {}
    const response = (err as { response?: { data?: { errors?: unknown } } }).response
    return response?.data?.errors && typeof response.data.errors === 'object'
        ? response.data.errors as Record<string, string[]>
        : {}
}
