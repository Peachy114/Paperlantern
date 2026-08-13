import type { ReactNode, RefObject } from 'react'
import { Eye, EyeOff, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ColorField, ProfileEditSection } from '@/features/artist-profile/components/ProfileEditorFields'
import {
    ProfileFieldMessage as FieldMessage,
    ProfileRangeField as RangeField,
} from '@/features/artist-profile/components/ProfileFormPrimitives'
import type {
    HeaderDraft,
    ProfileEditErrors,
    ProfileThemeDraft,
} from '@/features/artist-profile/types/profileEditor'
import type { ProfileTabsConfig } from '@/types/artistProfile'
import type { ExtendedGlobalStyles } from '@/features/artist-profile/types/profileTheme'
import { defaultProfileTabsConfig } from '@/features/artist-profile/utils/profileLayout'

// Profile bio, visibility, image upload and positioning editor ----
function getExtendedGlobalStyles(config: ProfileTabsConfig): ExtendedGlobalStyles {
    return (config.global_styles ??
        defaultProfileTabsConfig().global_styles!) as ExtendedGlobalStyles
}

export function ProfileIdentityEditor({
    draft,
    headerDraft,
    errors,
    profileDisplayScaleY,
    coverRef,
    avatarRef,
    onChange,
    onHeaderChange,
    updateTabsConfig,
    requestProfileCrop,
    publicLinks,
}: {
    draft: ProfileThemeDraft
    headerDraft: HeaderDraft
    errors: ProfileEditErrors
    profileDisplayScaleY: number
    coverRef: RefObject<HTMLInputElement | null>
    avatarRef: RefObject<HTMLInputElement | null>
    onChange: (patch: Partial<ProfileThemeDraft>) => void
    onHeaderChange: (patch: Partial<HeaderDraft>) => void
    updateTabsConfig: (patch: Partial<ProfileTabsConfig>) => void
    requestProfileCrop: (
        field: 'cover' | 'avatar' | 'background_image',
        file: File | null
    ) => void
    publicLinks?: ReactNode
}) {
    return (
<ProfileEditSection title="Profile">
    <div className="grid gap-1">
        <Label htmlFor="profile-title">Biography</Label>
        {errors.artistTitle && (
            <FieldMessage>{errors.artistTitle}</FieldMessage>
        )}
        <Input
            id="profile-title"
            value={headerDraft.artistTitle}
            onChange={(event) =>
                onHeaderChange({ artistTitle: event.target.value })
            }
        />
    </div>

    {publicLinks}

    <div className="grid gap-2 rounded-lg border bg-muted/20 p-3">
        <label className="flex items-center justify-between gap-3 text-sm">
            <span>
                    <span className="block font-medium">Cover image visibility</span>
                <span className="block text-[10px] text-muted-foreground">
                    Hide the entire cover area when disabled.
                </span>
            </span>
            <Button type="button" size="icon-sm" variant="ghost" aria-label={draft.showCover ? 'Hide cover image' : 'Show cover image'} onClick={() => onChange({ showCover: !draft.showCover })}>
                {draft.showCover ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
        </label>
        <label className="flex items-center justify-between gap-3 border-t pt-2 text-sm">
            <span>
                <span className="block font-medium">Show profile info</span>
                <span className="block text-[10px] text-muted-foreground">
                    Name, username, title, stats, buttons, links and bio.
                </span>
            </span>
            <input
                type="checkbox"
                checked={
                    getExtendedGlobalStyles(draft.tabsConfig)
                        .show_profile_info !== false
                }
                onChange={(event) =>
                    updateTabsConfig({
                        global_styles: {
                            ...getExtendedGlobalStyles(draft.tabsConfig),
                            show_profile_info: event.target.checked,
                        } as ProfileTabsConfig['global_styles'],
                    })
                }
            />
        </label>
    </div>
    <div className="grid gap-3 rounded-lg border bg-muted/20 p-3">
        <label className="flex items-center justify-between gap-3 text-sm">
            <span>
                <span className="block font-medium">Header background color</span>
                <span className="block text-[10px] text-muted-foreground">
                    Add a separate color behind the name and profile information.
                </span>
            </span>
            <input
                type="checkbox"
                checked={Boolean(
                    getExtendedGlobalStyles(draft.tabsConfig).header_background_enabled
                )}
                onChange={(event) =>
                    updateTabsConfig({
                        global_styles: {
                            ...getExtendedGlobalStyles(draft.tabsConfig),
                            header_background_enabled: event.target.checked,
                        } as ProfileTabsConfig['global_styles'],
                    })
                }
            />
        </label>
        {getExtendedGlobalStyles(draft.tabsConfig).header_background_enabled && (
            <div className="grid gap-3 border-t pt-3">
                <ColorField
                    label="Header color"
                    value={
                        getExtendedGlobalStyles(draft.tabsConfig).header_background_color ??
                        '#ffffff'
                    }
                    fallback="#ffffff"
                    onChange={(header_background_color) =>
                        updateTabsConfig({
                            global_styles: {
                                ...getExtendedGlobalStyles(draft.tabsConfig),
                                header_background_color,
                            } as ProfileTabsConfig['global_styles'],
                        })
                    }
                />
                <RangeField
                    label="Header background opacity"
                    value={Number(
                        getExtendedGlobalStyles(draft.tabsConfig).header_background_opacity ?? 100
                    )}
                    min={0}
                    max={100}
                    suffix="%"
                    onChange={(header_background_opacity) =>
                        updateTabsConfig({
                            global_styles: {
                                ...getExtendedGlobalStyles(draft.tabsConfig),
                                header_background_opacity,
                            } as ProfileTabsConfig['global_styles'],
                        })
                    }
                />
            </div>
        )}
    </div>
    <div className="grid grid-cols-2 gap-2">
        <Button
            type="button"
            variant="outline"
            onClick={() => coverRef.current?.click()}
        >
            <Upload className="h-4 w-4" />
            Cover Image
        </Button>
        <Button
            type="button"
            variant="outline"
            onClick={() => avatarRef.current?.click()}
        >
            <Upload className="h-4 w-4" />
            Profile Image
        </Button>
    </div>
    <input
        ref={coverRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
            requestProfileCrop('cover', event.target.files?.[0] ?? null)
            event.target.value = ''
        }}
    />
    <input
        ref={avatarRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
            requestProfileCrop('avatar', event.target.files?.[0] ?? null)
            event.target.value = ''
        }}
    />

    <ProfileEditSection title="Settings" defaultOpen={false}>
    <div className="grid gap-2 rounded-lg border bg-muted/20 p-3">
        <label className="flex items-center justify-between gap-3 text-sm">
            <span>
                <span className="block font-medium">
                    Enable Profile Image X/Y
                </span>
                <span className="block text-[10px] text-muted-foreground">
                    Keep the profile image in its normal centered position when
                    disabled.
                </span>
            </span>
            <input
                type="checkbox"
                checked={Boolean(
                    getExtendedGlobalStyles(draft.tabsConfig)
                        .profile_image_position_enabled
                )}
                onChange={(event) =>
                    updateTabsConfig({
                        global_styles: {
                            ...getExtendedGlobalStyles(draft.tabsConfig),
                            profile_image_position_enabled:
                                event.target.checked,
                            profile_image_x:
                                getExtendedGlobalStyles(draft.tabsConfig)
                                    .profile_image_x ?? 50,
                            profile_image_y:
                                getExtendedGlobalStyles(draft.tabsConfig)
                                    .profile_image_y ?? draft.avatarFrameY,
                        } as ProfileTabsConfig['global_styles'],
                    })
                }
            />
        </label>

        {getExtendedGlobalStyles(draft.tabsConfig)
            .profile_image_position_enabled && (
            <div className="grid gap-3 border-t pt-3">
                <RangeField
                    label="Profile Image X"
                    value={Number(
                        getExtendedGlobalStyles(draft.tabsConfig)
                            .profile_image_x ?? 50
                    )}
                    min={0}
                    max={100}
                    suffix="%"
                    onChange={(profile_image_x) =>
                        updateTabsConfig({
                            global_styles: {
                                ...getExtendedGlobalStyles(draft.tabsConfig),
                                profile_image_x,
                            } as ProfileTabsConfig['global_styles'],
                        })
                    }
                />
                <RangeField
                    label="Profile Image Y"
                    value={Number(
                        getExtendedGlobalStyles(draft.tabsConfig)
                            .profile_image_y ?? draft.avatarFrameY
                    )}
                    min={0}
                    max={100}
                    suffix="%"
                    onChange={(profile_image_y) =>
                        updateTabsConfig({
                            global_styles: {
                                ...getExtendedGlobalStyles(draft.tabsConfig),
                                profile_image_y,
                            } as ProfileTabsConfig['global_styles'],
                        })
                    }
                />
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                        updateTabsConfig({
                            global_styles: {
                                ...getExtendedGlobalStyles(draft.tabsConfig),
                                profile_image_x: 50,
                                profile_image_y: draft.avatarFrameY,
                            } as ProfileTabsConfig['global_styles'],
                        })
                    }
                >
                    Reset Profile Image Position
                </Button>
            </div>
        )}
    </div>

    <div className="grid gap-2 rounded-lg border bg-muted/20 p-3">
        <label className="flex items-center justify-between gap-3 text-sm">
            <span>
                <span className="block font-medium">
                    Enable Name / Details X/Y
                </span>
                <span className="block text-[10px] text-muted-foreground">
                    Enable only when the profile image is large or overlaps the
                    information.
                </span>
            </span>
            <input
                type="checkbox"
                checked={Boolean(
                    getExtendedGlobalStyles(draft.tabsConfig)
                        .identity_position_enabled
                )}
                onChange={(event) =>
                    updateTabsConfig({
                        global_styles: {
                            ...getExtendedGlobalStyles(draft.tabsConfig),
                            identity_position_enabled: event.target.checked,
                            identity_x:
                                getExtendedGlobalStyles(draft.tabsConfig)
                                    .identity_x ?? 0,
                            identity_y:
                                getExtendedGlobalStyles(draft.tabsConfig)
                                    .identity_y ?? 0,
                        } as ProfileTabsConfig['global_styles'],
                    })
                }
            />
        </label>

        {getExtendedGlobalStyles(draft.tabsConfig)
            .identity_position_enabled && (
            <div className="grid gap-3 border-t pt-3">
                <RangeField
                    label="Name/details X"
                    value={Number(
                        getExtendedGlobalStyles(draft.tabsConfig).identity_x ??
                            0
                    )}
                    min={-600}
                    max={600}
                    suffix="px"
                    onChange={(identity_x) =>
                        updateTabsConfig({
                            global_styles: {
                                ...getExtendedGlobalStyles(draft.tabsConfig),
                                identity_x,
                            } as ProfileTabsConfig['global_styles'],
                        })
                    }
                />
                <RangeField
                    label="Name/details Y"
                    value={Number(
                        getExtendedGlobalStyles(draft.tabsConfig).identity_y ??
                            0
                    )}
                    min={-400}
                    max={800}
                    suffix="px"
                    onChange={(identity_y) =>
                        updateTabsConfig({
                            global_styles: {
                                ...getExtendedGlobalStyles(draft.tabsConfig),
                                identity_y,
                            } as ProfileTabsConfig['global_styles'],
                        })
                    }
                />
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                            updateTabsConfig({
                                global_styles: {
                                    ...getExtendedGlobalStyles(
                                        draft.tabsConfig
                                    ),
                                    identity_position_enabled: true,
                                    identity_x: 0,
                                    identity_y: Math.max(
                                        0,
                                        Math.round(
                                            (profileDisplayScaleY * 112) / 2 -
                                                56
                                        )
                                    ),
                                } as ProfileTabsConfig['global_styles'],
                            })
                        }
                    >
                        Place info below profile
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                            updateTabsConfig({
                                global_styles: {
                                    ...getExtendedGlobalStyles(
                                        draft.tabsConfig
                                    ),
                                    identity_x: 0,
                                    identity_y: 0,
                                } as ProfileTabsConfig['global_styles'],
                            })
                        }
                    >
                        Reset info position
                    </Button>
                </div>
            </div>
        )}
    </div>
    </ProfileEditSection>
</ProfileEditSection>
    )
}
