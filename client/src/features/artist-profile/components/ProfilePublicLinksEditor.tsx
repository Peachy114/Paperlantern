import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProfileEditSection } from '@/features/artist-profile/components/ProfileEditorFields'
import { ProfileFieldMessage as FieldMessage } from '@/features/artist-profile/components/ProfileFormPrimitives'
import type {
    ProfileEditErrors,
    ProfileLinkDraft,
    ProfileThemeDraft,
} from '@/features/artist-profile/types/profileEditor'

// Public profile link list editor ----
export function ProfilePublicLinksEditor({
    draft,
    errors,
    onChange,
}: {
    draft: ProfileThemeDraft
    errors: ProfileEditErrors
    onChange: (patch: Partial<ProfileThemeDraft>) => void
}) {
    const updateLink = (index: number, patch: Partial<ProfileLinkDraft>) => {
        onChange({
            links: draft.links.map((link, linkIndex) =>
                linkIndex === index ? { ...link, ...patch } : link
            ),
        })
    }

    const addLink = () => {
        onChange({
            links: [
                ...draft.links,
                {
                    id: `draft-${Date.now()}`,
                    title: '',
                    url: '',
                    image_path: null,
                    imageFile: null,
                    imagePreview: null,
                    is_public: true,
                },
            ],
        })
    }

    const removeLink = (index: number) => {
        onChange({ links: draft.links.filter((_, linkIndex) => linkIndex !== index) })
    }

    return (
        <ProfileEditSection title="Public Links">
            {errors.links && <FieldMessage>{errors.links}</FieldMessage>}
            <div className="grid gap-3">
                {draft.links.map((link, index) => (
                    <div key={link.id} className="grid gap-2 rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-2">
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                <input
                                    type="checkbox"
                                    checked={link.is_public}
                                    onChange={(event) =>
                                        updateLink(index, { is_public: event.target.checked })
                                    }
                                />
                                Public
                            </label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => removeLink(index)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor={`profile-link-title-${index}`}>Title</Label>
                            {errors[`links.${index}.title`] && (
                                <FieldMessage>{errors[`links.${index}.title`]}</FieldMessage>
                            )}
                            <Input
                                id={`profile-link-title-${index}`}
                                value={link.title}
                                onChange={(event) =>
                                    updateLink(index, { title: event.target.value })
                                }
                            />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor={`profile-link-url-${index}`}>Link</Label>
                            {errors[`links.${index}.url`] && (
                                <FieldMessage>{errors[`links.${index}.url`]}</FieldMessage>
                            )}
                            <Input
                                id={`profile-link-url-${index}`}
                                value={link.url}
                                placeholder="example.com, https://example.com, mailto:hello@example.com"
                                onChange={(event) =>
                                    updateLink(index, { url: event.target.value })
                                }
                            />
                        </div>
                    </div>
                ))}
            </div>
            <Button type="button" variant="outline" onClick={addLink}>
                <Plus className="h-4 w-4" />
                Add Link
            </Button>
        </ProfileEditSection>
    )
}
