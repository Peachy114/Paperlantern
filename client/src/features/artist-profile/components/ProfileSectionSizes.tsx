import { ProfileEditSection } from '@/features/artist-profile/components/ProfileEditorFields'
import { ProfileRangeField as RangeField } from '@/features/artist-profile/components/ProfileFormPrimitives'
import type { ProfileThemeDraft } from '@/features/artist-profile/types/profileEditor'

// Profile canvas board and content tile size editor ----
export function ProfileSectionSizes({
    draft,
    onChange,
}: {
    draft: ProfileThemeDraft
    onChange: (patch: Partial<ProfileThemeDraft>) => void
}) {
    return (
        <ProfileEditSection title="Sections">
            <RangeField
                label="Board height"
                value={draft.boardMinHeight}
                min={360}
                max={2400}
                suffix="px"
                onChange={(boardMinHeight) => onChange({ boardMinHeight })}
            />
            <RangeField
                label="Art tile width"
                value={draft.artsTileWidth}
                min={120}
                max={420}
                suffix="px"
                onChange={(artsTileWidth) => onChange({ artsTileWidth })}
            />
            <RangeField
                label="Sticker size"
                value={draft.stickerSize}
                min={72}
                max={180}
                suffix="px"
                onChange={(stickerSize) => onChange({ stickerSize })}
            />
        </ProfileEditSection>
    )
}
