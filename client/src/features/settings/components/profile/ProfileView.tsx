import { useProfileForm } from '../../hooks/useProfileForm'
import { usePasswordForm } from '../../hooks/usePasswordForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

export default function ProfileView() {
    const profile = useProfileForm()
    const password = usePasswordForm()

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
            {/* ── General Info ── */}
            <div>
                <h2 className="text-base font-semibold mb-4">General Info</h2>
                <form onSubmit={profile.handleSubmit} className="space-y-5">
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
                    <div className="hidden">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Social Media Links
                        </h3>

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
