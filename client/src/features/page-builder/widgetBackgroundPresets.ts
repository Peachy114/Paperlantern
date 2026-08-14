import type { CSSProperties } from 'react'
import type { PageWidgetBackgroundPreset, PageWidgetStyle } from '@/types/pageLayout'

export const WIDGET_BACKGROUND_OPTIONS: Array<{ value: PageWidgetBackgroundPreset; label: string }> = [
    { value: 'default', label: 'Default (current widget background)' },
    { value: 'transparent', label: 'Transparent' },
    { value: 'white', label: 'White' },
    { value: 'surface', label: 'Standard surface' },
    { value: 'muted', label: 'Soft muted' },
    { value: 'brand_gradient', label: 'Brand gradient (blue, white, yellow)' },
    { value: 'brand_gradient_soft', label: 'Soft brand gradient' },
    { value: 'blue_gradient', label: 'Blue gradient' },
    { value: 'yellow_gradient', label: 'Yellow gradient' },
    { value: 'dark', label: 'Dark surface' },
    { value: 'custom', label: 'Custom color' },
]

export function widgetBackgroundStyle(style?: PageWidgetStyle): CSSProperties {
    const preset = style?.background_preset ?? 'default'
    if (preset === 'default') return {}
    if (preset === 'transparent') return { background: 'transparent' }
    if (preset === 'white') return { background: 'var(--white)' }
    if (preset === 'surface') return { background: 'var(--surface)' }
    if (preset === 'muted') return { background: 'var(--surface-muted)' }
    if (preset === 'brand_gradient') return { background: 'var(--gradient-brand)' }
    if (preset === 'brand_gradient_soft') return { background: 'var(--gradient-brand-soft)' }
    if (preset === 'blue_gradient') return { background: 'linear-gradient(135deg, var(--blue-soft), var(--surface) 68%, var(--blue))' }
    if (preset === 'yellow_gradient') return { background: 'linear-gradient(135deg, var(--category), var(--surface) 72%, var(--selected-soft))' }
    if (preset === 'dark') return { background: 'var(--surface-inverse)', color: 'var(--background)' }
    if (preset === 'custom') return { background: style?.background || 'var(--surface)' }
    return {}
}
