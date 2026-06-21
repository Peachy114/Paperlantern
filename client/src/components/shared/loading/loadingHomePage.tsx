// components/LoadingHomePage.tsx
import { useEffect, useState } from 'react'

const WORDS = ['LOADING!', 'WAIT...', 'ALMOST!', 'HANG ON!', 'INCOMING!']

export default function LoadingHomePage() {
    const [idx, setIdx] = useState(0)

    useEffect(() => {
        const t = setInterval(() => setIdx((i) => (i + 1) % WORDS.length), 900)
        return () => clearInterval(t)
    }, [])

    return (
        <>
            <link
                href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap"
                rel="stylesheet"
            />
            <style>{`
        @keyframes pop {
          0%  { opacity:0; transform:scale(0.6) rotate(-6deg); }
          70% { transform:scale(1.1) rotate(2deg); }
          100%{ opacity:1; transform:scale(1) rotate(0deg); }
        }
        @keyframes wobble {
          0%,100%{ transform:rotate(-2deg) scale(1); }
          50%    { transform:rotate(2deg) scale(1.07); }
        }
        @keyframes pageFlip {
          0%,10%  { transform:rotateY(0deg);    opacity:1; }
          45%,55% { transform:rotateY(-160deg); opacity:0.7; }
          90%,100%{ transform:rotateY(0deg);    opacity:1; }
        }
        @keyframes dotdot {
          0%,100%{ opacity:0.2; transform:translateY(0); }
          50%    { opacity:1;   transform:translateY(-4px); }
        }
        .pl-page-lines {
          position:absolute; inset:0;
          background-image:repeating-linear-gradient(
            0deg,transparent,transparent 9px,
            rgba(0,0,0,0.07) 9px,rgba(0,0,0,0.07) 10px
          );
        }
      `}</style>

            <div className="flex flex-col items-center justify-center min-h-[60vh] relative overflow-hidden">
                {/* Halftone bg */}
                <div
                    className="absolute inset-0 opacity-[0.05]"
                    style={{
                        backgroundImage: 'radial-gradient(circle,#1a1a1a 1px,transparent 1px)',
                        backgroundSize: '20px 20px',
                    }}
                />

                {/* Speed lines */}
                <svg
                    className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none"
                    viewBox="0 0 400 400"
                >
                    <g transform="translate(200,200)">
                        {Array.from({ length: 18 }).map((_, i) => (
                            <line
                                key={i}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="-190"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                transform={`rotate(${i * 20})`}
                            />
                        ))}
                    </g>
                </svg>

                {/* SFX badge */}
                <div
                    className="relative z-10 mb-5 px-4 py-1 border-[3px] border-[#1a1a1a] dark:border-[#e8e4d9] bg-[#FAC775] text-[#1a1a1a]"
                    style={{
                        fontFamily: "'Bebas Neue',cursive",
                        fontSize: 28,
                        letterSpacing: '0.06em',
                        boxShadow: '4px 4px 0 #1a1a1a',
                        animation: 'wobble 0.7s ease-in-out infinite',
                    }}
                >
                    {WORDS[idx]}
                </div>

                {/* Book */}
                <div
                    className="relative z-10 mb-5"
                    style={{
                        width: 90,
                        height: 118,
                        animation: 'pop 0.5s cubic-bezier(0.36,0.07,0.19,0.97) 0.1s both',
                    }}
                >
                    {/* Left page */}
                    <div
                        className="absolute left-0 top-0 bg-[#fffdf5] dark:bg-[#1c1a17] border-[3px] border-r-0 border-[#1a1a1a] dark:border-[#5a5850] overflow-hidden"
                        style={{ width: 44, height: 118 }}
                    >
                        <div className="pl-page-lines" />
                    </div>
                    {/* Right page */}
                    <div
                        className="absolute right-0 top-0 bg-[#fffdf5] dark:bg-[#1c1a17] border-[3px] border-l-[1.5px] border-[#1a1a1a] dark:border-[#5a5850] overflow-hidden"
                        style={{ width: 44, height: 118 }}
                    >
                        <div className="pl-page-lines" />
                    </div>
                    {/* Flipping page */}
                    <div
                        className="absolute right-0 top-0 bg-[#f0ede3] dark:bg-[#252320] border-[3px] border-l-0 border-[#1a1a1a] dark:border-[#5a5850] overflow-hidden z-[1]"
                        style={{
                            width: 44,
                            height: 118,
                            transformOrigin: 'left center',
                            animation: 'pageFlip 1.8s ease-in-out infinite',
                        }}
                    >
                        <div className="pl-page-lines" />
                    </div>
                    {/* Spine */}
                    <div
                        className="absolute top-0 bg-[#1a1a1a] dark:bg-[#5a5850] z-[2]"
                        style={{
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 6,
                            height: 118,
                        }}
                    />
                </div>

                {/* Speech bubble */}
                <div
                    className="relative z-10 bg-[#fffdf5] dark:bg-[#1c1a17] border-[2.5px] border-[#1a1a1a] dark:border-[#e8e4d9] rounded-[14px] px-5 py-1.5"
                    style={{
                        fontFamily: "'Bebas Neue',cursive",
                        fontSize: 14,
                        letterSpacing: '0.1em',
                        boxShadow: '3px 3px 0 #1a1a1a',
                        animation: 'pop 0.5s ease 0.6s both',
                    }}
                >
                    LOADING
                    {[0, 0.15, 0.3].map((d, i) => (
                        <span
                            key={i}
                            style={{
                                display: 'inline-block',
                                animation: `dotdot 0.9s ease-in-out ${d}s infinite`,
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
