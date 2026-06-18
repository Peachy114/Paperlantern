// pages/storyteller/Earnings/Index.tsx
import { useState } from 'react'
import { useEarnings, useEarningHistory, requestWithdrawal, type EarningTransaction } from '@/hooks/useEarnings'

const PAYOUT_METHODS = ['gcash', 'maya', 'bank'] as const
type PayoutMethod = typeof PAYOUT_METHODS[number]

const METHOD_LABEL: Record<PayoutMethod, string> = {
  gcash: 'GCash',
  maya:  'Maya',
  bank:  'Bank Transfer',
}

const METHOD_PLACEHOLDER: Record<PayoutMethod, string> = {
  gcash: 'GCash number (e.g. 09171234567)',
  maya:  'Maya number (e.g. 09171234567)',
  bank:  'Bank name · Account number · Account name',
}

export default function EarningsIndex() {
  const { earnings, loading: earningsLoading, refetch } = useEarnings()
  const { history, loading: historyLoading, page, setPage, lastPage, total } = useEarningHistory(10)

  const [showWithdraw, setShowWithdraw]   = useState(false)
  const [method, setMethod]               = useState<PayoutMethod>('gcash')
  const [details, setDetails]             = useState('')
  const [amount, setAmount]               = useState('')
  const [submitting, setSubmitting]       = useState(false)
  const [result, setResult]               = useState<{ success: boolean; message: string } | null>(null)

  async function handleWithdraw() {
    setSubmitting(true)
    setResult(null)
    try {
      const res = await requestWithdrawal({
        amount_php:     parseFloat(amount),
        payout_method:  method,
        payout_details: details,
      })
      setResult(res)
      if (res.success) {
        setShowWithdraw(false)
        setAmount('')
        setDetails('')
        refetch()
      }
    } catch {
      setResult({ success: false, message: 'Something went wrong. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Kalam:wght@400;700&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap"
        rel="stylesheet"
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
        <div className="flex gap-0 mb-6">

          {/* Spine */}
          <div
            className="w-4 sm:w-6 shrink-0 flex flex-col items-center justify-between py-4 bg-[#080808]"
            style={{ minHeight: '320px' }}
          >
            <span
              className="text-amber-400 text-[8px] sm:text-xsmall tracking-[0.3em] rotate-90 whitespace-nowrap mt-4"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              PAPER LANTERN
            </span>
            <span
              className="text-white/30 text-[8px] sm:text-xsmall tracking-[0.2em] rotate-90 whitespace-nowrap mb-4"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              EARNINGS
            </span>
          </div>

          {/* Main content */}
          <div
            className="flex-1 min-w-0 border-[2.5px] border-[#1a1a1a] overflow-hidden bg-[#fffdf5] dark:bg-[#1c1a17]"
            style={{ boxShadow: '4px 4px 0 #1a1a1a' }}
          >

            {/* Header */}
            <div className="border-b-[2.5px] border-[#000000] px-3 sm:px-5 py-3 sm:py-5 flex items-center justify-between gap-3 bg-[#fffdf5] dark:bg-[#1c1717]">
              <div className="min-w-0">
                <h1
                  className="text-[#1a1a1a] dark:text-foreground leading-none"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(26px, 6vw, 38px)', letterSpacing: '0.04em' }}
                >
                  YOUR EARNINGS
                </h1>
                <p
                  className="text-[#1a1a1a]/40 dark:text-foreground/40 mt-1 text-[12px] sm:text-small"
                  style={{ fontFamily: "'Kalam', cursive" }}
                >
                  your readers support your work
                </p>
              </div>

              <button
                onClick={() => setShowWithdraw(true)}
                disabled={!earnings?.can_withdraw}
                className="shrink-0 border-[2.5px] border-[#1a1a1a] dark:border-foreground text-[#1a1a1a] dark:text-foreground hover:bg-[#1a1a1a] hover:text-amber-400 dark:hover:bg-foreground dark:hover:text-background transition-colors duration-100 px-2.5 sm:px-4 py-1.5 sm:py-2 cursor-pointer text-[12px] sm:text-normal disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.12em', boxShadow: '2px 2px 0 #1a1a1a' }}
              >
                WITHDRAW
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 divide-x-[2px] divide-[#000000] border-b-[2px] border-[#1a1a1a] overflow-visible">
              {[
                {
                  val:    earningsLoading ? '—' : `₱${Number(earnings?.balance_php ?? 0).toFixed(2)}`,
                  lbl:    'PHP Balance',
                  sticky: 'cash out anytime!',
                  color:  '#86efac',
                  rotate: '2deg',
                },
                {
                  val:    earningsLoading ? '—' : (earnings?.balance_credits ?? 0).toLocaleString(),
                  lbl:    'Credits Earned',
                  sticky: 'keep it up!',
                  color:  '#ffc6a6',
                  rotate: '-1.5deg',
                },
                {
                  val:    earningsLoading ? '—' : `₱${Number(earnings?.min_withdrawal ?? 200).toFixed(0)}`,
                  lbl:    'Min. Withdrawal',
                  sticky: earnings?.can_withdraw ? 'ready to cash out!' : 'almost there!',
                  color:  earnings?.can_withdraw ? '#86efac' : '#ffbacf',
                  rotate: '1.5deg',
                },
              ].map(({ val, lbl, sticky, color, rotate }) => (
                <div key={lbl} className="relative px-2 sm:px-5 pt-8 pb-4 sm:pt-9 sm:pb-5 bg-[#fff9f5] dark:bg-[#1c1a17]">
                  <div
                    className="absolute -top-3 right-1 h-10 sm:right-3 px-1.5 sm:px-2.5 pt-3 py-0.5 text-[9px] sm:text-[11px] leading-tight z-20 whitespace-nowrap pointer-events-none"
                    style={{
                      background:  color,
                      fontFamily:  "'Kalam', cursive",
                      color:       '#1a1a1a',
                      boxShadow:   '2px 3px 0 rgba(0,0,0,0.2)',
                      transform:   `rotate(${rotate})`,
                    }}
                  >
                    {sticky}
                  </div>
                  <div
                    className="text-[#1a1a1a] dark:text-foreground leading-none"
                    style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(18px, 4vw, 28px)' }}
                  >
                    {val}
                  </div>
                  <div
                    className="text-[#1a1a1a]/40 dark:text-foreground/40 mt-1 text-[9px] sm:text-xsmall tracking-[0.12em] sm:tracking-[0.18em]"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  >
                    {lbl.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>

            {/* Commission info banner */}
            <div className="px-3 sm:px-5 py-2.5 bg-amber-50 dark:bg-amber-950/20 border-b-[2px] border-[#1a1a1a] flex items-center gap-2">
              <span
                className="text-[10px] sm:text-xsmall text-amber-800 dark:text-amber-400"
                style={{ fontFamily: "'Kalam', cursive" }}
              >
                💡 You earn <strong>80%</strong> of every credit spent on your chapters. Paper Lantern keeps 20%.
              </span>
            </div>

            {/* Transaction history header */}
            <div className="relative">
              <div className="hidden sm:block absolute left-10 top-0 bottom-0 w-[1.5px] bg-red-300/60 dark:bg-red-400/20 pointer-events-none z-10" />
              <div className="bg-[#1a1a1a] dark:bg-[#2a2825] px-3 sm:pl-14 sm:pr-5 py-3 flex items-center justify-between">
                <span
                  className="text-white text-[12px] sm:text-normal tracking-[0.18em]"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  ◆ EARNING HISTORY
                </span>
                <div
                  className="px-2 py-1 -rotate-[1.5deg] text-[10px] sm:text-xsmall shrink-0"
                  style={{ background: '#86efac', fontFamily: "'Kalam', cursive", color: '#1a1a1a', boxShadow: '1px 2px 4px rgba(0,0,0,0.25)' }}
                >
                  {history.length} transactions
                </div>
              </div>
            </div>

            {/* History list */}
            {historyLoading ? (
              <div
                className="px-4 sm:pl-14 py-10 text-center text-[#1a1a1a]/40 dark:text-foreground/40"
                style={{ fontFamily: "'Kalam', cursive" }}
              >
                Loading history...
              </div>
            ) : history.length === 0 ? (
              <div className="relative">
                <div className="hidden sm:block absolute left-10 top-0 bottom-0 w-[1.5px] bg-red-300/60 pointer-events-none z-10" />
                <div
                  className="px-4 sm:pl-14 sm:pr-5 py-12 text-center bg-[#fffdf5] dark:bg-[#1c1a17]"
                  style={{ fontFamily: "'Kalam', cursive", color: '#888' }}
                >
                  No earnings yet...
                  <br />
                  <span className="text-[13px]">Readers unlock your chapters to start earning.</span>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-blue-200/30 dark:divide-white/10 relative">
                <div className="hidden sm:block absolute left-10 top-0 bottom-0 w-[1.5px] bg-red-300/60 dark:bg-red-400/20 pointer-events-none z-10" />

                {/* Table header */}
                <div className="hidden sm:grid grid-cols-[1fr_120px_100px_100px] gap-3 px-3 sm:pl-14 sm:pr-5 py-2 bg-[#f5f3ea] dark:bg-[#18160f] border-b border-[#1a1a1a]/10">
                  {['Chapter', 'Reader', 'Credits', 'You Earned'].map((h) => (
                    <span
                      key={h}
                      className="text-[#1a1a1a]/40 dark:text-foreground/40 text-[10px] tracking-[0.18em]"
                      style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                      {h.toUpperCase()}
                    </span>
                  ))}
                </div>

                {history.map((tx: EarningTransaction, i: number) => (
                  <div
                    key={tx.id}
                    className={`relative flex sm:grid sm:grid-cols-[1fr_120px_100px_100px] items-center gap-2 sm:gap-3 px-3 sm:pl-14 sm:pr-5 py-3 ${
                      i % 2 === 0 ? 'bg-[#fffdf5] dark:bg-[#1c1a17]' : 'bg-[#faf8ee] dark:bg-[#191713]'
                    }`}
                  >
                    <span
                      className="hidden sm:block absolute left-0 w-10 text-right pr-2.5 text-[#1a1a1a]/20 dark:text-foreground/20 text-xsmall"
                      style={{ fontFamily: "'Kalam', cursive" }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>

                    {/* Chapter */}
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-[#1a1a1a] dark:text-foreground truncate text-[12px] sm:text-normal"
                        style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}
                      >
                        {tx.chapter?.title ?? `Chapter #${tx.chapter_id}`}
                      </div>
                      <div
                        className="text-[#1a1a1a]/40 dark:text-foreground/40 text-[10px]"
                        style={{ fontFamily: "'Kalam', cursive" }}
                      >
                        {new Date(tx.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>

                    {/* Reader */}
                    <div
                      className="hidden sm:block text-[#1a1a1a]/60 dark:text-foreground/60 text-xsmall truncate"
                      style={{ fontFamily: "'Noto Serif', serif" }}
                    >
                      {tx.reader?.name ?? 'Reader'}
                    </div>

                    {/* Credits spent */}
                    <div
                      className="text-[#1a1a1a]/50 dark:text-foreground/50 text-xsmall"
                      style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.08em' }}
                    >
                      {tx.credits_spent} cr
                    </div>

                    {/* Storyteller cut */}
                    <div className="flex flex-col items-start sm:items-start">
                      <span
                        className="text-green-700 dark:text-green-400 text-[13px] sm:text-normal"
                        style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}
                      >
                        +₱{Number(tx.storyteller_php).toFixed(2)}
                      </span>
                      <span
                        className="text-[#1a1a1a]/30 dark:text-foreground/30 text-[9px]"
                        style={{ fontFamily: "'Kalam', cursive" }}
                      >
                        {tx.storyteller_cut} credits
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="relative px-3 sm:pl-14 sm:pr-5 py-2.5 flex items-center justify-between border-t-[2px] border-[#1a1a1a] bg-[#fffdf5] dark:bg-[#1c1a17]">
              <div className="hidden sm:block absolute left-10 top-0 bottom-0 w-[1.5px] bg-red-300/60 dark:bg-red-400/20 pointer-events-none" />

              <span className="text-[#1a1a1a]/30 dark:text-foreground/30 text-[10px] sm:text-xsmall" style={{ fontFamily: "'Kalam', cursive" }}>
                {total} transaction{total !== 1 ? 's' : ''} total
              </span>

              {lastPage > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-2 py-1 border-[2px] border-[#1a1a1a] dark:border-foreground text-[#1a1a1a] dark:text-foreground text-[11px] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1a1a1a] hover:text-white transition-colors duration-100 cursor-pointer"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  >
                    ←
                  </button>

                  {Array.from({ length: lastPage }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-2 py-1 border-[2px] text-[11px] transition-colors duration-100 cursor-pointer ${
                        p === page
                          ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white dark:border-foreground dark:bg-foreground dark:text-background'
                          : 'border-[#1a1a1a]/30 text-[#1a1a1a]/50 dark:border-foreground/30 dark:text-foreground/50 hover:border-[#1a1a1a] hover:text-[#1a1a1a]'
                      }`}
                      style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                    disabled={page === lastPage}
                    className="px-2 py-1 border-[2px] border-[#1a1a1a] dark:border-foreground text-[#1a1a1a] dark:text-foreground text-[11px] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1a1a1a] hover:text-white transition-colors duration-100 cursor-pointer"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  >
                    →
                  </button>
                </div>
              )}

              <span className="text-[#1a1a1a]/20 dark:text-foreground/20 tracking-[0.15em] sm:tracking-[0.2em] text-[9px] sm:text-xsmall" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                PAPER LANTERN PUBLISHING
              </span>
            </div>

          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <span className="text-muted-foreground/30 text-[9px] sm:text-xsmall tracking-[0.15em] sm:tracking-[0.2em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            PAPER LANTERN PUBLISHING
          </span>
          <span className="text-muted-foreground/30 text-[9px] sm:text-xsmall tracking-[0.15em] sm:tracking-[0.2em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            VOL. 01
          </span>
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div
            className="bg-[#fffdf5] border-[2.5px] border-[#1a1a1a] w-full max-w-sm overflow-hidden"
            style={{ boxShadow: '5px 5px 0 #1a1a1a' }}
          >
            {/* Modal header */}
            <div className="bg-[#1a1a1a] px-5 py-4">
              <h2
                className="text-white leading-none tracking-[0.04em]"
                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px' }}
              >
                WITHDRAW EARNINGS
              </h2>
              <p className="text-white/40 mt-1 text-small" style={{ fontFamily: "'Kalam', cursive" }}>
                available: ₱{Number(earnings?.balance_php ?? 0).toFixed(2)}
              </p>
            </div>

            <div className="p-5 space-y-4">
              {result && !result.success && (
                <div
                  className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-small"
                  style={{ fontFamily: "'Kalam', cursive" }}
                >
                  {result.message}
                </div>
              )}

              {/* Amount */}
              <div>
                <label
                  className="block text-[11px] tracking-[0.15em] text-[#1a1a1a]/50 mb-1"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  AMOUNT (PHP)
                </label>
                <input
                  type="number"
                  min={200}
                  max={earnings?.balance_php}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full border-[2px] border-[#1a1a1a] px-3 py-2 bg-white text-[#1a1a1a] text-normal outline-none focus:border-amber-400"
                  style={{ fontFamily: "'Noto Serif', serif" }}
                />
                <p className="text-[10px] text-[#1a1a1a]/40 mt-1" style={{ fontFamily: "'Kalam', cursive" }}>
                  Minimum withdrawal: ₱200
                </p>
              </div>

              {/* Payout method */}
              <div>
                <label
                  className="block text-[11px] tracking-[0.15em] text-[#1a1a1a]/50 mb-1"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  PAYOUT METHOD
                </label>
                <div className="flex gap-2">
                  {PAYOUT_METHODS.map((m) => (
                    <button
                      key={m}
                      onClick={() => { setMethod(m); setDetails('') }}
                      className={`flex-1 py-2 border-[2px] transition-all duration-100 cursor-pointer text-[11px] ${
                        method === m
                          ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white'
                          : 'border-[#d4cfc2] text-[#999] hover:border-[#888] hover:text-[#1a1a1a]'
                      }`}
                      style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.06em' }}
                    >
                      {METHOD_LABEL[m]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payout details */}
              <div>
                <label
                  className="block text-[11px] tracking-[0.15em] text-[#1a1a1a]/50 mb-1"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  {METHOD_LABEL[method].toUpperCase()} DETAILS
                </label>
                <input
                  type="text"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={METHOD_PLACEHOLDER[method]}
                  className="w-full border-[2px] border-[#1a1a1a] px-3 py-2 bg-white text-[#1a1a1a] text-small outline-none focus:border-amber-400"
                  style={{ fontFamily: "'Noto Serif', serif" }}
                />
              </div>

              <p
                className="text-[10px] text-[#1a1a1a]/40"
                style={{ fontFamily: "'Kalam', cursive" }}
              >
                Processing takes 3–5 business days. You'll be notified once approved.
              </p>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setShowWithdraw(false); setResult(null) }}
                  className="flex-1 py-2 border-[2px] border-[#d4cfc2] text-[#999] hover:border-[#888] hover:text-[#1a1a1a] transition-colors duration-100 cursor-pointer text-small"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
                >
                  CANCEL
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={submitting || !amount || !details || parseFloat(amount) < 200}
                  className="flex-1 py-2 bg-[#1a1a1a] text-white hover:opacity-90 transition-opacity duration-100 border-[2px] border-[#1a1a1a] cursor-pointer text-small disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
                >
                  {submitting ? 'SUBMITTING...' : 'SUBMIT REQUEST'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}