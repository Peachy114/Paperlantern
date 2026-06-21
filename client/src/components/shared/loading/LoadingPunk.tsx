// components/LoadingPunk.tsx
import { useEffect, useState } from 'react'

const WORDS = ['SCRIBBLE!', 'DRAWING!', 'INKING!', 'CREATING!', 'ALMOST!']

export default function LoadingPunk() {
    const [idx, setIdx] = useState(0)

    useEffect(() => {
        const t = setInterval(() => setIdx((i) => (i + 1) % WORDS.length), 1000)
        return () => clearInterval(t)
    }, [])

    return (
        <>
            <link
                href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Kalam:wght@400;700&display=swap"
                rel="stylesheet"
            />
            <style>{`
        @keyframes floatUp {
          0%,100%{ transform:translateY(0) rotate(-2deg); }
          50%    { transform:translateY(-8px) rotate(2deg); }
        }
        @keyframes pencilWrite {
          0%,100%{ transform:translateX(0) rotate(-30deg); }
          50%    { transform:translateX(10px) rotate(-28deg); }
        }
        @keyframes blink {
          0%,90%,100%{ transform:scaleY(1); }
          95%        { transform:scaleY(0.1); }
        }
        @keyframes dotBounce {
          0%,100%{ transform:translateY(0); opacity:0.4; }
          50%    { transform:translateY(-5px); opacity:1; }
        }
        @keyframes sparkle {
          0%,100%{ opacity:0; transform:scale(0.5); }
          50%    { opacity:1; transform:scale(1); }
        }
        @keyframes wobbleSfx {
          0%,100%{ transform:rotate(-2deg) scale(1); }
          50%    { transform:rotate(2deg) scale(1.05); }
        }
        @keyframes paperFloat {
          0%,100%{ transform:translateY(0) rotate(-1deg); }
          50%    { transform:translateY(-6px) rotate(1deg); }
        }
      `}</style>

            <div className="flex flex-col items-center justify-center min-h-[60vh] relative overflow-hidden">
                {/* Halftone bg */}
                <div
                    className="absolute inset-0 opacity-[0.04] pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(circle,#1a1a1a 1px,transparent 1px)',
                        backgroundSize: '22px 22px',
                    }}
                />

                {/* SFX */}
                <div
                    className="relative z-10 mb-4 px-4 py-1 border-[3px] border-[#1a1a1a] bg-[#FAC775] text-[#1a1a1a]"
                    style={{
                        fontFamily: "'Bebas Neue',cursive",
                        fontSize: 26,
                        letterSpacing: '0.06em',
                        boxShadow: '4px 4px 0 #1a1a1a',
                        animation: 'wobbleSfx 0.8s ease-in-out infinite',
                    }}
                >
                    {WORDS[idx]}
                </div>

                {/* Scene */}
                <div
                    className="relative z-10 flex items-end gap-3 mb-5"
                    style={{ animation: 'floatUp 3s ease-in-out infinite' }}
                >
                    {/* Paper left */}
                    <div
                        className="relative bg-[#fffdf5] dark:bg-[#252320] border-[2.5px] border-[#1a1a1a] dark:border-[#5a5850] overflow-hidden"
                        style={{
                            width: 80,
                            height: 100,
                            boxShadow: '3px 3px 0 #1a1a1a',
                            animation: 'paperFloat 2.8s ease-in-out 0.3s infinite',
                        }}
                    >
                        {[60, 80, 50, 70, 40].map((w, i) => (
                            <div
                                key={i}
                                className="h-[1.5px] bg-[#d4cfc2] dark:bg-[#3a3830] mx-2 mt-[6px] first:mt-[14px]"
                                style={{ width: `${w}%` }}
                            />
                        ))}
                        <div
                            className="absolute bottom-0 right-0 w-0 h-0"
                            style={{
                                borderStyle: 'solid',
                                borderWidth: '0 0 18px 18px',
                                borderColor: 'transparent transparent #e8e4d9 transparent',
                            }}
                        />
                    </div>

                    {/* Character */}
                    <div className="flex flex-col items-center relative">
                        {/* Sparkles */}
                        {[
                            { t: '-18px', r: '-10px', d: '0s' },
                            { t: '-8px', r: '16px', d: '0.4s' },
                            { t: '-22px', r: '6px', d: '0.8s' },
                        ].map((s, i) => (
                            <span
                                key={i}
                                className="absolute text-[#FAC775] font-bold text-[11px]"
                                style={{
                                    top: s.t,
                                    right: s.r,
                                    fontFamily: "'Kalam',cursive",
                                    animation: `sparkle 1.2s ease-in-out ${s.d} infinite`,
                                }}
                            >
                                ✦
                            </span>
                        ))}
                        {/* Head */}
                        <div
                            className="w-[38px] h-[38px] bg-[#FAC775] border-[2.5px] border-[#1a1a1a] relative overflow-hidden"
                            style={{
                                borderRadius: '50% 50% 45% 45%',
                                boxShadow: '2px 2px 0 #1a1a1a',
                            }}
                        >
                            <div
                                className="absolute flex gap-2"
                                style={{ top: 13, left: '50%', transform: 'translateX(-50%)' }}
                            >
                                <div
                                    className="w-[5px] h-[6px] bg-[#1a1a1a] rounded-full"
                                    style={{ animation: 'blink 3s ease-in-out infinite' }}
                                />
                                <div
                                    className="w-[5px] h-[6px] bg-[#1a1a1a] rounded-full"
                                    style={{ animation: 'blink 3s ease-in-out infinite' }}
                                />
                            </div>
                            <div
                                className="absolute w-[7px] h-[4px] bg-[#f09595] rounded-full opacity-60"
                                style={{ bottom: 9, left: 5 }}
                            />
                            <div
                                className="absolute w-[7px] h-[4px] bg-[#f09595] rounded-full opacity-60"
                                style={{ bottom: 9, right: 5 }}
                            />
                        </div>
                        {/* Body */}
                        <div
                            className="w-[32px] h-[30px] bg-[#86efac] border-[2.5px] border-t-0 border-[#1a1a1a] relative"
                            style={{ borderRadius: '0 0 8px 8px', boxShadow: '2px 2px 0 #1a1a1a' }}
                        >
                            {/* Pencil arm */}
                            <div
                                className="absolute flex items-center"
                                style={{
                                    right: -28,
                                    top: -4,
                                    animation: 'pencilWrite 0.8s ease-in-out infinite',
                                    transformOrigin: 'left center',
                                }}
                            >
                                <div className="w-[5px] h-[6px] bg-[#f09595] border-2 border-[#1a1a1a]" />
                                <div className="w-[22px] h-[8px] bg-[#FAC775] border-2 border-[#1a1a1a]" />
                            </div>
                        </div>
                    </div>

                    {/* Paper right */}
                    <div
                        className="relative bg-[#fffdf5] dark:bg-[#252320] border-[2.5px] border-[#1a1a1a] dark:border-[#5a5850] overflow-hidden"
                        style={{
                            width: 80,
                            height: 100,
                            boxShadow: '3px 3px 0 #1a1a1a',
                            animation: 'paperFloat 2.4s ease-in-out 0.6s infinite',
                        }}
                    >
                        {[60, 80, 50].map((w, i) => (
                            <div
                                key={i}
                                className="h-[1.5px] bg-[#d4cfc2] dark:bg-[#3a3830] mx-2 mt-[6px] first:mt-[14px]"
                                style={{ width: `${w}%` }}
                            />
                        ))}
                        <div
                            className="absolute bottom-0 right-0 w-0 h-0"
                            style={{
                                borderStyle: 'solid',
                                borderWidth: '0 0 18px 18px',
                                borderColor: 'transparent transparent #e8e4d9 transparent',
                            }}
                        />
                    </div>
                </div>

                {/* Bubble */}
                <div
                    className="relative z-10 bg-[#fffdf5] dark:bg-[#252320] border-[2.5px] border-[#1a1a1a] dark:border-[#e8e4d9] px-4 py-1.5 rounded-2xl"
                    style={{
                        fontFamily: "'Kalam',cursive",
                        fontSize: 13,
                        fontWeight: 700,
                        boxShadow: '3px 3px 0 #1a1a1a',
                    }}
                >
                    working on your studio
                    {[0, 0.15, 0.3].map((d, i) => (
                        <span
                            key={i}
                            style={{
                                display: 'inline-block',
                                animation: `dotBounce 0.9s ease-in-out ${d}s infinite`,
                            }}
                        >
                            .
                        </span>
                    ))}
                </div>
            </div>
        </>
    )
}
