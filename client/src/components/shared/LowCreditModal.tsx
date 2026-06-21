// components/LowCreditModal.tsx
import { useNavigate } from 'react-router-dom'

interface Props {
    isOpen: boolean
    onClose: () => void
    balance: number
}

export function LowCreditModal({ isOpen, onClose, balance }: Props) {
    const navigate = useNavigate()

    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <h2>Not Enough Credits</h2>
                <p>
                    You only have{' '}
                    <strong>
                        {balance} credit{balance !== 1 ? 's' : ''}
                    </strong>{' '}
                    left. Top up to keep reading.
                </p>
                <div className="modal-actions">
                    <button className="btn-secondary" onClick={onClose}>
                        Maybe later
                    </button>
                    <button
                        className="btn-primary"
                        onClick={() => {
                            onClose()
                            navigate('/credits')
                        }}
                    >
                        Buy Credits
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// hooks/useChapterUnlock.ts
// Drop this into a chapter card/page to gate content behind credits.
// ─────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { unlockChapter } from '@/hooks/useWallet'

export function useChapterUnlock(onUnlocked?: (chapterId: number) => void) {
    const [unlocking, setUnlocking] = useState(false)
    const [showLowCredit, setShowLowCredit] = useState(false)
    const [balance, setBalance] = useState(0)

    async function tryUnlock(chapterId: number) {
        setUnlocking(true)
        try {
            const result = await unlockChapter(chapterId)

            if (result.success) {
                setBalance(result.balance)
                onUnlocked?.(chapterId)
            } else if (result.requires_top_up) {
                setBalance(result.balance)
                setShowLowCredit(true)
            }
        } finally {
            setUnlocking(false)
        }
    }

    return {
        tryUnlock,
        unlocking,
        showLowCredit,
        balance,
        closeLowCredit: () => setShowLowCredit(false),
    }
}
