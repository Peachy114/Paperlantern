import { useProfileForm } from '../../hooks/useProfileForm'
import { usePasswordForm } from '../../hooks/usePasswordForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type { CreatorFeature } from '@/store/authStore'

export default function ProfileView() {
    const profile = useProfileForm()
    const password = usePasswordForm()
    const creatorRole = profile.watch('creator_role')
    const creatorFeatures = profile.watch('creator_features') ?? []
    const requiredFeatures: CreatorFeature[] = creatorRole === 'artist'
        ? ['arts', 'commission']
        : ['webcomix', 'novels']
    const featureLabels: Record<CreatorFeature, string> = {
        webcomix: 'Webcomix', novels: 'Novels', arts: 'Arts', commission: 'Commission', shop: 'Shop',
    }

    const changeRole = (role: 'artist' | 'storyteller') => {
        const required: CreatorFeature[] = role === 'artist'
            ? ['arts', 'commission', 'shop']
            : ['webcomix', 'novels', 'shop']
        profile.setValue('creator_role', role, { shouldDirty: true, shouldValidate: true })
        profile.setValue('creator_features', [...new Set([...creatorFeatures, ...required])], { shouldDirty: true })
    }

    const toggleFeature = (feature: CreatorFeature, checked: boolean) => {
        if (feature === 'shop' || requiredFeatures.includes(feature)) return
        profile.setValue('creator_features', checked
            ? [...new Set([...creatorFeatures, feature])]
            : creatorFeatures.filter((item) => item !== feature), { shouldDirty: true, shouldValidate: true })
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
            {/* ── General Info ── */}
            <div>
                <h2 className="text-base font-semibold mb-4">General Info</h2>
                <form onSubmit={profile.handleSubmit} className="space-y-5">
                    <div className="space-y-3 rounded-lg border p-4">
                        <div>
                            <Label>Primary creator role</Label>
                            <p className="text-xs text-muted-foreground">Your role sets the features you cannot disable. It does not change your name or remove content.</p>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {(['artist', 'storyteller'] as const).map((role) => (
                                <label key={role} className="flex cursor-pointer gap-2 rounded-md border p-3 capitalize">
                                    <input type="radio" checked={creatorRole === role} onChange={() => changeRole(role)} />
                                    {role}
                                </label>
                            ))}
                        </div>
                        <div>
                            <Label>Creator features</Label>
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                {(Object.keys(featureLabels) as CreatorFeature[]).map((feature) => {
                                    const locked = feature === 'shop' || requiredFeatures.includes(feature)
                                    return (
                                        <label key={feature} className="flex items-center gap-2 rounded-md border p-3">
                                            <input type="checkbox" checked={creatorFeatures.includes(feature)} disabled={locked}
                                                onChange={(event) => toggleFeature(feature, event.target.checked)} />
                                            <span>{featureLabels[feature]}</span>
                                            {locked && <span className="ml-auto text-xs text-muted-foreground">Required</span>}
                                        </label>
                                    )
                                })}
                            </div>
                            {profile.errors.creator_features && <p className="mt-2 text-sm text-destructive">{profile.errors.creator_features.message}</p>}
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="name">Full name</Label>
                        <Input
                            id="name"
                            {...profile.register('name')}
                            placeholder="Your full name"
                        />
                        {profile.errors.name && (
                            <p className="text-sm text-destructive">
                                {profile.errors.name.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            {...profile.register('username')}
                            placeholder="your_username"
                        />
                        {profile.errors.username && (
                            <p className="text-sm text-destructive">
                                {profile.errors.username.message}
                            </p>
                        )}
                    </div>
                    {/* ── Social Media Links ── */}
                    <div className="space-y-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            {...profile.register('email')}
                            placeholder="you@example.com"
                        />
                        {profile.errors.email && (
                            <p className="text-sm text-destructive">
                                {profile.errors.email.message}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            If you change your email, a new verification code will be sent.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Account menu style</Label>
                        <div className="grid gap-2 sm:grid-cols-2">
                            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition hover:bg-muted/40">
                                <input
                                    type="radio"
                                    value="circular"
                                    {...profile.register('account_menu_style')}
                                    className="mt-1"
                                />
                                <span>
                                    <span className="block font-medium">Circular icons</span>
                                    <span className="text-xs text-muted-foreground">
                                        Default compact account menu.
                                    </span>
                                </span>
                            </label>
                            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition hover:bg-muted/40">
                                <input
                                    type="radio"
                                    value="detailed"
                                    {...profile.register('account_menu_style')}
                                    className="mt-1"
                                />
                                <span>
                                    <span className="block font-medium">Detailed rows</span>
                                    <span className="text-xs text-muted-foreground">
                                        Larger creator menu with descriptions.
                                    </span>
                                </span>
                            </label>
                        </div>
                    </div>

                    <div id="public-links" className="scroll-mt-24 space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Public Links
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            These can be shared publicly and reused when a commission artist asks for contact details.
                        </p>

                        <div className="space-y-1.5">
                            <Label htmlFor="twitter_url">X / Twitter</Label>
                            <Input
                                id="twitter_url"
                                {...profile.register('twitter_url')}
                                placeholder="https://x.com/yourhandle"
                            />
                            {profile.errors.twitter_url && (
                                <p className="text-sm text-destructive">
                                    {profile.errors.twitter_url.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="discord_url">Discord</Label>
                            <Input
                                id="discord_url"
                                {...profile.register('discord_url')}
                                placeholder="Discord username or profile/invite link"
                            />
                            {profile.errors.discord_url && (
                                <p className="text-sm text-destructive">
                                    {profile.errors.discord_url.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="instagram_url">Instagram</Label>
                            <Input
                                id="instagram_url"
                                {...profile.register('instagram_url')}
                                placeholder="https://instagram.com/yourhandle"
                            />
                            {profile.errors.instagram_url && (
                                <p className="text-sm text-destructive">
                                    {profile.errors.instagram_url.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="facebook_url">Facebook</Label>
                            <Input
                                id="facebook_url"
                                {...profile.register('facebook_url')}
                                placeholder="https://facebook.com/yourhandle"
                            />
                            {profile.errors.facebook_url && (
                                <p className="text-sm text-destructive">
                                    {profile.errors.facebook_url.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="tiktok_url">TikTok</Label>
                            <Input
                                id="tiktok_url"
                                {...profile.register('tiktok_url')}
                                placeholder="https://tiktok.com/@yourhandle"
                            />
                            {profile.errors.tiktok_url && (
                                <p className="text-sm text-destructive">
                                    {profile.errors.tiktok_url.message}
                                </p>
                            )}
                        </div>
                    </div>

                    {profile.error && <p className="text-sm text-destructive">{profile.error}</p>}
                    {profile.success && <p className="text-sm text-green-500">Profile updated!</p>}

                    <Button type="submit" disabled={profile.loading}>
                        {profile.loading ? 'Saving...' : 'Save changes'}
                    </Button>
                </form>
            </div>

            <Separator />

            {/* ── Change Password ── */}
            <div>
                <h2 className="text-base font-semibold mb-4">Change Password</h2>
                <form onSubmit={password.handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <Label htmlFor="current_password">Current password</Label>
                        <Input
                            id="current_password"
                            type="password"
                            {...password.register('current_password')}
                        />
                        {password.errors.current_password && (
                            <p className="text-sm text-destructive">
                                {password.errors.current_password.message}
                            </p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="password">New password</Label>
                        <Input id="password" type="password" {...password.register('password')} />
                        {password.errors.password && (
                            <p className="text-sm text-destructive">
                                {password.errors.password.message}
                            </p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="password_confirm">Confirm new password</Label>
                        <Input
                            id="password_confirm"
                            type="password"
                            {...password.register('password_confirmation')}
                        />
                        {password.errors.password_confirmation && (
                            <p className="text-sm text-destructive">
                                {password.errors.password_confirmation.message}
                            </p>
                        )}
                    </div>

                    {password.error && <p className="text-sm text-destructive">{password.error}</p>}
                    {password.success && (
                        <p className="text-sm text-green-500">Password updated!</p>
                    )}

                    <Button type="submit" disabled={password.loading}>
                        {password.loading ? 'Updating...' : 'Update password'}
                    </Button>
                </form>
            </div>
        </div>
    )
}
