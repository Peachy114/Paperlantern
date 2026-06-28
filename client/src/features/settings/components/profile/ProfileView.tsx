import { useAuthStore } from '@/store/authStore'
import { useProfileForm } from '../../hook/useProfileForm'
import { usePasswordForm } from '../../hook/usePasswordForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera } from 'lucide-react'

export default function ProfileView() {
    const { user } = useAuthStore()
    const avatarLetter = (user?.username ?? 'U')[0].toUpperCase()

    const profile = useProfileForm()
    const password = usePasswordForm()

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
            {/* ── General Info ── */}
            <div>
                <h2 className="text-base font-semibold mb-4">General Info</h2>
                <form onSubmit={profile.handleSubmit} className="space-y-5">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Avatar className="w-16 h-16">
                                <AvatarImage src={profile.avatarPreview ?? undefined} />
                                <AvatarFallback className="text-lg">{avatarLetter}</AvatarFallback>
                            </Avatar>
                            <button
                                type="button"
                                onClick={() => profile.fileRef.current?.click()}
                                className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                            >
                                <Camera className="w-3 h-3" />
                            </button>
                            <input
                                ref={profile.fileRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={profile.handleAvatarChange}
                            />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Click the camera to change your profile picture.
                        </p>
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
