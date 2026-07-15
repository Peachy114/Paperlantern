import type { CSSProperties, ReactNode } from 'react'
import type { PageWidget } from '@/types/pageLayout'
import { storageUrl } from '@/utils/storage'

export function cssColor(value?: string) {
    const color = value?.trim()
    if (!color) return undefined
    return /^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?([0-9a-fA-F]{2})?$/.test(color) ? `#${color}` : color
}

export function widgetTransform(
    widget: PageWidget,
    options: { includeRotate?: boolean; includeTranslateX?: boolean; includeTranslateY?: boolean } = {}
) {
    const style = widget.style ?? {}
    const includeRotate = options.includeRotate ?? true
    const includeTranslateX = options.includeTranslateX ?? true
    const includeTranslateY = options.includeTranslateY ?? true
    const transforms: string[] = []
    if ((style.offset_x || style.offset_y) && (includeTranslateX || includeTranslateY)) {
        const x = includeTranslateX ? style.offset_x ?? 0 : 0
        const y = includeTranslateY ? style.offset_y ?? 0 : 0
        transforms.push(`translate(${x}px, ${y}px)`)
    }
    if (includeRotate && style.rotate) {
        transforms.push(`rotate(${style.rotate}deg)`)
    }
    return transforms.length ? transforms.join(' ') : undefined
}

export function stickerImageStyle(widget: PageWidget, size: number): CSSProperties {
    return {
        width: `${size}px`,
        transform: widget.style?.rotate ? `rotate(${widget.style.rotate}deg)` : undefined,
        transformOrigin: 'center',
    }
}

export function fontFamilyFromUrl(url?: string) {
    const match = url?.match(/[?&]family=([^:&]+)/)
    if (!match) return undefined

    return decodeURIComponent(match[1].replace(/\+/g, ' '))
}

export function widgetStyle(widget: PageWidget): CSSProperties {
    const style = widget.style ?? {}
    const stickerOverlay = widget.type === 'sticker' && Boolean(widget.settings?.allow_overlap)
    const customContent = ['text', 'image', 'spacer'].includes(widget.type)
    const customOverlay = customContent && Boolean(widget.settings?.allow_overlap)
    const overlay = stickerOverlay || customOverlay
    const hasResponsiveOverlayX = overlay && Number.isFinite(style.offset_x_percent)
    const hasResponsiveOverlayY = false
    const align = widget.settings?.align ?? 'auto'
    const inlineDisplay = widget.settings?.display === 'inline'
    const contentRailStart = 'max(20px, calc((100% - 1360px) / 2 + 20px))'
    const contentRailWidth = 'min(calc(100% - 40px), 1320px)'
    const paddingBlock = style.padding_block ?? style.padding ?? 0
    const paddingInline = style.padding_inline ?? style.padding ?? 0
    const marginBlock = style.margin_block ?? style.margin ?? 0
    const marginInline = style.margin_inline ?? 0
    const contentWidth = style.content_width
    const horizontalInset = marginInline
        ? `calc(${contentRailStart} + ${marginInline}px)`
        : contentRailStart
    const customContentWidth = contentWidth
        ? `min(${contentWidth}px, calc(100% - ${horizontalInset} - ${horizontalInset}))`
        : `calc(100% - ${horizontalInset} - ${horizontalInset})`
    const customMarginLeft =
        align === 'center' || align === 'end' ? 'auto' : horizontalInset
    const customMarginRight =
        align === 'center' || align === 'start' ? 'auto' : horizontalInset
    const customWidth =
        align === 'stretch' || align === 'justify' || align === 'auto' || !contentWidth
            ? customContentWidth
            : `${contentWidth}px`
    const alignChanged = align !== 'auto'
    const alignedFrame = !overlay && !customContent && alignChanged
    const inlineFrame = !overlay && !customContent && inlineDisplay
    const frameWidth =
        alignedFrame || inlineFrame
            ? align === 'stretch' || align === 'justify' || !contentWidth
                ? customContentWidth
                : `${contentWidth}px`
            : undefined
    const frameMarginLeft =
        alignedFrame
            ? customMarginLeft
            : inlineFrame
              ? horizontalInset
              : undefined
    const frameMarginRight =
        alignedFrame
            ? customMarginRight
            : inlineFrame
              ? 0
              : undefined

    return {
        background: style.transparent ? 'transparent' : cssColor(style.background),
        border: style.border ? `1px solid ${cssColor(style.border_color) ?? 'var(--border, #d4d4d8)'}` : undefined,
        borderRadius: `${style.radius ?? 0}px`,
        padding: `${paddingBlock}px ${paddingInline}px`,
        margin: overlay
            ? 0
            : customContent || alignedFrame || inlineFrame
            ? `${marginBlock}px 0`
            : `${marginBlock}px ${marginInline}px`,
        zIndex: style.z_index ?? 1,
        position: overlay
            ? 'absolute'
            : widget.settings?.allow_overlap || style.offset_x || style.offset_y
              ? 'relative'
              : undefined,
        left: overlay
            ? hasResponsiveOverlayX
                ? `calc(${contentRailStart} + (${contentRailWidth} * ${style.offset_x_percent} / 100))`
                : contentRailStart
            : undefined,
        top: overlay ? (hasResponsiveOverlayY ? `${style.offset_y_percent}%` : 0) : undefined,
        display: stickerOverlay || inlineDisplay ? 'inline-block' : undefined,
        width: stickerOverlay
            ? 'max-content'
            : customContent
              ? customWidth
              : frameWidth,
        maxWidth: stickerOverlay ? '100%' : customContent ? undefined : undefined,
        minHeight: widget.type === 'spacer' ? `${style.content_height ?? 120}px` : undefined,
        marginLeft: overlay ? undefined : customContent ? customMarginLeft : frameMarginLeft,
        marginRight: overlay ? undefined : customContent ? customMarginRight : frameMarginRight,
        boxSizing: 'border-box',
        verticalAlign: inlineDisplay ? 'top' : undefined,
        transform: widgetTransform(widget, {
            includeRotate: widget.type !== 'sticker',
            includeTranslateX: !hasResponsiveOverlayX,
            includeTranslateY: !hasResponsiveOverlayY,
        }),
        transformOrigin: 'center',
    }
}

