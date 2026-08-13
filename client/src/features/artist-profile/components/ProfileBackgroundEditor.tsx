import { useRef } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProfileEditSection, ColorField } from '@/features/artist-profile/components/ProfileEditorFields'
import {
    ProfileRangeField as RangeField,
    ProfileSelectField as SelectField,
} from '@/features/artist-profile/components/ProfileFormPrimitives'
import { PROFILE_GRADIENT_DIRECTIONS } from '@/features/artist-profile/constants/profileEditor'
import type {
    ProfileEditErrors,
    ProfileThemeDraft,
} from '@/features/artist-profile/types/profileEditor'
import type { ExtendedGlobalStyles } from '@/features/artist-profile/types/profileTheme'
import type { ProfileTabsConfig } from '@/types/artistProfile'

// Profile page background color, gradient, blur and image editor ----
export function ProfileBackgroundEditor({
    draft,
    errors,
    onChange,
    onSelectBackground,
    updateTabsConfig,
}: {
    draft: ProfileThemeDraft
    errors: ProfileEditErrors
    onChange: (patch: Partial<ProfileThemeDraft>) => void
    onSelectBackground: (file: File | null) => void
    updateTabsConfig: (patch: Partial<ProfileTabsConfig>) => void
}) {
    const backgroundRef = useRef<HTMLInputElement | null>(null)

    return (
        <ProfileEditSection title="Background">
            <label className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={draft.backgroundColorEnabled}
                    onChange={(event) =>
                        onChange({ backgroundColorEnabled: event.target.checked })
                    }
                />
                Background color
            </label>
            {draft.backgroundColorEnabled && (
                <>
                    <ColorField
                        label="Color"
                        value={draft.backgroundColor}
                        fallback="#ffffff"
                        error={errors.backgroundColor}
                        onChange={(backgroundColor) => onChange({ backgroundColor })}
                    />
                    <RangeField
                        label="Background color opacity"
                        value={Number(
                            (draft.tabsConfig.global_styles as ExtendedGlobalStyles | undefined)
                                ?.background_color_opacity ?? 100
                        )}
                        min={0}
                        max={100}
                        suffix="%"
                        onChange={(background_color_opacity) =>
                            updateTabsConfig({
                                global_styles: {
                                    ...draft.tabsConfig.global_styles!,
                                    background_color_opacity,
                                },
                            })
                        }
                    />
                </>
            )}
            <label className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={draft.hasGradient}
                    onChange={(event) => onChange({ hasGradient: event.target.checked })}
                />
                Gradient
            </label>
            {draft.hasGradient && (
                <>
                    <div className="grid grid-cols-2 gap-2">
                        <ColorField
                            label="Gradient start"
                            value={draft.gradientFrom}
                            fallback="#ffffff"
                            error={errors.gradientFrom}
                            onChange={(gradientFrom) => onChange({ gradientFrom })}
                        />
                        <ColorField
                            label="Gradient end"
                            value={draft.gradientTo}
                            fallback="#f4f4f5"
                            error={errors.gradientTo}
                            onChange={(gradientTo) => onChange({ gradientTo })}
                        />
                    </div>
                    <SelectField
                        label="Gradient direction"
                        value={draft.gradientDirection}
                        options={[...PROFILE_GRADIENT_DIRECTIONS]}
                        onChange={(gradientDirection) => onChange({ gradientDirection })}
                    />
                </>
            )}
            <RangeField
                label="Background blur"
                value={draft.backgroundBlur}
                min={0}
                max={100}
                suffix="%"
                onChange={(backgroundBlur) => onChange({ backgroundBlur })}
            />
            <input
                ref={backgroundRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(event) => {
                    onSelectBackground(event.target.files?.[0] ?? null)
                    event.target.value = ''
                }}
            />
            <Button
                type="button"
                variant="outline"
                onClick={() => backgroundRef.current?.click()}
            >
                <Upload className="h-4 w-4" />
                Upload Background
            </Button>
        </ProfileEditSection>
    )
}
