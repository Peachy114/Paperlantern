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
        <ProfileEditSection title="Global Colors">
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
                                    <ColorField
                                        label="Text"
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
                                        label="Muted text"
                                        value={
                                            draft.tabsConfig.global_styles?.muted_text_color ??
                                            '#6b7280'
                                        }
                                        fallback="#6b7280"
                                        onChange={(muted_text_color) =>
                                            updateTabsConfig({
                                                global_styles: {
                                                    ...(draft.tabsConfig.global_styles ??
                                                        defaultProfileTabsConfig().global_styles!),
                                                    muted_text_color,
                                                },
                                            })
                                        }
                                    />
                                    <ColorField
                                        label="Accent"
                                        value={
                                            draft.tabsConfig.global_styles?.accent_color ??
                                            '#111827'
                                        }
                                        fallback="#111827"
                                        onChange={(accent_color) =>
                                            updateTabsConfig({
                                                global_styles: {
                                                    ...(draft.tabsConfig.global_styles ??
                                                        defaultProfileTabsConfig().global_styles!),
                                                    accent_color,
                                                },
                                            })
                                        }
                                    />
                                    <ColorField
                                        label="Headings"
                                        value={
                                            getExtendedGlobalStyles(draft.tabsConfig)
                                                .heading_text_color ??
                                            draft.tabsConfig.global_styles?.text_color ??
                                            '#111827'
                                        }
                                        fallback="#111827"
                                        onChange={(heading_text_color) =>
                                            updateTabsConfig({
                                                global_styles: {
                                                    ...getExtendedGlobalStyles(draft.tabsConfig),
                                                    heading_text_color,
                                                } as ProfileTabsConfig['global_styles'],
                                            })
                                        }
                                    />
                                    <ColorField
                                        label="Labels"
                                        value={
                                            getExtendedGlobalStyles(draft.tabsConfig)
                                                .label_text_color ??
                                            draft.tabsConfig.global_styles?.text_color ??
                                            '#111827'
                                        }
                                        fallback="#111827"
                                        onChange={(label_text_color) =>
                                            updateTabsConfig({
                                                global_styles: {
                                                    ...getExtendedGlobalStyles(draft.tabsConfig),
                                                    label_text_color,
                                                } as ProfileTabsConfig['global_styles'],
                                            })
                                        }
                                    />
                                    <ColorField
                                        label="Button text"
                                        value={
                                            getExtendedGlobalStyles(draft.tabsConfig)
                                                .button_text_color ??
                                            draft.tabsConfig.global_styles?.text_color ??
                                            '#111827'
                                        }
                                        fallback="#111827"
                                        onChange={(button_text_color) =>
                                            updateTabsConfig({
                                                global_styles: {
                                                    ...getExtendedGlobalStyles(draft.tabsConfig),
                                                    button_text_color,
                                                } as ProfileTabsConfig['global_styles'],
                                            })
                                        }
                                    />
                                    <ColorField
                                        label="Links"
                                        value={
                                            getExtendedGlobalStyles(draft.tabsConfig)
                                                .link_text_color ??
                                            draft.tabsConfig.global_styles?.accent_color ??
                                            '#111827'
                                        }
                                        fallback="#111827"
                                        onChange={(link_text_color) =>
                                            updateTabsConfig({
                                                global_styles: {
                                                    ...getExtendedGlobalStyles(draft.tabsConfig),
                                                    link_text_color,
                                                } as ProfileTabsConfig['global_styles'],
                                            })
                                        }
                                    />
                                </>
                            ) : (
                                <>
                                    {(
                                        [
                                            ['Text', 'dark_text_color', '#e4e4e7'],
                                            ['Muted text', 'dark_muted_text_color', '#a1a1aa'],
                                            ['Accent', 'dark_accent_color', '#f97316'],
                                            ['Headings', 'dark_heading_text_color', '#f4f4f5'],
                                            ['Labels', 'dark_label_text_color', '#e4e4e7'],
                                            ['Button text', 'dark_button_text_color', '#e4e4e7'],
                                            ['Links', 'dark_link_text_color', '#fb923c'],
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

