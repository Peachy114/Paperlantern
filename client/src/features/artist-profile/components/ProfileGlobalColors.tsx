import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { ProfileTabsConfig } from '@/types/artistProfile'
import type { ProfileThemeDraft } from '@/features/artist-profile/types/profileEditor'
import { defaultProfileTabsConfig } from '@/features/artist-profile/utils/profileLayout'
import { ColorField, ProfileEditSection } from '@/features/artist-profile/components/ProfileEditorFields'
import type { ExtendedGlobalStyles } from '@/features/artist-profile/types/profileTheme'

// Profile global light and dark color editor ----
function getExtendedGlobalStyles(config: ProfileTabsConfig): ExtendedGlobalStyles {
    return (config.global_styles ?? defaultProfileTabsConfig().global_styles!) as ExtendedGlobalStyles
}

export function ProfileGlobalColors({
    draft,
    updateTabsConfig,
}: {
    draft: ProfileThemeDraft
    updateTabsConfig: (patch: Partial<ProfileTabsConfig>) => void
}) {
    const [globalColorTheme, setGlobalColorTheme] = useState<'light' | 'dark'>('light')

    return (
        <ProfileEditSection title="Colors">
                            <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={globalColorTheme === 'light' ? 'default' : 'ghost'}
                                    onClick={() => setGlobalColorTheme('light')}
                                >
                                    Light
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={globalColorTheme === 'dark' ? 'default' : 'ghost'}
                                    onClick={() => setGlobalColorTheme('dark')}
                                >
                                    Dark
                                </Button>
                            </div>
                            {globalColorTheme === 'light' ? (
                                <>
                                    <p className="text-xs font-medium text-muted-foreground">Global</p>
                                    <ColorField
                                        label="Global"
                                        value={
                                            draft.tabsConfig.global_styles?.text_color ?? '#111827'
                                        }
                                        fallback="#111827"
                                        onChange={(text_color) =>
                                            updateTabsConfig({
                                                global_styles: {
                                                    ...(draft.tabsConfig.global_styles ??
                                                        defaultProfileTabsConfig().global_styles!),
                                                    text_color,
                                                },
                                            })
                                        }
                                    />
                                    <ColorField
                                        label="Profile Name"
                                        value={
                                            getExtendedGlobalStyles(draft.tabsConfig)
                                                .profile_name_color ??
                                            draft.tabsConfig.global_styles?.text_color ??
                                            '#111827'
                                        }
                                        fallback="#111827"
                                        onChange={(profile_name_color) =>
                                            updateTabsConfig({
                                                global_styles: {
                                                    ...getExtendedGlobalStyles(draft.tabsConfig),
                                                    profile_name_color,
                                                } as ProfileTabsConfig['global_styles'],
                                            })
                                        }
                                    />
                                    <ColorField
                                        label="Profile Details"
                                        value={
                                            getExtendedGlobalStyles(draft.tabsConfig)
                                                .profile_details_color ??
                                            draft.tabsConfig.global_styles?.text_color ??
                                            '#111827'
                                        }
                                        fallback="#111827"
                                        onChange={(profile_details_color) =>
                                            updateTabsConfig({
                                                global_styles: {
                                                    ...getExtendedGlobalStyles(draft.tabsConfig),
                                                    profile_details_color,
                                                } as ProfileTabsConfig['global_styles'],
                                            })
                                        }
                                    />
                                    <ColorField
                                        label="Profile Links"
                                        value={
                                            getExtendedGlobalStyles(draft.tabsConfig)
                                                .profile_links_color ??
                                            draft.tabsConfig.global_styles?.text_color ??
                                            '#111827'
                                        }
                                        fallback="#111827"
                                        onChange={(profile_links_color) =>
                                            updateTabsConfig({
                                                global_styles: {
                                                    ...getExtendedGlobalStyles(draft.tabsConfig),
                                                    profile_links_color,
                                                } as ProfileTabsConfig['global_styles'],
                                            })
                                        }
                                    />
                                    <ColorField
                                        label="Cards"
                                        value={
                                            getExtendedGlobalStyles(draft.tabsConfig)
                                                .cards_color ??
                                            draft.tabsConfig.global_styles?.text_color ??
                                            '#111827'
                                        }
                                        fallback="#111827"
                                        onChange={(cards_color) =>
                                            updateTabsConfig({
                                                global_styles: {
                                                    ...getExtendedGlobalStyles(draft.tabsConfig),
                                                    cards_color,
                                                } as ProfileTabsConfig['global_styles'],
                                            })
                                        }
                                    />
                                    <ColorField label="Button" value={getExtendedGlobalStyles(draft.tabsConfig).button_text_color ?? '#111827'} fallback="#111827" onChange={(button_text_color) => updateTabsConfig({ global_styles: { ...getExtendedGlobalStyles(draft.tabsConfig), button_text_color } as ProfileTabsConfig['global_styles'] })} />
                                    <ColorField label="Labels" value={getExtendedGlobalStyles(draft.tabsConfig).label_text_color ?? '#111827'} fallback="#111827" onChange={(label_text_color) => updateTabsConfig({ global_styles: { ...getExtendedGlobalStyles(draft.tabsConfig), label_text_color } as ProfileTabsConfig['global_styles'] })} />
                                </>
                            ) : (
                                <>
                                    {(
                                        [
                                            ['Global', 'dark_text_color', '#e4e4e7'],
                                            ['Profile Name', 'profile_name_color', '#f4f4f5'],
                                            ['Profile Details', 'profile_details_color', '#a1a1aa'],
                                            ['Profile Links', 'profile_links_color', '#fb923c'],
                                            ['Cards', 'dark_cards_color', '#e4e4e7'],
                                            ['Button', 'dark_button_text_color', '#e4e4e7'],
                                            ['Labels', 'dark_label_text_color', '#e4e4e7'],
                                        ] as const
                                    ).map(([label, key, fallback]) => (
                                        <ColorField
                                            key={key}
                                            label={label}
                                            value={
                                                (getExtendedGlobalStyles(draft.tabsConfig)[key] as
                                                    | string
                                                    | undefined) ?? fallback
                                            }
                                            fallback={fallback}
                                            onChange={(value) =>
                                                updateTabsConfig({
                                                    global_styles: {
                                                        ...getExtendedGlobalStyles(
                                                            draft.tabsConfig
                                                        ),
                                                        [key]: value,
                                                    } as ProfileTabsConfig['global_styles'],
                                                })
                                            }
                                        />
                                    ))}
                                </>
                            )}
        </ProfileEditSection>
    )
}
