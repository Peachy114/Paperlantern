// features/profile/schemas/profile.schema.ts
import { z } from 'zod'

export const loginProviderSchema = z.enum(['facebook', 'google', 'email'])

export const profileUserSchema = z.object({
    id: z.string(),
    name: z.string().min(1),
    avatarUrl: z.string().url().nullable().optional(),
    loginProvider: loginProviderSchema.nullable().optional(),
    credits: z.number().int().nonnegative(),
})

export type ProfileUser = z.infer<typeof profileUserSchema>
export type LoginProvider = z.infer<typeof loginProviderSchema>

// Response shape from GET /api/profile
export const profileResponseSchema = z.object({
    data: profileUserSchema,
})

export type ProfileResponse = z.infer<typeof profileResponseSchema>
