import { COLORS } from '../../hooks/useAddSticky'

interface Props {
    text: string
    onTextChange: (text: string) => void
    color: string
    onColorChange: (color: string) => void
}

export default function AddStickyTextTab({ text, onTextChange, color, onColorChange }: Props) {
    return (
        <>
            {/* Live preview */}
            <div className="flex justify-center mb-4">
                <div
                    className="px-4 py-3 w-40 min-h-[80px] text-[12px] leading-snug relative whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
                    style={{
                        background: color,
                        fontFamily: "'Kalam', cursive",
                        color: '#1a1a1a',
                        transform: 'rotate(-1.5deg)',
                        boxShadow: '3px 3px 0 rgba(0,0,0,0.18)',
                    }}
                >
                    <div
                        className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-10 h-5 opacity-50"
                        style={{
                            background: 'rgba(255,255,255,0.6)',
                            border: '1px solid rgba(0,0,0,0.08)',
                        }}
                    />
                    {text || <span className="opacity-30">your note...</span>}
                </div>
            </div>

            {/* Text input */}
            <textarea
                value={text}
                onChange={(e) => onTextChange(e.target.value)}
                maxLength={80}
                rows={3}
                placeholder="write your note..."
                className="w-full px-3 py-2 text-[12px] border-[2px] border-[#1a1a1a]/20 dark:border-foreground/20 bg-transparent text-foreground placeholder:text-foreground/30 outline-none resize-none focus:border-amber-400 transition-colors"
                style={{ fontFamily: "'Kalam', cursive" }}
            />
            <div
                className="text-right text-[10px] text-foreground/30 mb-3"
                style={{ fontFamily: "'Kalam', cursive" }}
            >
                {text.length}/80
            </div>

            {/* Color picker */}
            <div className="mb-4">
                <p
                    className="text-[10px] tracking-[0.12em] text-foreground/40 mb-2"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                    PICK A COLOR
                </p>
                <div className="flex gap-2 flex-wrap">
                    {COLORS.map((c) => (
                        <button
                            key={c}
                            onClick={() => onColorChange(c)}
                            className="w-7 h-7 border-[2px] transition-transform cursor-pointer hover:scale-110"
                            style={{
                                background: c,
                                borderColor: color === c ? '#1a1a1a' : 'transparent',
                                boxShadow: color === c ? '2px 2px 0 #1a1a1a' : 'none',
                            }}
                        />
                    ))}
                </div>
            </div>
        </>
    )
}
