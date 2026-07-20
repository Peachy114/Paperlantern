import type { CSSProperties, ReactNode } from 'react'
import type { RoyaltyDesignAsset, RoyaltyDesignImageLayer, RoyaltyDesignPiece } from '@/types/artistProfile'
import { storageUrl } from '@/utils/storage'

type DesignSettings = NonNullable<RoyaltyDesignAsset['style_settings']>

export function RoyaltyMessageBubble({
    children,
    mine,
    design,
    previewImageUrl,
}: {
    children: ReactNode
    mine: boolean
    design: RoyaltyDesignAsset | null
    previewImageUrl?: string | null
}) {
    const settings = design?.style_settings ?? {}
    const image = previewImageUrl ?? (design?.image_path ? storageUrl(design.image_path) : null)

    if (settings.design_source === 'simple') {
        return (
            <div className="relative w-fit max-w-full px-4 py-2 text-left text-sm" style={simpleBubbleStyle(settings, mine)}>
                <FontStylesheet settings={settings} />
                {children}
                <SimpleTail settings={settings} sent={mine} />
            </div>
        )
    }

    const sliceTop = Number(settings.slice_top ?? 18)
    const sliceRight = Number(settings.slice_right ?? 18)
    const sliceBottom = Number(settings.slice_bottom ?? 18)
    const sliceLeft = Number(settings.slice_left ?? 18)
    const center = normalizedCenterPiece(settings)
    const frameStyle: CSSProperties | undefined = image
        ? {
              borderStyle: 'solid',
              borderWidth: `${sliceTop}px ${sliceRight}px ${sliceBottom}px ${sliceLeft}px`,
              borderImageSource: `url(${image})`,
              borderImageSlice: `${sliceTop} ${sliceRight} ${sliceBottom} ${sliceLeft} fill`,
              borderImageRepeat: 'round',
              padding: 0,
              maxWidth: `min(76%, ${Math.max(120, center.w + sliceLeft + sliceRight)}px)`,
          }
        : undefined

    return (
        <div
            className={`relative w-fit max-w-full text-left text-sm ${
                image ? '' : mine ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}
            style={{
                ...frameStyle,
                ...designTextStyle(settings),
            }}
        >
            <div
                className="relative z-10 whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
                style={{
                    width: image ? center.w : undefined,
                    minHeight: image ? center.h : undefined,
                    padding: image ? '0.25rem 0.5rem' : '0.5rem 0.75rem',
                }}
            >
                {children}
            </div>
        </div>
    )
}

export function royaltyMessageBackgroundStyle(background: RoyaltyDesignAsset | null, previewImageUrl?: string | null): CSSProperties | undefined {
    const image = previewImageUrl ?? (background?.image_path ? storageUrl(background.image_path) : null)
    const settings = background?.style_settings ?? {}
    if (!image) return undefined

    return {
        backgroundImage: `url(${image})`,
        backgroundSize: settings.fit_mode === 'stretch' ? '100% 100%' : settings.fit_mode === 'stay' ? 'auto' : 'cover',
        backgroundPosition: `calc(${settings.position_x ?? 50}% + ${settings.move_x ?? 0}px) calc(${settings.position_y ?? 50}% + ${settings.move_y ?? 0}px)`,
        backgroundRepeat: 'no-repeat',
    }
}

export function RoyaltyMessageBackgroundPreview({
    design,
    previewImageUrl,
}: {
    design: RoyaltyDesignAsset | null
    previewImageUrl?: string | null
}) {
    const settings = design?.style_settings ?? {}
    return (
        <div
            className="relative mx-auto overflow-hidden rounded-[28px] border border-foreground/10 bg-muted shadow-sm"
            style={{
                width: Math.max(280, Number(settings.preview_width ?? 360)),
                height: Math.max(420, Number(settings.preview_height ?? 140) * 3),
                ...royaltyMessageBackgroundStyle(design, previewImageUrl),
            }}
        >
            <div className="border-b bg-background/90 px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/20" />
                    <div>
                        <div className="text-sm font-semibold">Message Preview</div>
                        <div className="text-xs text-muted-foreground">Online</div>
                    </div>
                </div>
            </div>
            <div className="space-y-3 p-4">
                <div className="w-fit max-w-[76%] rounded-2xl bg-background px-4 py-2 text-sm shadow-sm">
                    This is the message cover/background.
                </div>
                <div className="ml-auto w-fit max-w-[76%] rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground shadow-sm">
                    It should fill the whole messenger area.
                </div>
            </div>
        </div>
    )
}

export function RoyaltyDesignSurface({
    design,
    previewImageUrl,
    className = '',
    children,
}: {
    design: RoyaltyDesignAsset | null
    previewImageUrl?: string | null
    className?: string
    children: ReactNode
}) {
    const settings = design?.style_settings ?? {}
    const width = Number(settings.preview_width ?? 360)
    const height = Number(settings.preview_height ?? 120)
    const image = previewImageUrl ?? (design?.image_path ? storageUrl(design.image_path) : null)

    return (
        <div
            className={`relative ${settings.clip_to_parent === false ? 'overflow-visible' : 'overflow-hidden'} ${className}`}
            style={{ width, minHeight: height }}
        >
            <ImageLayers layers={settings.image_layers ?? []} />
            {image && <SliceFrame image={image} settings={settings} />}
            <ContentSlot settings={settings}>{children}</ContentSlot>
        </div>
    )
}

export function LayeredNameText({
    settings,
    name,
    text,
}: {
    settings: RoyaltyDesignAsset['style_settings']
    name: string
    text: string
}) {
    if (settings?.text_name_combined_layer) {
        return (
            <div className="relative" style={{ zIndex: Number(settings.content_layer ?? 3) }}>
                <p className="font-semibold">{name}</p>
                <p className="mt-1">{text}</p>
            </div>
        )
    }

    return (
        <div className="relative min-h-[3rem]">
            <p className="relative font-semibold" style={{ zIndex: Number(settings?.name_layer ?? 4) }}>{name}</p>
            <p className="relative mt-1" style={{ zIndex: Number(settings?.text_layer ?? 5) }}>{text}</p>
        </div>
    )
}

function ContentSlot({ settings, children }: { settings: RoyaltyDesignAsset['style_settings']; children: ReactNode }) {
    const center = normalizedFullCenterPiece(settings)
    return (
        <div
            className="absolute grid min-h-0 min-w-0 overflow-hidden"
            style={{
                left: center.x + center.move_x,
                top: center.y + center.move_y,
                width: center.w,
                minHeight: center.h,
                zIndex: Number(settings?.content_layer ?? 3),
                alignItems:
                    settings?.content_align_y === 'start'
                        ? 'start'
                        : settings?.content_align_y === 'end'
                          ? 'end'
                          : 'center',
                justifyItems:
                    settings?.text_align === 'left'
                        ? 'start'
                        : settings?.text_align === 'right'
                          ? 'end'
                          : 'center',
            }}
        >
            <div className="max-w-full break-words px-3 py-2 [overflow-wrap:anywhere]" style={designTextStyle(settings)}>
                {children}
            </div>
        </div>
    )
}

function ImageLayers({ layers }: { layers: RoyaltyDesignImageLayer[] }) {
    return (
        <>
            {layers.map((layer, index) => (
                <div
                    key={layer.id ?? `${layer.name ?? 'layer'}-${index}`}
                    className="pointer-events-none absolute overflow-hidden"
                    style={{
                        left: Number(layer.x ?? 0),
                        top: Number(layer.y ?? 0),
                        width: Math.max(1, Number(layer.w ?? 120)),
                        height: Math.max(1, Number(layer.h ?? 72)),
                        transform: `translate(${Number(layer.move_x ?? 0)}px, ${Number(layer.move_y ?? 0)}px) rotate(${Number(layer.rotation ?? 0)}deg)`,
                        opacity: Number(layer.opacity ?? 100) / 100,
                        zIndex: Number(layer.z_index ?? index + 1),
                    }}
                >
                    {layer.preview_url && (
                        <img
                            src={layer.preview_url}
                            alt=""
                            className="h-full w-full"
                            style={{
                                objectFit: layer.fit_mode === 'stretch' ? 'fill' : layer.fit_mode === 'stay' ? 'contain' : 'cover',
                                objectPosition: `${Number(layer.position_x ?? 50)}% ${Number(layer.position_y ?? 50)}%`,
                            }}
                        />
                    )}
                </div>
            ))}
        </>
    )
}

function SliceFrame({ image, settings }: { image: string; settings: RoyaltyDesignAsset['style_settings'] }) {
    const width = Number(settings?.preview_width ?? 360)
    const height = Number(settings?.preview_height ?? 120)
    const left = clamp(Number(settings?.slice_left ?? 24), 0, width)
    const right = clamp(Number(settings?.slice_right ?? 24), 0, width)
    const top = clamp(Number(settings?.slice_top ?? 24), 0, height)
    const bottom = clamp(Number(settings?.slice_bottom ?? 24), 0, height)
    const centerW = Math.max(1, width - left - right)
    const centerH = Math.max(1, height - top - bottom)
    const parts = settings?.custom_parts ?? {}

    const pieces: Array<{ key: keyof NonNullable<DesignSettings['custom_parts']>; sx: number; sy: number; sw: number; sh: number; x: number; y: number; w: number; h: number }> = [
        { key: 'top_left', sx: 0, sy: 0, sw: left, sh: top, x: 0, y: 0, w: left, h: top },
        { key: 'top', sx: left, sy: 0, sw: centerW, sh: top, x: left, y: 0, w: centerW, h: top },
        { key: 'top_right', sx: width - right, sy: 0, sw: right, sh: top, x: width - right, y: 0, w: right, h: top },
        { key: 'left', sx: 0, sy: top, sw: left, sh: centerH, x: 0, y: top, w: left, h: centerH },
        { key: 'center', sx: left, sy: top, sw: centerW, sh: centerH, x: left, y: top, w: centerW, h: centerH },
        { key: 'right', sx: width - right, sy: top, sw: right, sh: centerH, x: width - right, y: top, w: right, h: centerH },
        { key: 'bottom_left', sx: 0, sy: height - bottom, sw: left, sh: bottom, x: 0, y: height - bottom, w: left, h: bottom },
        { key: 'bottom', sx: left, sy: height - bottom, sw: centerW, sh: bottom, x: left, y: height - bottom, w: centerW, h: bottom },
        { key: 'bottom_right', sx: width - right, sy: height - bottom, sw: right, sh: bottom, x: width - right, y: height - bottom, w: right, h: bottom },
    ]

    return (
        <div className="pointer-events-none absolute inset-0 z-0">
            {pieces.map((piece) => {
                const raw = parts[piece.key]
                const behavior = typeof raw === 'object' ? raw : undefined
                if (raw === false || behavior?.enabled === false || piece.w <= 0 || piece.h <= 0) return null
                return <SlicePiece key={piece.key} image={image} piece={piece} behavior={behavior} settings={settings} />
            })}
        </div>
    )
}

function SlicePiece({
    image,
    piece,
    behavior,
    settings,
}: {
    image: string
    piece: { sx: number; sy: number; sw: number; sh: number; x: number; y: number; w: number; h: number }
    behavior?: RoyaltyDesignPiece
    settings: RoyaltyDesignAsset['style_settings']
}) {
    const fit = behavior?.fit_mode ?? 'stretch'
    const scaleX = fit === 'stretch' ? piece.w / Math.max(1, piece.sw) : 1
    const scaleY = fit === 'stretch' ? piece.h / Math.max(1, piece.sh) : 1
    const backgroundSize = fit === 'cover' ? 'cover' : `${Number(settings?.preview_width ?? 360) * scaleX}px ${Number(settings?.preview_height ?? 120) * scaleY}px`
    const backgroundPosition = fit === 'cover' ? `${Number(behavior?.position_x ?? 50)}% ${Number(behavior?.position_y ?? 50)}%` : `${-piece.sx * scaleX}px ${-piece.sy * scaleY}px`

    return (
        <div
            className="absolute overflow-hidden"
            style={{
                left: piece.x,
                top: piece.y,
                width: piece.w,
                height: piece.h,
                backgroundImage: `url(${image})`,
                backgroundSize,
                backgroundPosition,
                backgroundRepeat: 'no-repeat',
                backgroundColor: behavior?.background_color || 'transparent',
                borderRadius: Number(behavior?.border_radius ?? 0),
                opacity: Number(behavior?.opacity ?? 100) / 100,
                zIndex: Number(behavior?.z_index ?? 0),
                transform: `rotate(${Number(behavior?.rotation ?? 0)}deg)`,
            }}
        />
    )
}

function normalizedCenterPiece(settings: RoyaltyDesignAsset['style_settings'] = {}) {
    const raw = settings?.custom_parts?.center
    if (raw && typeof raw === 'object') {
        return {
            w: Number(raw.w) || Math.max(120, Number(settings?.preview_width ?? 360) - Number(settings?.slice_left ?? 18) - Number(settings?.slice_right ?? 18)),
            h: Number(raw.h) || Math.max(32, Number(settings?.preview_height ?? 120) - Number(settings?.slice_top ?? 18) - Number(settings?.slice_bottom ?? 18)),
        }
    }

    return {
        w: Math.max(120, Number(settings?.preview_width ?? 360) - Number(settings?.slice_left ?? 18) - Number(settings?.slice_right ?? 18)),
        h: Math.max(32, Number(settings?.preview_height ?? 120) - Number(settings?.slice_top ?? 18) - Number(settings?.slice_bottom ?? 18)),
    }
}

function normalizedFullCenterPiece(settings: RoyaltyDesignAsset['style_settings'] = {}) {
    const raw = settings?.custom_parts?.center
    if (raw && typeof raw === 'object') {
        return {
            x: Number(raw.x ?? 24),
            y: Number(raw.y ?? 24),
            w: Number(raw.w ?? 312),
            h: Number(raw.h ?? 72),
            move_x: Number(raw.move_x ?? 0),
            move_y: Number(raw.move_y ?? 0),
        }
    }

    return {
        x: Number(settings?.slice_left ?? 24),
        y: Number(settings?.slice_top ?? 24),
        w: Math.max(120, Number(settings?.preview_width ?? 360) - Number(settings?.slice_left ?? 24) - Number(settings?.slice_right ?? 24)),
        h: Math.max(32, Number(settings?.preview_height ?? 120) - Number(settings?.slice_top ?? 24) - Number(settings?.slice_bottom ?? 24)),
        move_x: 0,
        move_y: 0,
    }
}

function designTextStyle(settings: RoyaltyDesignAsset['style_settings'] = {}): CSSProperties {
    return {
        fontFamily: settings?.font_family || undefined,
        fontSize: settings?.font_size,
        fontWeight:
            settings?.font_weight === 'bold'
                ? 700
                : settings?.font_weight === 'medium'
                  ? 500
                  : undefined,
        fontStyle: settings?.font_style,
        textAlign: settings?.text_align,
        textTransform: settings?.text_transform === 'none' ? undefined : settings?.text_transform,
    }
}

function simpleBubbleStyle(settings: RoyaltyDesignAsset['style_settings'] = {}, sent: boolean): CSSProperties {
    const base: CSSProperties = {
        ...designTextStyle(settings),
        ...simpleBubbleBackgroundStyle(settings, sent),
        lineHeight: 1.45,
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        color: sent ? '#ffffff' : '#111827',
        border: Number(settings?.simple_border_width ?? 0) > 0 ? `${Number(settings?.simple_border_width)}px solid ${settings?.simple_border_color || '#111827'}` : undefined,
        borderRadius: Number(settings?.simple_radius ?? 18),
        overflow: 'visible',
    }

    if (settings?.simple_theme === 'comic') return { ...base, color: '#111827', boxShadow: '5px 6px 0 #111827', fontWeight: 700 }
    if (settings?.simple_theme === 'glass') return { ...base, color: '#ffffff', boxShadow: '0 12px 35px rgba(0,0,0,.18)', backdropFilter: 'blur(14px)' }
    if (settings?.simple_theme === 'pixel') {
        return {
            ...base,
            color: '#111827',
            boxShadow: '4px 0 0 #111827, -4px 0 0 #111827, 0 4px 0 #111827, 0 -4px 0 #111827',
            fontFamily: settings?.font_family || '"Courier New", monospace',
            fontWeight: 700,
            margin: 4,
        }
    }
    if (settings?.simple_theme === 'svg') {
        return {
            ...base,
            color: '#ffffff',
            paddingBottom: 26,
            clipPath: sent
                ? 'polygon(0 0, 100% 0, 100% 83%, 90% 83%, 96% 100%, 74% 83%, 0 83%)'
                : 'polygon(0 0, 100% 0, 100% 83%, 26% 83%, 4% 100%, 10% 83%, 0 83%)',
        }
    }
    if (settings?.simple_theme === 'image_card') return { ...base, color: sent ? '#ffffff' : '#111827', boxShadow: '0 10px 24px rgba(15,23,42,.22)' }

    return base
}

function simpleBubbleBackgroundStyle(settings: RoyaltyDesignAsset['style_settings'] = {}, sent: boolean): CSSProperties {
    if (settings?.simple_bg_mode === 'image' && settings.simple_bg_image) {
        return {
            backgroundImage: `url(${settings.simple_bg_image})`,
            backgroundSize: settings.simple_bg_fit === 'stretch' ? '100% 100%' : settings.simple_bg_fit || 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
        }
    }

    if (settings?.simple_theme === 'image_card') {
        return {
            background: sent
                ? 'linear-gradient(rgba(15,23,42,.45), rgba(15,23,42,.45)), radial-gradient(circle at 20% 20%, #f97316, transparent 30%), radial-gradient(circle at 80% 0, #8b5cf6, transparent 32%), linear-gradient(135deg, #0f172a, #1e293b)'
                : 'linear-gradient(rgba(255,255,255,.75), rgba(255,255,255,.75)), repeating-linear-gradient(45deg, #cbd5e1 0 8px, #e2e8f0 8px 16px)',
        }
    }

    return { background: simpleBubbleBackground(settings, sent) }
}

function FontStylesheet({ settings }: { settings: RoyaltyDesignAsset['style_settings'] }) {
    const href = settings?.font_url?.trim()
    if (!href || !/^https?:\/\//i.test(href)) return null

    return <link rel="stylesheet" href={href} />
}

function SimpleTail({ settings, sent }: { settings: RoyaltyDesignAsset['style_settings']; sent: boolean }) {
    const style = simpleTailStyle(settings, sent)
    if (!style) return null

    return <span aria-hidden className="pointer-events-none absolute" style={style} />
}

function simpleTailStyle(settings: RoyaltyDesignAsset['style_settings'] = {}, sent: boolean): CSSProperties | null {
    if ((settings?.simple_tail ?? 'curve') === 'none') return null
    const background = simpleBubbleBackground(settings, sent)
    const borderWidth = Math.max(0, Number(settings?.simple_border_width ?? 0))
    const borderColor = settings?.simple_border_color || '#111827'
    const side = sent ? { right: -7 } : { left: -7 }

    if (settings?.simple_tail === 'straight') {
        return {
            ...side,
            bottom: 6,
            width: 0,
            height: 0,
            borderTop: '8px solid transparent',
            borderBottom: '8px solid transparent',
            ...(sent ? { borderLeft: `12px solid ${background}` } : { borderRight: `12px solid ${background}` }),
            filter: borderWidth > 0 ? `drop-shadow(${sent ? 1 : -1}px 0 0 ${borderColor})` : undefined,
        }
    }

    return {
        ...side,
        bottom: 3,
        width: 16,
        height: 16,
        background,
        borderRight: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : undefined,
        borderBottom: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : undefined,
        transform: sent ? 'rotate(-35deg)' : 'rotate(35deg)',
        borderBottomRightRadius: 10,
    }
}

function simpleBubbleBackground(settings: RoyaltyDesignAsset['style_settings'] = {}, sent: boolean) {
    return sent ? (settings?.simple_sent_bg || settings?.simple_accent || '#7c3aed') : (settings?.simple_received_bg || '#e2e8f0')
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}
