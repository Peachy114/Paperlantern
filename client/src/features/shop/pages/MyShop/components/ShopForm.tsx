import ReactCrop from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { PackagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { storageUrl } from '@/utils/storage'
import type { UseMyShopReturn } from '../hooks/useMyShop'
import type { ShopFormState } from '../types'
import { SelectField, FileInput } from './ShopFormFields'

export function ShopForm({ shop }: { shop: UseMyShopReturn }) {
    const { form, setForm, errors, editing, preview } = shop

    return (
        <>
            <form
                onSubmit={shop.submit}
                className="rounded-lg border bg-background p-4 shadow-sm"
            >
                <div className="mb-4 flex items-center gap-2">
                    <PackagePlus className="h-5 w-5" />
                    <h2 className="font-semibold">
                        {editing ? 'Edit shop item' : 'Add shop item'}
                    </h2>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="grid gap-3">
                        <div>
                            <Label>Product name</Label>
                            <Input
                                value={form.title}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        title: event.target.value,
                                    }))
                                }
                                required
                            />
                            {errors.title ? (
                                <p className="mt-1 text-xs text-rose-500">{errors.title}</p>
                            ) : null}
                        </div>
                        <div>
                            <Label>Description</Label>
                            <textarea
                                value={form.description}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        description: event.target.value,
                                    }))
                                }
                                className="mt-1 min-h-24 w-full rounded-md border bg-background p-3 text-sm"
                            />
                            {errors.description ? (
                                <p className="mt-1 text-xs text-rose-500">{errors.description}</p>
                            ) : null}
                        </div>
                        <div>
                            <Label>Labels</Label>
                            <Input
                                value={form.labels}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        labels: event.target.value,
                                    }))
                                }
                                placeholder="adoptable, base, brush, chibi"
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                                Up to 12 labels, separated by commas.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-3">
                        <div className="grid grid-cols-2 gap-3">
                            <SelectField
                                label="Type"
                                value={form.type}
                                values={['download', 'adoptable', 'sticker']}
                                onChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        type: value as ShopFormState['type'],
                                    }))
                                }
                            />
                            <SelectField
                                label="Status"
                                value={form.status}
                                values={['draft', 'published', 'archived']}
                                onChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        status: value as ShopFormState['status'],
                                    }))
                                }
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <SelectField
                                label="Download"
                                value={form.download_policy}
                                values={['paid', 'free']}
                                onChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        download_policy: value as ShopFormState['download_policy'],
                                    }))
                                }
                            />
                            <div>
                                <Label>Credit cost</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={form.credit_cost}
                                    disabled={form.download_policy === 'free'}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            credit_cost: event.target.value,
                                        }))
                                    }
                                />
                                {errors.credit_cost ? (
                                    <p className="mt-1 text-xs text-rose-500">
                                        {errors.credit_cost}
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        <div className="rounded-lg border p-3">
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Sticker usage
                            </p>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                                {(['comments', 'profile', 'backgrounds', 'messages'] as const).map(
                                    (key) => (
                                        <label key={key} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={form.usage[key]}
                                                onChange={(event) =>
                                                    setForm((current) => ({
                                                        ...current,
                                                        usage: {
                                                            ...current.usage,
                                                            [key]: event.target.checked,
                                                        },
                                                    }))
                                                }
                                            />
                                            {key}
                                        </label>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <FileInput
                        label="Preview image / GIF"
                        accept="image/*"
                        onChange={shop.handleImageChange}
                    />
                    <FileInput
                        label="Download files"
                        multiple
                        onChange={shop.handleFilesChange}
                    />
                </div>

                {form.files.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {form.files.map((entry) => (
                            <li key={entry.id} className="flex items-center justify-between">
                                <span>{entry.file.name}</span>
                                <button
                                    type="button"
                                    onClick={() => shop.removeFileEntry(entry.id)}
                                    className="text-rose-500 hover:underline"
                                >
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : null}

                {(preview || editing?.image_path) && (
                    <div className="mt-4 h-36 w-36 overflow-hidden rounded-lg border bg-muted">
                        <img
                            src={preview ?? storageUrl(editing?.image_path ?? null) ?? ''}
                            alt="Preview"
                            className="h-full w-full object-cover"
                        />
                    </div>
                )}

                <div className="mt-4 flex gap-2">
                    <Button type="submit" disabled={shop.saveMutation.isPending}>
                        {shop.saveMutation.isPending
                            ? 'Saving...'
                            : editing
                              ? 'Save changes'
                              : 'Create item'}
                    </Button>
                    {editing && (
                        <Button type="button" variant="outline" onClick={shop.cancelForm}>
                            Cancel
                        </Button>
                    )}
                </div>
            </form>

            {shop.cropDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="max-w-lg rounded-lg bg-background p-4 shadow-xl">
                        <ReactCrop
                            crop={shop.crop}
                            onChange={(_, percentCrop) => shop.setCrop(percentCrop)}
                            onComplete={(c) => shop.setCompletedCrop(c)}
                            aspect={1}
                        >
                            <img
                                ref={shop.imgRef}
                                src={shop.imgSrc}
                                alt="Crop preview"
                                onLoad={shop.onImageLoad}
                            />
                        </ReactCrop>

                        <div className="mt-4 flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={shop.cancelCrop}>
                                Cancel
                            </Button>
                            <Button type="button" onClick={shop.confirmCrop}>
                                Apply crop
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}