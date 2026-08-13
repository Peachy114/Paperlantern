import type { ProfileTabsConfig } from '@/types/artistProfile'
import type { ProfileThemeDraft } from '@/features/artist-profile/types/profileEditor'
import { defaultProfileTabsConfig } from '@/features/artist-profile/utils/profileLayout'
import { ProfileEditSection } from '@/features/artist-profile/components/ProfileEditorFields'
import { ProfileRangeField as RangeField } from '@/features/artist-profile/components/ProfileFormPrimitives'

// Profile global typography size editor ----
export function ProfileGlobalSizes({
    draft,
    updateTabsConfig,
}: {
    draft: ProfileThemeDraft
    updateTabsConfig: (patch: Partial<ProfileTabsConfig>) => void
}) {
    return (
        <ProfileEditSection title="Global Sizes">
                            <RangeField
                                label="All profile text"
                                value={draft.tabsConfig.global_styles?.base_font_size ?? 14}
                                min={10}
                                max={28}
                                suffix="px"
                                onChange={(all_font_size) =>
                                    updateTabsConfig({
                                        global_styles: {
                                            ...(draft.tabsConfig.global_styles ??
                                                defaultProfileTabsConfig().global_styles!),
                                            base_font_size: all_font_size,
                                            widget_font_size: all_font_size,
                                            button_font_size: Math.min(all_font_size, 24),
                                        },
                                    })
                                }
                            />
                            <p className="rounded-md bg-muted/30 px-2.5 py-2 text-[10px] text-muted-foreground">
                                This changes text across the full public profile. Fine-tune content
                                and button sizes with the controls below.
                            </p>
                            <RangeField
                                label="Base text"
                                value={draft.tabsConfig.global_styles?.base_font_size ?? 14}
                                min={10}
                                max={28}
                                suffix="px"
                                onChange={(base_font_size) =>
                                    updateTabsConfig({
                                        global_styles: {
                                            ...(draft.tabsConfig.global_styles ??
                                                defaultProfileTabsConfig().global_styles!),
                                            base_font_size,
                                        },
                                    })
                                }
                            />
                            <RangeField
                                label="Widget text"
                                value={draft.tabsConfig.global_styles?.widget_font_size ?? 13}
                                min={10}
                                max={28}
                                suffix="px"
                                onChange={(widget_font_size) =>
                                    updateTabsConfig({
                                        global_styles: {
                                            ...(draft.tabsConfig.global_styles ??
                                                defaultProfileTabsConfig().global_styles!),
                                            widget_font_size,
                                        },
                                    })
                                }
                            />
                            <RangeField
                                label="Button text"
                                value={draft.tabsConfig.global_styles?.button_font_size ?? 14}
                                min={10}
                                max={24}
                                suffix="px"
                                onChange={(button_font_size) =>
                                    updateTabsConfig({
                                        global_styles: {
                                            ...(draft.tabsConfig.global_styles ??
                                                defaultProfileTabsConfig().global_styles!),
                                            button_font_size,
                                        },
                                    })
                                }
                            />
        </ProfileEditSection>
    )
}