export function isPageOverlayWidget(widget: PageWidget) {
    return (
        ['sticker', 'text', 'image', 'spacer'].includes(widget.type) &&
        Boolean(widget.settings?.allow_overlap)
    )
}

export function isAnchoredPageWidget(widget: PageWidget) {
    return isPageOverlayWidget(widget) && Boolean(widget.settings?.anchor_widget_id)
}

export function PageWidgetFrame({
    widget,
    children,
    containsOverlay = false,
}: {
    widget: PageWidget
    children: ReactNode
    containsOverlay?: boolean
}) {
    if (!widget.enabled) return null

    const style = widgetStyle(widget)
    if (containsOverlay && !isPageOverlayWidget(widget)) {
        style.position = style.position ?? 'relative'
    }

    return <div style={style}>{children}</div>
}

export function CustomPageWidgetContent({ widget }: { widget: PageWidget }) {
    const imagePath = widget.type === 'sticker'
        ? widget.settings.sticker_image_path || widget.settings.asset_path
        : widget.settings.asset_path
    const src = imagePath ? storageUrl(imagePath) : null

    if (widget.type === 'text') {
        const fontUrl = widget.settings.font_url?.trim()
        const text = widget.settings.text?.trim()
        if (!text) return null
        const fontFamily = widget.style.font_family || fontFamilyFromUrl(fontUrl)

        return (
            <section className="w-full py-6">
                {fontUrl && /^https?:\/\//i.test(fontUrl) && (
                    <style>{`@import url('${fontUrl.replace(/'/g, '%27')}');`}</style>
                )}
                <div
                    className="whitespace-pre-line leading-6"
                    style={{
                        color: cssColor(widget.style?.text_color),
                        fontFamily,
                        fontSize: `${widget.style?.font_size ?? 14}px`,
                        textAlign: widget.style?.text_align ?? 'start',
                    }}
                >
                    {text}
                </div>
            </section>
        )
    }

    if (widget.type === 'sticker') {
        if (!src) return null
        const stickerSize = widget.style?.sticker_size ?? 160

        return (
            <section className={widget.settings.allow_overlap ? 'inline-flex items-center justify-center px-2 py-1' : 'w-full py-1'}>
                <img
                    src={src}
                    alt={widget.title}
                    className={widget.settings.allow_overlap ? 'h-auto max-w-none object-contain' : 'h-auto max-w-full object-contain'}
                    draggable={false}
                    style={stickerImageStyle(widget, stickerSize)}
                />
            </section>
        )
    }

    if (widget.type === 'image') {
        if (!src) return null
        const height = widget.style?.content_height

        return (
            <section className="w-full py-6">
                <img
                    src={src}
                    alt={widget.title}
                    className="w-full object-cover"
                    draggable={false}
                    style={{
                        height: height ? `${height}px` : undefined,
                        maxHeight: height ? undefined : 'none',
                        borderRadius: `${widget.style?.radius ?? 0}px`,
                    }}
                />
            </section>
        )
    }

    if (widget.type === 'spacer') {
        return <div />
    }

    if (widget.type === 'board') {
        const width = widget.style?.content_width ?? 960
        const height = widget.style?.content_height ?? 420

        return (
            <section className="w-full py-6">
                <div
                    className="relative mx-auto overflow-hidden"
                    style={{
                        width: `min(${width}px, 100%)`,
                        height: `${height}px`,
                        background: widget.style?.transparent
                            ? 'transparent'
                            : cssColor(widget.style?.background) ?? 'transparent',
                        border: widget.style?.border
                            ? `1px solid ${cssColor(widget.style?.border_color) ?? 'var(--border, #d4d4d8)'}`
                            : undefined,
                        borderRadius: `${widget.style?.radius ?? 0}px`,
                    }}
                >
                    {(widget.settings.board_items ?? []).map((item) => {
                        const itemStyle = item.style ?? {}
                        const itemImagePath =
                            item.type === 'sticker'
                                ? item.sticker_image_path || item.asset_path
                                : item.asset_path
                        const itemSrc = itemImagePath ? storageUrl(itemImagePath) : null
                        const transform = itemStyle.rotate ? `rotate(${itemStyle.rotate}deg)` : undefined

                        return (
                            <div
                                key={item.id}
                                className="absolute"
                                style={{
                                    left: `${item.x}%`,
                                    top: `${item.y}px`,
                                    width: `${item.w}%`,
                                    height: `${item.h}px`,
                                    background: itemStyle.transparent
                                        ? 'transparent'
                                        : cssColor(itemStyle.background) ?? 'transparent',
                                    border: itemStyle.border
                                        ? `1px solid ${cssColor(itemStyle.border_color) ?? 'var(--border, #d4d4d8)'}`
                                        : undefined,
                                    borderRadius: `${itemStyle.radius ?? 0}px`,
                                    padding: `${itemStyle.padding_block ?? itemStyle.padding ?? 0}px ${itemStyle.padding_inline ?? itemStyle.padding ?? 0}px`,
                                    boxSizing: 'border-box',
                                    overflow: 'hidden',
                                    transform,
                                    zIndex: itemStyle.z_index ?? 1,
                                }}
                            >
                                {item.type === 'text' ? (
                                    <div
                                        className="h-full w-full whitespace-pre-line break-words"
                                        style={{
                                            color: cssColor(itemStyle.text_color),
                                            fontFamily: itemStyle.font_family || fontFamilyFromUrl(item.font_url),
                                            fontSize: `${itemStyle.font_size ?? 16}px`,
                                            textAlign: itemStyle.text_align ?? 'start',
                                        }}
                                    >
                                        {item.text}
                                    </div>
                                ) : itemSrc ? (
                                    <img
                                        src={itemSrc}
                                        alt=""
                                        draggable={false}
                                        className="h-full w-full object-contain"
                                    />
                                ) : null}
                            </div>
                        )
                    })}
                </div>
            </section>
        )
    }

    return null
}

export function CustomPageWidget({ widget }: { widget: PageWidget }) {
    if (!widget.enabled) return null

    return <PageWidgetFrame widget={widget}><CustomPageWidgetContent widget={widget} /></PageWidgetFrame>
}

export function AnchoredCustomPageWidget({ widget }: { widget: PageWidget }) {
    if (!widget.enabled) return null

    return (
        <PageWidgetFrame widget={widget}>
            <CustomPageWidgetContent widget={widget} />
        </PageWidgetFrame>
    )
}
