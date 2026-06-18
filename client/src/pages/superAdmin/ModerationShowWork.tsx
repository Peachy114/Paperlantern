import { Suspense } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAdminModerationShowWork } from '@/hooks/useAdminModerationShowWork'
import { storageUrl } from '@/utils/storage'

const FONTS = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Kalam:wght@400;700&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap"

const STRIKE_BG  = ['', '#86efac', '#fbbf24', '#fca5a5']
const STRIKE_MSG = ['', 'First warning', 'Final warning — next ban!', 'BANNED']

function ModerationShowWorkContent() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    work,
    reason, setReason,
    showViolateForm, setShowViolateForm,
    approve, violate,
    approving, violating,
    result,
  } = useAdminModerationShowWork(Number(id))

  const user = work.user

  return (
    <>
      <link href={FONTS} rel="stylesheet" />
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-10">

        {/* Back */}
        <button
          onClick={() => navigate('/admin/moderation')}
          className="text-muted-foreground hover:text-foreground text-[11px] mb-4 transition-colors"
          style={{ fontFamily: "'Kalam', cursive" }}
        >
          ← Back to Queue
        </button>

        {/* Result banner */}
        {result && (
          <div
            className="mb-4 px-4 py-3 border-[2px] border-[#1a1a1a]"
            style={{ background: result.banned ? '#fca5a5' : '#86efac', fontFamily: "'Kalam', cursive", color: '#1a1a1a' }}
          >
            ✓ {result.message}
            {result.strike && ` — Strike ${result.strike}/3`}
          </div>
        )}

        <div className="flex gap-0">
          {/* Spine */}
          <div className="w-4 sm:w-6 shrink-0 flex flex-col items-center justify-between py-4 bg-[#080808]" style={{ minHeight: '400px' }}>
            <span className="text-red-400 text-[8px] tracking-[0.3em] rotate-90 whitespace-nowrap mt-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              REVIEW
            </span>
          </div>

          <div className="flex-1 border-[2.5px] border-[#1a1a1a] bg-[#fffdf5] dark:bg-[#1c1a17]" style={{ boxShadow: '4px 4px 0 #1a1a1a' }}>

            {/* Header */}
            <div className="bg-[#1a1a1a] px-4 sm:px-6 py-4">
              <h1 className="text-red-400 leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(20px, 5vw, 32px)', letterSpacing: '0.04em' }}>
                {work.title}
              </h1>
              <p className="text-white/50 mt-1 text-[12px]" style={{ fontFamily: "'Kalam', cursive" }}>
                {work.type}
              </p>
            </div>

            {/* Creator info */}
            <div className="px-4 sm:px-6 py-4 border-b-[2px] border-[#1a1a1a] flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[#1a1a1a] dark:text-foreground text-[13px]" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}>
                    {user.name}
                  </span>
                  <span className="text-[#1a1a1a]/40 text-[11px]" style={{ fontFamily: "'Kalam', cursive" }}>
                    @{user.username}
                  </span>
                  <span className="text-[#1a1a1a]/40 text-[11px]" style={{ fontFamily: "'Kalam', cursive" }}>
                    {user.email}
                  </span>
                </div>
                {user.strike_count > 0 && (
                  <div
                    className="mt-1 inline-block px-2 py-0.5 text-[10px]"
                    style={{ background: STRIKE_BG[user.strike_count] ?? '#fca5a5', fontFamily: "'Kalam', cursive", color: '#1a1a1a' }}
                  >
                    ⚠️ {STRIKE_MSG[user.strike_count] ?? 'Multiple violations'} ({user.strike_count}/3 strikes)
                  </div>
                )}
              </div>
              <div className="text-[#1a1a1a]/30 text-[10px]" style={{ fontFamily: "'Kalam', cursive" }}>
                submitted {new Date(work.created_at).toLocaleDateString()}
              </div>
            </div>

            {/* Work content */}
            <div className="px-4 sm:px-6 py-6 border-b-[2px] border-[#1a1a1a]">
              <div
                className="text-[#1a1a1a]/40 dark:text-foreground/40 text-[11px] tracking-[0.15em] mb-4"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                ◆ WORK DETAILS
              </div>

              <div className="flex gap-4">
                {/* Cover */}
                <div className="w-24 sm:w-32 shrink-0">
                  {work.cover
                    ? <img src={storageUrl(work.cover)!} alt={work.title} className="w-full border border-black/10" />
                    : <div className="w-full aspect-[3/4] bg-[#d4cfc2] border border-black/10 flex items-center justify-center">
                        <span className="text-black/20 text-2xl">◻</span>
                      </div>
                  }
                </div>

                {/* Description */}
                <div className="flex-1">
                  {work.description
                    ? <div
                        className="text-[#1a1a1a] dark:text-foreground text-[14px] leading-relaxed"
                        style={{ fontFamily: "'Noto Serif', serif" }}
                      >
                        {work.description}
                      </div>
                    : <div className="text-[#1a1a1a]/30 text-[12px]" style={{ fontFamily: "'Kalam', cursive" }}>
                        No description provided.
                      </div>
                  }
                </div>
              </div>
            </div>

            {/* Actions */}
            {work.moderation_status === 'pending_review' && (
              <div className="px-4 sm:px-6 py-4">
                <div
                  className="text-[#1a1a1a]/40 dark:text-foreground/40 text-[11px] tracking-[0.15em] mb-4"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  ◆ MODERATION DECISION
                </div>

                {!showViolateForm ? (
                  <div className="flex gap-3">
                    <button
                      onClick={approve}
                      disabled={approving}
                      className="border-[2.5px] border-green-500 text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors px-5 py-2 text-[13px] disabled:opacity-50 cursor-pointer"
                      style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em', boxShadow: '2px 2px 0 #16a34a' }}
                    >
                      {approving ? 'APPROVING...' : '✓ APPROVE & PUBLISH'}
                    </button>
                    <button
                      onClick={() => setShowViolateForm(true)}
                      className="border-[2.5px] border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors px-5 py-2 text-[13px] cursor-pointer"
                      style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em', boxShadow: '2px 2px 0 #dc2626' }}
                    >
                      ✕ VIOLATION
                    </button>
                  </div>
                ) : (
                  <div className="border-[2px] border-red-300 bg-red-50 dark:bg-red-950/20 p-4">
                    <p className="text-[12px] text-red-600 mb-3" style={{ fontFamily: "'Kalam', cursive" }}>
                      ⚠️ This will issue strike {user.strike_count + 1}/3 to @{user.username}.
                      {user.strike_count + 1 >= 3 && ' This will result in an automatic ban!'}
                    </p>
                    <textarea
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      rows={3}
                      placeholder="Explain the violation reason clearly..."
                      className="w-full px-3 py-2 text-[12px] border-[2px] border-red-300 bg-white dark:bg-zinc-900 text-foreground focus:outline-none focus:border-red-500 resize-none mb-3"
                      style={{ fontFamily: "'Kalam', cursive" }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={violate}
                        disabled={!reason.trim() || violating}
                        className="border-[2px] border-red-500 bg-red-500 text-white px-4 py-1.5 text-[11px] disabled:opacity-50 cursor-pointer hover:bg-red-600 transition-colors"
                        style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
                      >
                        {violating ? 'PROCESSING...' : 'CONFIRM VIOLATION'}
                      </button>
                      <button
                        onClick={() => { setShowViolateForm(false); setReason('') }}
                        className="border-[2px] border-[#1a1a1a]/20 text-[#1a1a1a]/40 px-4 py-1.5 text-[11px] cursor-pointer hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors"
                        style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
                      >
                        CANCEL
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Already reviewed */}
            {work.moderation_status !== 'pending_review' && (
              <div
                className="px-4 sm:px-6 py-4"
                style={{ background: work.moderation_status === 'approved' ? 'rgba(134,239,172,0.2)' : 'rgba(252,165,165,0.2)' }}
              >
                <span
                  className="text-[13px]"
                  style={{ fontFamily: "'Kalam', cursive", color: work.moderation_status === 'approved' ? '#16a34a' : '#dc2626' }}
                >
                  {work.moderation_status === 'approved' ? '✓ This work has been approved.' : '✕ This work was marked as a violation.'}
                </span>
              </div>
            )}

            {/* Footer */}
            <div className="px-4 sm:px-6 py-2.5 border-t-[2px] border-[#1a1a1a] flex justify-end bg-[#fffdf5] dark:bg-[#1c1a17]">
              <span className="text-[#1a1a1a]/20 tracking-[0.2em] text-[9px]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                PAPER LANTERN MODERATION
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function ModerationShowWork() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh] tracking-[0.2em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
        — LOADING WORK... —
      </div>
    }>
      <ModerationShowWorkContent />
    </Suspense>
  )
}