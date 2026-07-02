import { type RefObject } from 'react'

interface Props {
    imageMode: 'photo' | 'sticker'
    onImageModeChange: (mode: 'photo' | 'sticker') => void
    imageCount: number
    preview: string | null
    fileRef: RefObject<HTMLInputElement | null>
    onFile: (e: React.ChangeEvent<HTMLInputElement>) => void
    onRemove: () => void
}

export default function AddStickyImageTab({
    imageMode,
    onImageModeChange,
    imageCount,
    preview,
    fileRef,
    onFile,
    onRemove,
}: Props) {
    return (
        <>
            {/* Photo vs Sticker toggle */}
            <div className="flex border-[2px] border-[#1a1a1a]/20 dark:border-foreground/20 mb-4">
                <button
                    onClick={() => onImageModeChange('photo')}
                    className={`flex-1 py-1.5 text-xsmall tracking-[0.1em] transition-colors cursor-pointer ${
                        imageMode === 'photo'
                            ? 'bg-[#1a1a1a] text-white dark:bg-foreground dark:text-background'
                            : 'text-foreground/50 hover:text-foreground'
                    }`}
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                    🖼️ PHOTO
                </button>
                <button
                    onClick={() => onImageModeChange('sticker')}
                    className={`flex-1 py-1.5 text-xsmall tracking-[0.1em] transition-colors cursor-pointer ${
                        imageMode === 'sticker'
                            ? 'bg-[#1a1a1a] text-white dark:bg-foreground dark:text-background'
                            : 'text-foreground/50 hover:text-foreground'
                    }`}
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                    ✨ STICKER
                </button>
            </div>

            <p
                className="text-xsmall text-foreground/40 mb-3"
                style={{ fontFamily: "'Kalam', cursive" }}
            >
                {imageMode === 'photo'
                    ? 'shows with white background'
                    : 'transparent background (use PNG)'}
            </p>

            {imageCount >= 3 ? (
                <div className="border-[2px] border-dashed border-red-300 flex flex-col items-center justify-center py-8 mb-4">
                    <span className="text-2xl mb-2">🚫</span>
                    <p
                        className="text-xsmall text-red-400"
                        style={{ fontFamily: "'Kalam', cursive" }}
                    >
                        max 3 stickers reached
                    </p>
                    <p
                        className="text-xsmall text-foreground/30 mt-1"
                        style={{ fontFamily: "'Kalam', cursive" }}
                    >
                        remove one to add more
                    </p>
                </div>
            ) : (
                <>
                    <div
                        onClick={() => fileRef.current?.click()}
                        className="border-[2px] border-dashed border-[#1a1a1a]/30 dark:border-foreground/20 flex flex-col items-center justify-center py-8 mb-4 cursor-pointer hover:border-amber-400 transition-colors"
                        style={{ background: imageMode === 'photo' ? '#f9f9f9' : 'transparent' }}
                    >
                        {preview ? (
                            <img
                                src={preview}
                                alt="preview"
                                className="max-h-32 max-w-full object-contain"
                                style={{
                                    background: imageMode === 'photo' ? 'white' : 'transparent',
                                }}
                            />
                        ) : (
                            <>
                                <span className="text-3xl mb-2">
                                    {imageMode === 'photo' ? '🖼️' : '✨'}
                                </span>
                                <p
                                    className="text-xsmall text-foreground/40"
                                    style={{ fontFamily: "'Kalam', cursive" }}
                                >
                                    click to upload{' '}
                                    {imageMode === 'photo' ? 'image' : 'sticker (PNG)'}
                                </p>
                                <p
                                    className="text-xsmall text-foreground/25 mt-1"
                                    style={{ fontFamily: "'Kalam', cursive" }}
                                >
                                    {imageCount}/3 used
                                </p>
                            </>
                        )}
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={onFile}
                        />
                    </div>
                    {preview && (
                        <button
                            onClick={onRemove}
                            className="text-xsmall text-foreground/40 hover:text-foreground mb-4 underline cursor-pointer"
                            style={{ fontFamily: "'Kalam', cursive" }}
                        >
                            remove image
                        </button>
                    )}
                </>
            )}
        </>
    )
}
