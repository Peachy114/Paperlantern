// components/ui/UnlockModal.tsx
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

interface Props {
    open: boolean
    onClose: () => void
    onConfirm: () => void
    chapterTitle: string
    creditsRequired: number
    userBalance: number
    unlocking: boolean
}

export default function UnlockModal({
    open,
    onClose,
    onConfirm,
    chapterTitle,
    creditsRequired,
    userBalance,
    unlocking,
}: Props) {
    const navigate = useNavigate()
    const canAfford = userBalance >= creditsRequired
    const shortfall = creditsRequired - userBalance

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 8 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#fffdf5] dark:bg-[#1c1a17] border-[2.5px] border-[#1a1a1a] dark:border-foreground/40 w-full max-w-xs overflow-hidden"
                        style={{ boxShadow: '5px 5px 0 #1a1a1a' }}
                    >
                        {/* Header */}
                        <div className="bg-[#1a1a1a] dark:bg-[#2a2825] px-5 py-4">
                            <h2
                                className="text-white leading-none"
                                style={{
                                    fontFamily: "'Bebas Neue', sans-serif",
                                    fontSize: '22px',
                                    letterSpacing: '0.04em',
                                }}
                            >
                                {canAfford ? '🔓 UNLOCK CHAPTER' : '💳 NOT ENOUGH CREDITS'}
                            </h2>
                            <p
                                className="text-white/40 mt-1 text-small truncate"
                                style={{ fontFamily: "'Kalam', cursive" }}
                            >
                                {chapterTitle}
                            </p>
                        </div>

                        {/* Body */}
                        <div className="p-5">
                            {canAfford ? (
                                <>
                                    <div className="flex items-center justify-between mb-4 pb-4 border-b-[2px] border-[#1a1a1a]/10 dark:border-foreground/10">
                                        <span
                                            className="text-[#1a1a1a]/60 dark:text-foreground/60 text-small"
                                            style={{ fontFamily: "'Kalam', cursive" }}
                                        >
                                            Cost
                                        </span>
                                        <span
                                            className="text-amber-500"
                                            style={{
                                                fontFamily: "'Bebas Neue', sans-serif",
                                                fontSize: '20px',
                                            }}
                                        >
                                            ₵ {creditsRequired}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mb-5">
                                        <span
                                            className="text-[#1a1a1a]/60 dark:text-foreground/60 text-small"
                                            style={{ fontFamily: "'Kalam', cursive" }}
                                        >
                                            Your balance
                                        </span>
                                        <span
                                            className="text-[#1a1a1a] dark:text-foreground"
                                            style={{
                                                fontFamily: "'Bebas Neue', sans-serif",
                                                fontSize: '20px',
                                            }}
                                        >
                                            ₵ {userBalance}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mb-5 pt-3 border-t-[2px] border-[#1a1a1a]/10 dark:border-foreground/10">
                                        <span
                                            className="text-[#1a1a1a]/60 dark:text-foreground/60 text-small"
                                            style={{ fontFamily: "'Kalam', cursive" }}
                                        >
                                            Balance after
                                        </span>
                                        <span
                                            className="text-green-600 dark:text-green-400"
                                            style={{
                                                fontFamily: "'Bebas Neue', sans-serif",
                                                fontSize: '20px',
                                            }}
                                        >
                                            ₵ {userBalance - creditsRequired}
                                        </span>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={onClose}
                                            disabled={unlocking}
                                            className="flex-1 py-2 border-[2px] border-[#d4cfc2] text-[#999] hover:border-[#888] hover:text-[#1a1a1a] transition-colors duration-100 cursor-pointer text-small disabled:opacity-50"
                                            style={{
                                                fontFamily: "'Bebas Neue', sans-serif",
                                                letterSpacing: '0.1em',
                                            }}
                                        >
                                            CANCEL
                                        </button>
                                        <button
                                            onClick={onConfirm}
                                            disabled={unlocking}
                                            className="flex-1 py-2 bg-amber-400 border-[2px] border-[#1a1a1a] text-[#1a1a1a] hover:bg-amber-500 transition-colors duration-100 cursor-pointer text-small disabled:opacity-60"
                                            style={{
                                                fontFamily: "'Bebas Neue', sans-serif",
                                                letterSpacing: '0.1em',
                                                boxShadow: '2px 2px 0 #1a1a1a',
                                            }}
                                        >
                                            {unlocking ? 'UNLOCKING...' : 'CONFIRM UNLOCK'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="text-center py-2 mb-4">
                                        <div
                                            className="text-[#1a1a1a] dark:text-foreground mb-1"
                                            style={{
                                                fontFamily: "'Bebas Neue', sans-serif",
                                                fontSize: '32px',
                                            }}
                                        >
                                            ₵ {creditsRequired}
                                        </div>
                                        <p
                                            className="text-[#1a1a1a]/60 dark:text-foreground/50 text-small"
                                            style={{ fontFamily: "'Kalam', cursive" }}
                                        >
                                            needed to unlock
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between px-3 py-2 mb-5 bg-red-50 dark:bg-red-950/30 border-[2px] border-red-200 dark:border-red-800">
                                        <span
                                            className="text-red-500 text-small"
                                            style={{ fontFamily: "'Kalam', cursive" }}
                                        >
                                            you're short
                                        </span>
                                        <span
                                            className="text-red-500"
                                            style={{
                                                fontFamily: "'Bebas Neue', sans-serif",
                                                fontSize: '18px',
                                            }}
                                        >
                                            ₵ {shortfall} credits
                                        </span>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={onClose}
                                            className="flex-1 py-2 border-[2px] border-[#d4cfc2] text-[#999] hover:border-[#888] hover:text-[#1a1a1a] transition-colors duration-100 cursor-pointer text-small"
                                            style={{
                                                fontFamily: "'Bebas Neue', sans-serif",
                                                letterSpacing: '0.1em',
                                            }}
                                        >
                                            CANCEL
                                        </button>
                                        <button
                                            onClick={() => navigate('/credits')}
                                            className="flex-1 py-2 bg-[#1a1a1a] dark:bg-foreground text-white dark:text-background border-[2px] border-[#1a1a1a] hover:opacity-90 transition-opacity cursor-pointer text-small"
                                            style={{
                                                fontFamily: "'Bebas Neue', sans-serif",
                                                letterSpacing: '0.1em',
                                                boxShadow: '2px 2px 0 #1a1a1a',
                                            }}
                                        >
                                            TOP UP →
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
