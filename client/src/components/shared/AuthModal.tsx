import { useModalStore } from '@/store/modalStore'
import LoginForm from '@/features/auth/pages/LoginForm'
import RegisterForm from '@/features/auth/pages/RegisterForm'

export default function AuthModal() {
    const { isOpen, view, openLogin, openRegister, close } = useModalStore()

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md overflow-hidden border-[2.5px] border-[#1a1a1a] bg-[#fffdf5]"
                style={{ boxShadow: '6px 6px 0 #1a1a1a' }}
            >
                {/* Rainbow top stripe */}
                <div
                    className="absolute top-0 left-0 right-0 h-[3px] pointer-events-none z-10"
                    style={{
                        background:
                            'linear-gradient(90deg,#f59e0b 0%,#ec4899 30%,#f59e0b 60%,#14b8a6 100%)',
                    }}
                />

                {/* Halftone bg */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-60"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle,rgba(0,0,0,0.05) 1px,transparent 1px)',
                        backgroundSize: '8px 8px',
                    }}
                />

                {/* Sticky note */}
                <div
                    className="absolute z-20 px-[10px] py-[4px]"
                    style={{
                        top: '14px',
                        right: '52px',
                        background: view === 'login' ? '#fce7f3' : '#fef3c7',
                        border: `1.5px solid ${view === 'login' ? '#ec4899' : '#f59e0b'}`,
                        boxShadow: `2px 2px 0 ${view === 'login' ? '#ec4899' : '#f59e0b'}`,
                        transform: view === 'login' ? 'rotate(-2deg)' : 'rotate(1.5deg)',
                        transition: 'all 0.2s',
                    }}
                >
                    <span
                        className="tracking-[0.15em]"
                        style={{
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: '11px',
                            color: view === 'login' ? '#be185d' : '#92400e',
                        }}
                    >
                        {view === 'login' ? '♥ FREE TO READ' : '✦ JOIN FREE'}
                    </span>
                </div>

                {/* Header */}
                <div className="relative z-10 px-6 pt-6">
                    {/* Logo + Close */}
                    <div className="flex items-center justify-between mb-4">
                        <div
                            className="flex items-center gap-1.5 px-[10px] py-[4px] bg-amber-400 border-2 border-[#1a1a1a]"
                            style={{ boxShadow: '2px 2px 0 #1a1a1a' }}
                        >
                            <span className="w-[7px] h-[7px] rounded-full bg-pink-400 border-[1.5px] border-[#1a1a1a] shrink-0" />
                            <span
                                className="text-[16px] tracking-[0.06em] text-[#1a1a1a] leading-none"
                                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                            >
                                LATER N COMIX
                            </span>
                        </div>

                        <button
                            onClick={close}
                            className="w-7 h-7 flex items-center justify-center border-2 border-[#1a1a1a] bg-transparent text-[#1a1a1a] text-xs font-black cursor-pointer hover:bg-[#1a1a1a] hover:text-white transition-colors duration-100"
                            style={{ boxShadow: '2px 2px 0 #1a1a1a' }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Title box */}
                    <div
                        className="border-2 border-[#1a1a1a] px-3 py-2.5 mb-4 bg-[#fff8e7]"
                        style={{ boxShadow: '3px 3px 0 #1a1a1a' }}
                    >
                        <div
                            className="text-[26px] tracking-[0.04em] text-[#1a1a1a] leading-none"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            {view === 'login' ? 'WELCOME BACK!' : 'JOIN THE STORY.'}
                        </div>
                        <div className="text-[12px] text-[#6b7280] font-semibold mt-0.5 tracking-[0.04em]">
                            {view === 'login'
                                ? 'LOG IN TO CONTINUE READING.'
                                : 'CREATE YOUR ACCOUNT AND START EXPLORING.'}
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="relative z-10 px-6 pb-6">
                    {view === 'login' ? <LoginForm /> : <RegisterForm />}

                    {/* Switch link */}
                    <div className="flex items-center justify-center gap-1.5 mt-2.5">
                        <span
                            className="text-[10px] tracking-[0.12em] text-[#9ca3af]"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            {view === 'login' ? 'NEW READER?' : 'ALREADY A READER?'}
                        </span>
                        <button
                            onClick={view === 'login' ? openRegister : openLogin}
                            className="text-[10px] tracking-[0.12em] text-pink-500 underline cursor-pointer bg-transparent border-none"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            {view === 'login' ? 'JOIN THE STORY ♥' : 'LOG IN ♥'}
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t-2 border-[#1a1a1a] mt-5 pt-2.5">
                        <span
                            className="text-[10px] tracking-[0.18em] text-[#9ca3af]"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            LATER N COMIX PUBLISHING
                        </span>
                        <span
                            className="text-[10px] tracking-[0.18em] text-pink-400"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            ♥ VOL. 01
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
