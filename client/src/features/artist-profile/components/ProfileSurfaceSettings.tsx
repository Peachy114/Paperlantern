import { Label } from '@/components/ui/label'
import { WIDGET_BACKGROUND_OPTIONS } from '@/features/page-builder/widgetBackgroundPresets'
import { ColorField, ProfileEditSection } from '@/features/artist-profile/components/ProfileEditorFields'
import { ProfileRangeField as RangeField } from '@/features/artist-profile/components/ProfileFormPrimitives'
import type { ProfileSurfaceStyle } from '@/features/artist-profile/types/profileTheme'

export function ProfileSurfaceSettings({ label, value, onChange }: { label: string; value?: ProfileSurfaceStyle; onChange: (value: ProfileSurfaceStyle) => void }) {
    const style = value ?? {}
    const patch = (next: Partial<ProfileSurfaceStyle>) => onChange({ ...style, ...next })
    return <ProfileEditSection title={label} defaultOpen={false}>
        <label className="flex items-center justify-between gap-3 text-sm"><span>Use background</span><input type="checkbox" checked={style.enabled !== false} onChange={(event) => patch({ enabled: event.target.checked })} /></label>
        {style.enabled !== false && <>
            <div className="grid gap-1.5"><Label>Background style</Label><select className="h-10 rounded-md border bg-background px-3 text-sm" value={style.preset ?? 'default'} onChange={(event) => patch({ preset: event.target.value as ProfileSurfaceStyle['preset'] })}>{WIDGET_BACKGROUND_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
            {style.preset === 'custom' && <ColorField label="Custom color" value={style.custom_color ?? '#ffffff'} fallback="#ffffff" onChange={(custom_color) => patch({ custom_color })} />}
            <RangeField label="Background opacity" value={style.opacity ?? 100} min={0} max={100} suffix="%" onChange={(opacity) => patch({ opacity })} />
        </>}
        <label className="flex items-center justify-between gap-3 border-t pt-3 text-sm"><span>Show border</span><input type="checkbox" checked={Boolean(style.border)} onChange={(event) => patch({ border: event.target.checked })} /></label>
        {style.border && <>
            <ColorField label="Border color" value={style.border_color ?? '#d4d4d8'} fallback="#d4d4d8" onChange={(border_color) => patch({ border_color })} />
            <RangeField label="Border opacity" value={style.border_opacity ?? 100} min={0} max={100} suffix="%" onChange={(border_opacity) => patch({ border_opacity })} />
            <RangeField label="Border width" value={style.border_width ?? 1} min={0} max={12} suffix="px" onChange={(border_width) => patch({ border_width })} />
            <RangeField label="Border radius" value={style.border_radius ?? 8} min={0} max={80} suffix="px" onChange={(border_radius) => patch({ border_radius })} />
        </>}
    </ProfileEditSection>
}
