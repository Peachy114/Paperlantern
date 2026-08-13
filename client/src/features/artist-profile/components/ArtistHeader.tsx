import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, Layers, Link as LinkIcon, Move } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { storageUrl } from '@/utils/storage'
import type { ArtistProfileResponse, ProfileTabsConfig } from '@/types/artistProfile'
import type {
    HeaderDraft,
    HeaderDragKind,
    ProfileHeaderLockKey,
    ProfileThemeDraft,
} from '@/features/artist-profile/types/profileEditor'
import {
    CenterGuide,
    HeaderLockButton,
} from '@/features/artist-profile/components/ProfileCanvasHandles'
import {
    clamp,
    defaultProfileTabsConfig,
    normalizeProfileDisplayScale,
    snapCenterOffset,
    snapPercentCenter,
    toRgba,
    toPublicHref,
} from '@/features/artist-profile/utils/profileLayout'
import type { ExtendedGlobalStyles } from '@/features/artist-profile/types/profileTheme'

// Profile global theme helpers ----
function getExtendedGlobalStyles(config: ProfileTabsConfig): ExtendedGlobalStyles {
    return (config.global_styles ??
        defaultProfileTabsConfig().global_styles!) as ExtendedGlobalStyles
}

// Profile image, cover image, identity and statistics components ----
export function ArtistHeader({
    profile,
    isOwner,
    editMode,
    draft,
    theme,
    onThemeChange,
    onSavePosition,
    onToggleFollow,
    followBusy,
}: {
    profile: ArtistProfileResponse
    isOwner: boolean
    editMode: boolean
    draft: HeaderDraft
    theme: ProfileThemeDraft
    onThemeChange: (patch: Partial<ProfileThemeDraft>) => void
    onSavePosition: (fields: Record<string, string | number | boolean | File | null>) => void
    onToggleFollow: () => void
    followBusy: boolean
}) {
    const { artist } = profile
    const cover = artist.profile_cover ? storageUrl(artist.profile_cover) : null
    const avatar = artist.avatar ? storageUrl(artist.avatar) : null
    const avatarLetter = (artist.username ?? artist.name)[0]?.toUpperCase() ?? 'A'
    const headerDragRef = useRef<{
        kind: HeaderDragKind
        startX: number
        startY: number
        startPositionX: number
        startPositionY: number
        startWidth: number
        startHeight: number
        startBorderWidth: number
        startBorderHeight: number
        patch: Record<string, number | string>
    } | null>(null)
    const [coverPosition, setCoverPosition] = useState({
        x: artist.profile_cover_position_x ?? 50,
        y: artist.profile_cover_position_y ?? 50,
    })

    useEffect(() => {
        setCoverPosition({
            x: artist.profile_cover_position_x ?? 50,
            y: artist.profile_cover_position_y ?? 50,
        })
    }, [artist.profile_cover_position_x, artist.profile_cover_position_y])
    const avatarImagePosition = {
        x: theme.avatarImageX,
        y: theme.avatarImageY,
    }
    const selectedBorder =
        profile.borders.find((border) => border.id === theme.profileBorderId) ??
        artist.profile_border
    const profileDisplayScaleX = normalizeProfileDisplayScale(theme.tabsConfig.cover_offset?.x)
    const profileDisplayScaleY = normalizeProfileDisplayScale(theme.tabsConfig.cover_offset?.y)
    const profileDisplayWidth = Math.round(112 * profileDisplayScaleX)
    const profileDisplayHeight = Math.round(112 * profileDisplayScaleY)
    const borderOffset = theme.tabsConfig.border_offset ?? { x: 0, y: 0 }

    /**
     * Existing profiles only have border_scale, so use it as the fallback.
     */
    const legacyBorderScale = theme.tabsConfig.border_scale ?? 1.35

    const borderWidth = theme.tabsConfig.border_width ?? legacyBorderScale
    const borderHeight = theme.tabsConfig.border_height ?? legacyBorderScale

    const borderLayer = theme.tabsConfig.border_layer ?? 'front'
    const headerLocks = theme.tabsConfig.header_locks ?? defaultProfileTabsConfig().header_locks!
    const headerVisualHeight = theme.showCover ? theme.bannerHeight : 112
    const headerLockForDrag: Partial<Record<HeaderDragKind, ProfileHeaderLockKey>> = {
        'avatar-frame': 'avatar_frame',
        'avatar-frame-width': 'avatar_frame',
        'avatar-frame-height': 'avatar_frame',
        'avatar-frame-size': 'avatar_frame',
        'avatar-frame-left': 'avatar_frame',
        'avatar-frame-right': 'avatar_frame',
        'avatar-frame-top': 'avatar_frame',
        'avatar-frame-bottom': 'avatar_frame',
        'avatar-frame-top-left': 'avatar_frame',
        'avatar-frame-top-right': 'avatar_frame',
        'avatar-frame-bottom-left': 'avatar_frame',
        'avatar-frame-bottom-right': 'avatar_frame',
        'avatar-border': 'avatar_border',
        'avatar-border-width': 'avatar_border',
        'avatar-border-height': 'avatar_border',
        'avatar-border-size': 'avatar_border',
    }

    const toggleHeaderLock = (key: ProfileHeaderLockKey) => {
        const tabsConfig = {
            ...theme.tabsConfig,
            header_locks: {
                ...headerLocks,
                [key]: !headerLocks[key],
            },
        }

        onThemeChange({ tabsConfig })
        onSavePosition({ profile_tabs_config: JSON.stringify(tabsConfig) })
    }

    const customLinks = theme.links
        .filter((link) => link.is_public && link.title.trim() && link.url.trim())
        .map((link) => ({
            label: link.title,
            value: link.url,
        }))
    const socialLinks = [
        { label: 'Twitter', value: artist.twitter_url },
        { label: 'Instagram', value: artist.instagram_url },
        { label: 'TikTok', value: artist.tiktok_url },
    ].filter((link) => link.value)
    const links = [...customLinks, ...socialLinks]

    const beginHeaderDrag = (
        event: PointerEvent<HTMLElement>,
        kind: HeaderDragKind,
        position: { x: number; y: number }
    ) => {
        if (!editMode) return
        if (event.button !== 0 && event.button !== 2) return
        const lockKey = headerLockForDrag[kind]
        if (lockKey && headerLocks[lockKey]) return
        event.preventDefault()
        event.stopPropagation()

        headerDragRef.current = {
            kind,
            startX: event.clientX,
            startY: event.clientY,
            startPositionX: position.x,
            startPositionY: position.y,
            startWidth: theme.coverWidth,
            startHeight: theme.bannerHeight,
            startBorderWidth: borderWidth,
            startBorderHeight: borderHeight,
            patch: {},
        }
        window.addEventListener('pointermove', handleHeaderMove)
        window.addEventListener('pointerup', handleHeaderUp, { once: true })
    }

    const handleHeaderMove = (event: globalThis.PointerEvent) => {
        const drag = headerDragRef.current
        if (!drag) return
        const rawDx = event.clientX - drag.startX
        const rawDy = event.clientY - drag.startY

        if (drag.kind === 'cover-size') {
            const width = Math.round(
                clamp(drag.startWidth + (rawDx / window.innerWidth) * 100, 30, 100)
            )
            const height = Math.round(clamp(drag.startHeight + rawDy, 160, 560))
            onThemeChange({ coverWidth: width, bannerHeight: height })
            drag.patch = {
                profile_cover_width: width,
                profile_banner_height: height,
            }
            return
        }

        const frameResizeDirections: Partial<
            Record<HeaderDragKind, { x: -1 | 0 | 1; y: -1 | 0 | 1 }>
        > = {
            'avatar-frame-left': { x: -1, y: 0 },
            'avatar-frame-right': { x: 1, y: 0 },
            'avatar-frame-top': { x: 0, y: -1 },
            'avatar-frame-bottom': { x: 0, y: 1 },
            'avatar-frame-top-left': { x: -1, y: -1 },
            'avatar-frame-top-right': { x: 1, y: -1 },
            'avatar-frame-bottom-left': { x: -1, y: 1 },
            'avatar-frame-bottom-right': { x: 1, y: 1 },
        }
        const frameResizeDirection = frameResizeDirections[drag.kind]

        if (frameResizeDirection) {
            const x = Number(
                clamp(drag.startPositionX + (frameResizeDirection.x * rawDx) / 112, 0.5, 3).toFixed(
                    3
                )
            )
            const y = Number(
                clamp(drag.startPositionY + (frameResizeDirection.y * rawDy) / 112, 0.5, 3).toFixed(
                    3
                )
            )
            const tabsConfig = {
                ...theme.tabsConfig,
                cover_offset: { x, y },
            }
            onThemeChange({ tabsConfig })
            drag.patch = { profile_tabs_config: JSON.stringify(tabsConfig) }
            return
        }

        if (drag.kind === 'avatar-frame-width') {
            const x = Number(clamp(drag.startPositionX + rawDx / 112, 0.5, 3).toFixed(3))
            const tabsConfig = {
                ...theme.tabsConfig,
                cover_offset: {
                    x,
                    y: normalizeProfileDisplayScale(theme.tabsConfig.cover_offset?.y),
                },
            }
            onThemeChange({ tabsConfig })
            drag.patch = { profile_tabs_config: JSON.stringify(tabsConfig) }
            return
        }

        if (drag.kind === 'avatar-frame-height') {
            const y = Number(clamp(drag.startPositionY + rawDy / 112, 0.5, 3).toFixed(3))
            const tabsConfig = {
                ...theme.tabsConfig,
                cover_offset: {
                    x: normalizeProfileDisplayScale(theme.tabsConfig.cover_offset?.x),
                    y,
                },
            }
            onThemeChange({ tabsConfig })
            drag.patch = { profile_tabs_config: JSON.stringify(tabsConfig) }
            return
        }

        if (drag.kind === 'avatar-frame-size') {
            const x = Number(clamp(drag.startPositionX + rawDx / 112, 0.5, 3).toFixed(3))
            const y = Number(clamp(drag.startPositionY + rawDy / 112, 0.5, 3).toFixed(3))
            const tabsConfig = {
                ...theme.tabsConfig,
                cover_offset: { x, y },
            }
            onThemeChange({ tabsConfig })
            drag.patch = { profile_tabs_config: JSON.stringify(tabsConfig) }
            return
        }

        if (drag.kind === 'cover-frame') {
            const x = snapCenterOffset(clamp(drag.startPositionX + rawDx, -320, 320))
            const y = clamp(drag.startPositionY + rawDy, -180, 180)
            const tabsConfig = {
                ...theme.tabsConfig,
                cover_offset: { x, y },
            }
            onThemeChange({ tabsConfig })
            drag.patch = { profile_tabs_config: JSON.stringify(tabsConfig) }
            return
        }

        if (drag.kind === 'avatar-border') {
            const x = Number((drag.startPositionX + rawDx).toFixed(2))
            const y = Number((drag.startPositionY + rawDy).toFixed(2))

            const tabsConfig = {
                ...theme.tabsConfig,
                border_offset: { x, y },
            }

            onThemeChange({ tabsConfig })

            drag.patch = {
                profile_tabs_config: JSON.stringify(tabsConfig),
            }

            return
        }

        if (drag.kind === 'avatar-border-width') {
            const width = Math.max(0.05, drag.startBorderWidth + rawDx / 112)

            const tabsConfig = {
                ...theme.tabsConfig,
                border_width: Number(width.toFixed(3)),
            }

            onThemeChange({ tabsConfig })

            drag.patch = {
                profile_tabs_config: JSON.stringify(tabsConfig),
            }

            return
        }

        if (drag.kind === 'avatar-border-height') {
            const height = Math.max(0.05, drag.startBorderHeight + rawDy / 112)

            const tabsConfig = {
                ...theme.tabsConfig,
                border_height: Number(height.toFixed(3)),
            }

            onThemeChange({ tabsConfig })

            drag.patch = {
                profile_tabs_config: JSON.stringify(tabsConfig),
            }

            return
        }

        if (drag.kind === 'avatar-border-size') {
            const width = Math.max(0.05, drag.startBorderWidth + rawDx / 112)

            const height = Math.max(0.05, drag.startBorderHeight + rawDy / 112)

            const tabsConfig = {
                ...theme.tabsConfig,
                border_width: Number(width.toFixed(3)),
                border_height: Number(height.toFixed(3)),
            }

            onThemeChange({ tabsConfig })

            drag.patch = {
                profile_tabs_config: JSON.stringify(tabsConfig),
            }

            return
        }

        if (drag.kind === 'cover-image') {
            const x = snapPercentCenter(clamp(drag.startPositionX + rawDx / 3, 0, 100))
            const y = snapPercentCenter(clamp(drag.startPositionY + rawDy / 3, 0, 100))
            setCoverPosition({ x, y })
            drag.patch = { profile_cover_position_x: x, profile_cover_position_y: y }
        } else if (drag.kind === 'avatar-image') {
            const x = snapPercentCenter(clamp(drag.startPositionX + rawDx / 3, 0, 100))
            const y = clamp(drag.startPositionY + rawDy / 3, 0, 100)
            onThemeChange({ avatarImageX: x, avatarImageY: y })
            drag.patch = { avatar_position_x: x, avatar_position_y: y }
        } else {
            const currentGlobalStyles = getExtendedGlobalStyles(theme.tabsConfig)
            if (!currentGlobalStyles.profile_image_position_enabled) return

            const x = snapPercentCenter(clamp(drag.startPositionX + rawDx / 3, 0, 100))
            const y = clamp(drag.startPositionY + rawDy / 3, 0, 100)
            const tabsConfig = {
                ...theme.tabsConfig,
                global_styles: {
                    ...currentGlobalStyles,
                    profile_image_x: x,
                    profile_image_y: y,
                } as ProfileTabsConfig['global_styles'],
            }
            onThemeChange({ tabsConfig })
            drag.patch = { profile_tabs_config: JSON.stringify(tabsConfig) }
        }
    }

    const handleHeaderUp = () => {
        const drag = headerDragRef.current
        headerDragRef.current = null
        window.removeEventListener('pointermove', handleHeaderMove)
        if (drag && Object.keys(drag.patch).length > 0) onSavePosition(drag.patch)
    }
    const globalStyles = getExtendedGlobalStyles(theme.tabsConfig)
    const identityPositionEnabled = Boolean(globalStyles.identity_position_enabled)
    const identityPosition = {
        x: identityPositionEnabled ? Number(globalStyles.identity_x ?? 0) : 0,
        y: identityPositionEnabled ? Number(globalStyles.identity_y ?? 0) : 0,
    }
    const profileImagePositionEnabled = Boolean(globalStyles.profile_image_position_enabled)
    const profileImageFramePosition = {
        x: profileImagePositionEnabled ? Number(globalStyles.profile_image_x ?? 50) : 50,
        y: profileImagePositionEnabled
            ? Number(globalStyles.profile_image_y ?? theme.avatarFrameY)
            : theme.avatarFrameY,
    }
    const showProfileInfo = globalStyles.show_profile_info !== false
    const profileTextStyle = {
        fontFamily: globalStyles.font_family || undefined,
        color: globalStyles.muted_text_color,
        fontSize: globalStyles.widget_font_size,
    }
    const profileButtonStyle = {
        fontFamily: globalStyles.font_family || undefined,
        fontSize: globalStyles.button_font_size,
    }

    return (
        <header className={`relative z-20 ${theme.showCover ? '' : ''}`}>
            {editMode && <CenterGuide />}
            <div className={theme.showCover ? 'relative bg-muted/30' : 'relative bg-transparent'}>
                {theme.showCover ? (
                    <div
                        className={`relative mx-auto overflow-hidden bg-muted ${
                            editMode ? 'ring-2 ring-foreground/30 ring-inset' : ''
                        }`}
                        style={{
                            height: theme.bannerHeight,
                            width: `${theme.coverWidth}%`,
                        }}
                    >
                        {cover ? (
                            <img
                                src={cover}
                                alt={`${artist.name} cover`}
                                className={`h-full w-full select-none ${
                                    editMode ? 'cursor-move touch-none' : ''
                                }`}
                                draggable={false}
                                style={{
                                    objectPosition: `${coverPosition.x}% ${coverPosition.y}%`,
                                    objectFit:
                                        globalStyles.cover_image_fit === 'contain'
                                            ? 'contain'
                                            : 'cover',
                                }}
                                onPointerDown={(event) =>
                                    beginHeaderDrag(event, 'cover-image', coverPosition)
                                }
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                <Layers className="h-8 w-8" />
                            </div>
                        )}
                        {editMode && (
                            <>
                                <button
                                    type="button"
                                    className="absolute bottom-0 right-0 h-7 w-7 cursor-nwse-resize border-b-4 border-r-4 border-foreground bg-background/70"
                                    aria-label="Resize cover"
                                    onPointerDown={(event) =>
                                        beginHeaderDrag(event, 'cover-size', { x: 0, y: 0 })
                                    }
                                />
                            </>
                        )}
                    </div>
                ) : editMode ? (
                    <div
                        className="mx-auto flex items-center justify-center text-xs text-muted-foreground"
                        style={{ height: headerVisualHeight }}
                    >
                        Cover image is hidden (this guide is only visible while editing)
                    </div>
                ) : null}
            </div>

            <div
                className="pointer-events-none absolute inset-x-0 top-0 z-[1000] mx-auto max-w-[1480px]"
                style={{ height: headerVisualHeight }}
            >
                <div
                    className="pointer-events-auto absolute isolate overflow-visible -translate-x-1/2 -translate-y-1/2"
                    style={{
                        left: `${profileImageFramePosition.x}%`,
                        top: `${profileImageFramePosition.y}%`,
                        width: profileDisplayWidth,
                        height: profileDisplayHeight,
                        maxWidth: 'min(196px, 32vw)',
                        maxHeight: 'min(196px, 32vw)',
                    }}
                >
                    {selectedBorder && (
                        <img
                            src={storageUrl(selectedBorder.image_path)!}
                            alt=""
                            className="pointer-events-none absolute left-1/2 top-1/2 max-h-none max-w-none select-none object-fill"
                            style={{
                                width: `${borderWidth * 100}%`,
                                height: `${borderHeight * 100}%`,
                                transform: `translate(calc(-50% + ${borderOffset.x}px), calc(-50% + ${borderOffset.y}px))`,
                                zIndex: borderLayer === 'front' ? 20 : -10,
                            }}
                            draggable={false}
                        />
                    )}

                    {editMode && selectedBorder && !headerLocks.avatar_border && (
                        <div
                            className="pointer-events-none absolute left-1/2 top-1/2 z-[1001] border border-dashed border-sky-400"
                            style={{
                                width: `${borderWidth * 100}%`,
                                height: `${borderHeight * 100}%`,
                                transform: `translate(calc(-50% + ${borderOffset.x}px), calc(-50% + ${borderOffset.y}px))`,
                            }}
                        >
                            <button
                                type="button"
                                className="pointer-events-auto absolute -left-3 -top-3 rounded bg-background p-1 shadow-md ring-1 ring-sky-400"
                                onPointerDown={(event) =>
                                    beginHeaderDrag(event, 'avatar-border', borderOffset)
                                }
                                aria-label="Move profile border"
                                title="Move profile border"
                            >
                                <Move className="h-3.5 w-3.5 text-sky-500" />
                            </button>

                            <button
                                type="button"
                                className="pointer-events-auto absolute -right-1 top-1/2 h-10 w-3 -translate-y-1/2 cursor-ew-resize rounded bg-sky-500 shadow-md ring-2 ring-white"
                                onPointerDown={(event) =>
                                    beginHeaderDrag(event, 'avatar-border-width', borderOffset)
                                }
                                aria-label="Resize profile border width"
                                title="Resize border width"
                            />

                            <button
                                type="button"
                                className="pointer-events-auto absolute -bottom-1 left-1/2 h-3 w-10 -translate-x-1/2 cursor-ns-resize rounded bg-sky-500 shadow-md ring-2 ring-white"
                                onPointerDown={(event) =>
                                    beginHeaderDrag(event, 'avatar-border-height', borderOffset)
                                }
                                aria-label="Resize profile border height"
                                title="Resize border height"
                            />

                            <button
                                type="button"
                                className="pointer-events-auto absolute -bottom-2 -right-2 h-5 w-5 cursor-nwse-resize border-b-4 border-r-4 border-white bg-sky-500 shadow-md"
                                onPointerDown={(event) =>
                                    beginHeaderDrag(event, 'avatar-border-size', borderOffset)
                                }
                                aria-label="Resize profile border width and height"
                                title="Resize width and height"
                            />
                        </div>
                    )}
                    {editMode && (
                        <HeaderLockButton
                            locked={headerLocks.avatar_frame}
                            label="Profile frame"
                            className="-left-7 -top-7 z-[1002]"
                            onToggle={() => toggleHeaderLock('avatar_frame')}
                        />
                    )}
                    {editMode && selectedBorder && (
                        <HeaderLockButton
                            locked={headerLocks.avatar_border}
                            label="Profile border"
                            className="-right-7 -top-7 z-[1002]"
                            onToggle={() => toggleHeaderLock('avatar_border')}
                        />
                    )}

                    <div
                        className={`relative z-0 flex h-full w-full items-center justify-center overflow-hidden bg-primary text-3xl font-bold text-primary-foreground ${
                            editMode
                                ? profileImagePositionEnabled
                                    ? 'cursor-move ring-2 ring-foreground/20'
                                    : 'ring-2 ring-foreground/20'
                                : ''
                        }`}
                        style={{
                            borderColor: theme.avatarBorderColor || 'var(--background)',
                            borderRadius: `${theme.avatarBorderRadius}%`,
                            borderStyle: 'solid',
                            borderWidth: theme.avatarBorderWidth,
                        }}
                        onPointerDown={(event) => {
                            if (event.button !== 0 || !profileImagePositionEnabled) return
                            beginHeaderDrag(event, 'avatar-frame', profileImageFramePosition)
                        }}
                        onContextMenu={(event) => event.preventDefault()}
                    >
                        {avatar ? (
                            <img
                                src={avatar}
                                alt={artist.name}
                                className="h-full w-full select-none"
                                draggable={false}
                                style={{
                                    objectPosition: `${avatarImagePosition.x}% ${avatarImagePosition.y}%`,
                                    objectFit:
                                        globalStyles.avatar_image_fit === 'contain'
                                            ? 'contain'
                                            : 'cover',
                                }}
                            />
                        ) : (
                            avatarLetter
                        )}
                    </div>
                    {editMode && !headerLocks.avatar_frame && (
                        <>
                            <button
                                type="button"
                                className="absolute -left-2 top-1/2 z-[1002] h-10 w-3 -translate-y-1/2 cursor-ew-resize rounded bg-sky-500 shadow-md ring-2 ring-white"
                                onPointerDown={(event) =>
                                    beginHeaderDrag(event, 'avatar-frame-left', {
                                        x: profileDisplayScaleX,
                                        y: profileDisplayScaleY,
                                    })
                                }
                                aria-label="Resize profile display from left"
                                title="Resize from left"
                            />
                            <button
                                type="button"
                                className="absolute -right-2 top-1/2 z-[1002] h-10 w-3 -translate-y-1/2 cursor-ew-resize rounded bg-sky-500 shadow-md ring-2 ring-white"
                                onPointerDown={(event) =>
                                    beginHeaderDrag(event, 'avatar-frame-right', {
                                        x: profileDisplayScaleX,
                                        y: profileDisplayScaleY,
                                    })
                                }
                                aria-label="Resize profile display from right"
                                title="Resize from right"
                            />
                            <button
                                type="button"
                                className="absolute -top-2 left-1/2 z-[1002] h-3 w-10 -translate-x-1/2 cursor-ns-resize rounded bg-sky-500 shadow-md ring-2 ring-white"
                                onPointerDown={(event) =>
                                    beginHeaderDrag(event, 'avatar-frame-top', {
                                        x: profileDisplayScaleX,
                                        y: profileDisplayScaleY,
                                    })
                                }
                                aria-label="Resize profile display from top"
                                title="Resize from top"
                            />
                            <button
                                type="button"
                                className="absolute -bottom-2 left-1/2 z-[1002] h-3 w-10 -translate-x-1/2 cursor-ns-resize rounded bg-sky-500 shadow-md ring-2 ring-white"
                                onPointerDown={(event) =>
                                    beginHeaderDrag(event, 'avatar-frame-bottom', {
                                        x: profileDisplayScaleX,
                                        y: profileDisplayScaleY,
                                    })
                                }
                                aria-label="Resize profile display from bottom"
                                title="Resize from bottom"
                            />
                            <button
                                type="button"
                                className="absolute -left-2 -top-2 z-[1003] h-5 w-5 cursor-nwse-resize rounded-sm bg-sky-500 shadow-md ring-2 ring-white"
                                onPointerDown={(event) =>
                                    beginHeaderDrag(event, 'avatar-frame-top-left', {
                                        x: profileDisplayScaleX,
                                        y: profileDisplayScaleY,
                                    })
                                }
                                aria-label="Resize profile display from top left"
                                title="Resize from top left"
                            />
                            <button
                                type="button"
                                className="absolute -right-2 -top-2 z-[1003] h-5 w-5 cursor-nesw-resize rounded-sm bg-sky-500 shadow-md ring-2 ring-white"
                                onPointerDown={(event) =>
                                    beginHeaderDrag(event, 'avatar-frame-top-right', {
                                        x: profileDisplayScaleX,
                                        y: profileDisplayScaleY,
                                    })
                                }
                                aria-label="Resize profile display from top right"
                                title="Resize from top right"
                            />
                            <button
                                type="button"
                                className="absolute -bottom-2 -left-2 z-[1003] h-5 w-5 cursor-nesw-resize rounded-sm bg-sky-500 shadow-md ring-2 ring-white"
                                onPointerDown={(event) =>
                                    beginHeaderDrag(event, 'avatar-frame-bottom-left', {
                                        x: profileDisplayScaleX,
                                        y: profileDisplayScaleY,
                                    })
                                }
                                aria-label="Resize profile display from bottom left"
                                title="Resize from bottom left"
                            />
                            <button
                                type="button"
                                className="absolute -bottom-2 -right-2 z-[1003] h-5 w-5 cursor-nwse-resize rounded-sm bg-sky-500 shadow-md ring-2 ring-white"
                                onPointerDown={(event) =>
                                    beginHeaderDrag(event, 'avatar-frame-bottom-right', {
                                        x: profileDisplayScaleX,
                                        y: profileDisplayScaleY,
                                    })
                                }
                                aria-label="Resize profile display from bottom right"
                                title="Resize from bottom right"
                            />
                        </>
                    )}
                    {editMode && (
                        <div className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-background px-2 py-0.5 text-[10px] text-foreground shadow-sm">
                            Drag up/down · resize from any edge or corner
                        </div>
                    )}
                </div>
            </div>

            {showProfileInfo && (
                <div
                    className="mx-auto px-4 pb-6 text-center"
                    style={{
                        paddingTop: Math.max(64, Math.min(196, profileDisplayHeight) / 2 + 24),
                        background: globalStyles.header_background_enabled
                            ? toRgba(
                                  globalStyles.header_background_color ?? '#ffffff',
                                  Number(globalStyles.header_background_opacity ?? 100) / 100
                              )
                            : 'transparent',
                    }}
                >
                    <div
                        className="relative mx-auto w-fit max-w-full"
                        style={{
                            transform: `translate(${identityPosition.x}px, ${identityPosition.y}px)`,
                        }}
                    >
                        <h1 className="mt-3 inline-flex items-center justify-center gap-2 text-2xl font-bold">
                            {artist.name}
                            {artist.artist_verified && (
                                <BadgeCheck
                                    className="h-5 w-5 text-sky-500"
                                    aria-label="Verified artist"
                                />
                            )}
                        </h1>
                        <p className="text-sm text-muted-foreground">@{artist.username}</p>
                        {!isOwner && (
                            <div className="mt-3 flex justify-center">
                                <Button
                                    size="sm"
                                    variant={profile.stats?.is_following ? 'outline' : 'default'}
                                    disabled={followBusy}
                                    onClick={onToggleFollow}
                                    style={profileButtonStyle}
                                >
                                    {profile.stats?.is_following ? 'Unfollow' : 'Follow'}
                                </Button>
                            </div>
                        )}
                        <div
                            className="mt-2 grid justify-center gap-1 text-xs text-muted-foreground"
                            style={profileTextStyle}
                        >
                            <p>
                                {(
                                    profile.stats?.followers_count ??
                                    artist.followers_count ??
                                    0
                                ).toLocaleString()}{' '}
                                followers
                            </p>
                            <p>{(profile.stats?.total_likes ?? 0).toLocaleString()} total likes</p>
                        </div>
                        {!isOwner && (
                            <div className="mt-3 flex justify-center">
                                <Button
                                    asChild
                                    size="sm"
                                    variant="outline"
                                    style={profileButtonStyle}
                                >
                                    <Link to={`/messages?to=${artist.username}`}>Message</Link>
                                </Button>
                            </div>
                        )}
                        {draft.artistTitle && <p className="mt-1 text-sm">{draft.artistTitle}</p>}
                        {links.length > 0 && (
                            <div className="mt-3 flex flex-wrap justify-center gap-2">
                                {links.map((link) => (
                                    <a
                                        key={link.label}
                                        href={toPublicHref(link.value)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                                    >
                                        <LinkIcon className="h-3 w-3" />
                                        {link.label}
                                    </a>
                                ))}
                            </div>
                        )}
                        {artist.bio && (
                            <p className="max-w-2xl mx-auto mt-3 text-sm text-muted-foreground">
                                {artist.bio}
                            </p>
                        )}
                        {!draft.artistTitle && !artist.bio && links.length === 0 && (
                            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                                {/* No profile information added yet. */}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </header>
    )
}
