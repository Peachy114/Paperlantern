import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth'

const schema = yup.object({
    name: yup.string().required('Full name is required').max(255),
    username: yup.string().required('Username is required').max(50),
    bio: yup.string().max(500).nullable().optional(),
})

type ProfileFields = yup.InferType<typeof schema>

export function useProfileForm() {
    const { user, setUser } = useAuthStore()
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar ?? null)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ProfileFields>({
        resolver: yupResolver(schema) as any,
        defaultValues: {
            name: user?.name ?? '',
            username: user?.username ?? '',
            bio: user?.bio ?? '',
        },
    })

    function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        setAvatarFile(file)
        setAvatarPreview(URL.createObjectURL(file))
    }

    const mutation = useMutation({
        mutationFn: (data: ProfileFields) => {
            const form = new FormData()
            form.append('name', data.name)
            form.append('username', data.username)
            if (data.bio) form.append('bio', data.bio)
            if (avatarFile) form.append('avatar', avatarFile)
            return authApi.updateProfile(form)
        },
        onSuccess: (res) => {
            setUser(res.data.user)
            setAvatarPreview(res.data.user.avatar)
            setSuccess(true)
            setError(null)
        },
        onError: (err: any) => {
            setError(err?.response?.data?.message ?? 'Failed to update profile.')
            setSuccess(false)
        },
    })

    return {
        register,
        handleSubmit: handleSubmit((data) => mutation.mutate(data)),
        errors,
        avatarPreview,
        fileRef,
        handleAvatarChange,
        loading: mutation.isPending,
        error,
        success,
    }
}
