import { useEffect, useState } from 'react'

const SFX_WORDS = ['LOADING!', 'WAIT...', 'ALMOST!', 'HANG ON!', 'INCOMING!']

export default function Loading() {
    const [sfxIndex, setSfxIndex] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setSfxIndex((i) => (i + 1) % SFX_WORDS.length)
        }, 900)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] relative overflow-hidden font-bangers">
            {/* Halftone bg */}
            <div
                className="absolute inset-0 opacity-[0.15]"
                style={{
                    backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                    backgroundSize: '18px 18px',
                }}
            />

            {/* Speech bubble */}
            <div
                className="relative z-10 border-[2.5px] border-[#1a1a1a] dark:border-white bg-[#fffdf5] dark:bg-[#1c1a17] px-5 py-2 mb-6 rounded-xl"
                style={{
                    boxShadow: '3px 3px 0 #1a1a1a',
                    fontSize: '15px',
                    letterSpacing: '0.08em',
                    color: 'inherit',
                }}
            >
                Hold on, loading your story...
            </div>

            {/* Panels */}
            <div className="flex gap-2.5 items-end mb-6 z-10">
                {[
                    { w: 90, h: 110, color: '#FAC775', delay: '0s' },
                    { w: 120, h: 140, color: '#85B7EB', delay: '0.15s' },
                    { w: 80, h: 100, color: '#5DCAA5', delay: '0.3s' },
                    { w: 110, h: 130, color: '#F09595', delay: '0.45s' },
                ].map((p, i) => (
                    <div
                        key={i}
                        className="border-[3px] border-[#1a1a1a] dark:border-white relative overflow-hidden"
                        style={{
                            width: p.w,
                            height: p.h,
                            animation: `panelPop 0.5s cubic-bezier(0.36,0.07,0.19,0.97) ${p.delay} both`,
                        }}
                    >
                        <div
                            className="absolute inset-0 panel-fill"
                            style={{
                                background: p.color,
                                animation: `fillSweep 1.4s ease-in-out ${p.delay} infinite`,
                            }}
                        />
                        <div
                            className="absolute inset-0"
                            style={{
                                backgroundImage:
                                    'repeating-linear-gradient(0deg,transparent,transparent 6px,rgba(0,0,0,0.06) 6px,rgba(0,0,0,0.06) 7px)',
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* SFX */}
            <div
                className="z-10 border-[3px] border-[#1a1a1a] dark:border-white bg-[#fffdf5] dark:bg-[#1c1a17] px-5 py-1"
                style={{
                    fontSize: '32px',
                    letterSpacing: '0.05em',
                    boxShadow: '4px 4px 0 #1a1a1a',
                    animation: 'sfxWobble 0.6s ease-in-out infinite alternate',
                }}
            >
                {SFX_WORDS[sfxIndex]}
            </div>
        </div>
    )
}
