import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth'

const schema = yup.object({
    name: yup.string().required('Full name is required').max(255),
    nickname: yup.string().max(80).nullable().optional(),
    username: yup.string().required('Username is required').max(50),
    account_menu_style: yup
        .mixed<'circular' | 'detailed'>()
        .oneOf(['circular', 'detailed'])
        .required(),
    bio: yup.string().max(500).nullable().optional(),
    twitter_url: yup.string().url('Enter a valid URL').nullable().optional(),
    discord_url: yup.string().max(255).nullable().optional(),
    instagram_url: yup.string().url('Enter a valid URL').nullable().optional(),
    tiktok_url: yup.string().url('Enter a valid URL').nullable().optional(),
})

type ProfileFields = yup.InferType<typeof schema>

export function useProfileForm() {
    const { user, setUser } = useAuthStore()
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ProfileFields>({
        resolver: yupResolver(schema) as unknown as Resolver<ProfileFields>,
        defaultValues: {
            name: user?.name ?? '',
            nickname: user?.nickname ?? '',
            username: user?.username ?? '',
            account_menu_style: user?.account_menu_style ?? 'circular',
            bio: user?.bio ?? '',
            twitter_url: user?.twitter_url ?? '',
            discord_url: user?.discord_url ?? '',
            instagram_url: user?.instagram_url ?? '',
            tiktok_url: user?.tiktok_url ?? '',
        },
    })

    const mutation = useMutation({
        mutationFn: (data: ProfileFields) => {
            const form = new FormData()
            form.append('name', data.name)
            form.append('nickname', data.nickname ?? '')
            form.append('username', data.username)
            form.append('account_menu_style', data.account_menu_style)
            form.append('bio', data.bio ?? '')

            // Always append social fields, even if empty
            form.append('twitter_url', data.twitter_url ?? '')
            form.append('discord_url', data.discord_url ?? '')
            form.append('instagram_url', data.instagram_url ?? '')
            form.append('tiktok_url', data.tiktok_url ?? '')

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

function getErrorMessage(err: unknown) {
    if (typeof err !== 'object' || err === null || !('response' in err)) return null

    const response = (err as { response?: { data?: { message?: unknown } } }).response
    return typeof response?.data?.message === 'string' ? response.data.message : null
}
