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
        <ProfileEditSection title="Sizes">
                            <RangeField
                                label="Global"
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
                                        },
                                    })
                                }
                            />
                            <p className="rounded-md bg-muted/30 px-2.5 py-2 text-[10px] text-muted-foreground">
                                This changes profile chrome only. Text inside widget content keeps
                                its own typography.
                            </p>
                            <RangeField
                                label="Profile Name"
                                value={Number((draft.tabsConfig.global_styles as any)?.profile_name_size ?? 24)}
                                min={10}
                                max={28}
                                suffix="px"
                                onChange={(profile_name_size) =>
                                    updateTabsConfig({
                                        global_styles: {
                                            ...(draft.tabsConfig.global_styles ??
                                                defaultProfileTabsConfig().global_styles!),
                                            profile_name_size,
                                        },
                                    })
                                }
                            />
                            {([
                                ['Profile Details', 'profile_details_size', 14],
                                ['Profile Links', 'profile_links_size', 12],
                                ['Cards', 'cards_size', 14],
                                ['Labels', 'labels_size', 13],
                            ] as const).map(([label, key, fallback]) => (
                                <RangeField key={key} label={label} value={Number((draft.tabsConfig.global_styles as any)?.[key] ?? fallback)} min={10} max={28} suffix="px" onChange={(value) => updateTabsConfig({ global_styles: { ...(draft.tabsConfig.global_styles ?? defaultProfileTabsConfig().global_styles!), [key]: value } })} />
                            ))}
                            <RangeField
                                label="Button"
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
