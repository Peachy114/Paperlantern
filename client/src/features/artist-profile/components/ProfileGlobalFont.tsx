import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProfileEditSection } from '@/features/artist-profile/components/ProfileEditorFields'
import type { ProfileThemeDraft } from '@/features/artist-profile/types/profileEditor'
import type { ProfileTabsConfig } from '@/types/artistProfile'
import { defaultProfileTabsConfig } from '@/features/artist-profile/utils/profileLayout'

// Profile global font family editor ----
export function ProfileGlobalFont({
    draft,
    updateTabsConfig,
}: {
    draft: ProfileThemeDraft
    updateTabsConfig: (patch: Partial<ProfileTabsConfig>) => void
}) {
    return (
        <ProfileEditSection title="Global font family">
            <div className="grid gap-1.5">
                <Label htmlFor="profile-global-font">Font family</Label>
                <Input
                    id="profile-global-font"
                    value={draft.tabsConfig.global_styles?.font_family ?? ''}
                    placeholder="Inter, Comic Relief, sans-serif"
                    onChange={(event) =>
                        updateTabsConfig({
                            global_styles: {
                                ...(draft.tabsConfig.global_styles ??
                                    defaultProfileTabsConfig().global_styles!),
                                font_family: event.target.value,
                            },
                        })
                    }
                />
            </div>
        </ProfileEditSection>
    )
}
