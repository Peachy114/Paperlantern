// pages/admin/Withdrawals/Index.tsx
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/api/axios'

const FONTS = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Kalam:wght@400;700&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap"

type Status = 'pending' | 'approved' | 'rejected' | 'paid'

interface WithdrawalRequest {
  id: number
  amount_php: number
  payout_method: string
  payout_details: string
  status: Status
  admin_notes: string | null
  processed_at: string | null
  created_at: string
  user: { id: number; name: string; email: string }
}

interface PaginatedWithdrawals {
  data: WithdrawalRequest[]
  current_page: number
  last_page: number
  total: number
}

const STATUS_STYLE: Record<Status, { bg: string; color: string; label: string }> = {
  pending:  { bg: '#fef08a', color: '#1a1a1a', label: 'Pending'  },
  approved: { bg: '#86efac', color: '#1a1a1a', label: 'Approved' },
  rejected: { bg: '#fca5a5', color: '#1a1a1a', label: 'Rejected' },
  paid:     { bg: '#a5f3fc', color: '#1a1a1a', label: 'Paid'     },
}

const METHOD_LABEL: Record<string, string> = {
  gcash: 'GCash',
  maya:  'Maya',
  bank:  'Bank Transfer',
}

export default function AdminWithdrawals() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('pending')
  const [page, setPage] = useState(1)
  const [processing, setProcessing] = useState<number | null>(null)
  const [modal, setModal] = useState<{
    open: boolean
    withdrawal: WithdrawalRequest | null
    action: 'approved' | 'rejected' | 'paid' | null
    notes: string
  }>({ open: false, withdrawal: null, action: null, notes: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-withdrawals', statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page) })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const { data } = await api.get<PaginatedWithdrawals>(`/admin/withdrawals?${params}`)
      return data
    },
    staleTime: 1000 * 30,
  })

  const openModal = (withdrawal: WithdrawalRequest, action: 'approved' | 'rejected' | 'paid') => {
    setModal({ open: true, withdrawal, action, notes: '' })
  }

  const handleProcess = async () => {
    if (!modal.withdrawal || !modal.action) return
    setProcessing(modal.withdrawal.id)
    try {
      await api.put(`/admin/withdrawals/${modal.withdrawal.id}/process`, {
        status:      modal.action,
        admin_notes: modal.notes || null,
      })
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] })
      setModal({ open: false, withdrawal: null, action: null, notes: '' })
    } finally {
      setProcessing(null)
    }
  }

  const withdrawals = data?.data ?? []
  const lastPage    = data?.last_page ?? 1
  const total       = data?.total ?? 0

  return (
    <>
      <link href={FONTS} rel="stylesheet" />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
        <div className="flex gap-0 mb-6">

          {/* Spine */}
          <div
            className="w-4 sm:w-6 shrink-0 flex flex-col items-center justify-between py-4 bg-[#080808]"
            style={{ minHeight: '320px' }}
          >
            <span
              className="text-red-400 text-[8px] sm:text-xsmall tracking-[0.3em] rotate-90 whitespace-nowrap mt-4"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              PAPER LANTERN
            </span>
            <span
              className="text-white/30 text-[8px] sm:text-xsmall tracking-[0.2em] rotate-90 whitespace-nowrap mb-4"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              WITHDRAWALS
            </span>
          </div>

          {/* Main */}
          <div
            className="flex-1 min-w-0 border-[2.5px] border-[#1a1a1a] overflow-hidden bg-[#fffdf5] dark:bg-[#1c1a17]"
            style={{ boxShadow: '4px 4px 0 #1a1a1a' }}
          >

            {/* Header */}
            <div className="border-b-[2.5px] border-[#000000] px-3 sm:px-5 py-3 sm:py-5 bg-[#1a1a1a] flex items-center justify-between gap-3">
              <div>
                <h1
                  className="text-red-400 leading-none"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(26px, 6vw, 38px)', letterSpacing: '0.04em' }}
                >
                  WITHDRAWAL REQUESTS
                </h1>
                <p className="text-white/30 mt-1 text-[12px] sm:text-small" style={{ fontFamily: "'Kalam', cursive" }}>
                  review and process storyteller payouts
                </p>
              </div>
              <div
                className="px-3 py-1.5 -rotate-1 shrink-0"
                style={{ background: '#fef08a', fontFamily: "'Kalam', cursive", color: '#1a1a1a', boxShadow: '2px 2px 0 rgba(0,0,0,0.3)', fontSize: '11px' }}
              >
                {total} requests
              </div>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-0 border-b-[2px] border-[#1a1a1a] overflow-x-auto">
              {(['all', 'pending', 'approved', 'rejected', 'paid'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1) }}
                  className={`px-4 py-2.5 text-[11px] sm:text-xsmall tracking-[0.12em] shrink-0 border-r-[2px] border-[#1a1a1a] transition-colors duration-100 cursor-pointer ${
                    statusFilter === s
                      ? 'bg-[#1a1a1a] text-white'
                      : 'bg-[#fffdf5] dark:bg-[#1c1a17] text-[#1a1a1a]/50 dark:text-foreground/50 hover:bg-amber-400/10'
                  }`}
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  {s === 'all' ? 'ALL' : STATUS_STYLE[s].label.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Table header — desktop */}
            <div className="hidden sm:grid grid-cols-[1fr_100px_140px_120px_100px] gap-3 px-5 py-2 bg-[#f5f3ea] dark:bg-[#18160f] border-b border-[#1a1a1a]/10">
              {['Storyteller', 'Amount', 'Method / Details', 'Status', 'Actions'].map((h) => (
                <span key={h} className="text-[#1a1a1a]/40 dark:text-foreground/40 text-[10px] tracking-[0.18em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                  {h.toUpperCase()}
                </span>
              ))}
            </div>

            {/* Rows */}
            {isLoading ? (
              <div className="px-5 py-12 text-center text-[#1a1a1a]/40 dark:text-foreground/40" style={{ fontFamily: "'Kalam', cursive" }}>
                Loading...
              </div>
            ) : withdrawals.length === 0 ? (
              <div className="px-5 py-12 text-center bg-[#fffdf5] dark:bg-[#1c1a17]" style={{ fontFamily: "'Kalam', cursive", color: '#888' }}>
                No {statusFilter !== 'all' ? statusFilter : ''} withdrawal requests.
              </div>
            ) : (
              <div className="divide-y divide-blue-200/30 dark:divide-white/10">
                {withdrawals.map((w, i) => (
                  <div
                    key={w.id}
                    className={`flex flex-col sm:grid sm:grid-cols-[1fr_100px_140px_120px_100px] gap-2 sm:gap-3 px-3 sm:px-5 py-3 ${
                      i % 2 === 0 ? 'bg-[#fffdf5] dark:bg-[#1c1a17]' : 'bg-[#faf8ee] dark:bg-[#191713]'
                    }`}
                  >
                    {/* Storyteller */}
                    <div className="min-w-0">
                      <div className="text-[#1a1a1a] dark:text-foreground text-[12px] sm:text-normal truncate" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}>
                        {w.user.name}
                      </div>
                      <div className="text-[#1a1a1a]/40 dark:text-foreground/40 text-[10px] truncate" style={{ fontFamily: "'Kalam', cursive" }}>
                        {w.user.email}
                      </div>
                      <div className="text-[#1a1a1a]/30 dark:text-foreground/30 text-[10px]" style={{ fontFamily: "'Kalam', cursive" }}>
                        {new Date(w.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="flex sm:block items-center gap-2">
                      <span className="text-[#1a1a1a] dark:text-foreground text-[14px] sm:text-normal" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                        ₱{Number(w.amount_php).toFixed(2)}
                      </span>
                    </div>

                    {/* Method / Details */}
                    <div className="min-w-0">
                      <div className="text-[#1a1a1a]/60 dark:text-foreground/60 text-[11px]" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.08em' }}>
                        {METHOD_LABEL[w.payout_method] ?? w.payout_method}
                      </div>
                      <div className="text-[#1a1a1a]/40 dark:text-foreground/40 text-[10px] truncate" style={{ fontFamily: "'Noto Serif', serif" }}>
                        {w.payout_details}
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <span
                        className="inline-block px-2 py-0.5 text-[10px] rotate-[-1deg]"
                        style={{
                          background:  STATUS_STYLE[w.status]?.bg ?? '#e5e5e5',
                          color:       STATUS_STYLE[w.status]?.color ?? '#1a1a1a',
                          fontFamily:  "'Kalam', cursive",
                          boxShadow:   '1px 1px 3px rgba(0,0,0,0.15)',
                          display:     'inline-block',
                        }}
                      >
                        {STATUS_STYLE[w.status]?.label ?? w.status}
                      </span>
                      {w.admin_notes && (
                        <div className="text-[#1a1a1a]/30 dark:text-foreground/30 text-[9px] mt-1 truncate" style={{ fontFamily: "'Kalam', cursive" }}>
                          {w.admin_notes}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-1">
                      {w.status === 'pending' && (
                        <>
                          <button
                            onClick={() => openModal(w, 'approved')}
                            className="px-2 py-1 text-[10px] border-[2px] border-[#1a1a1a] bg-[#86efac] text-[#1a1a1a] hover:opacity-80 transition-opacity cursor-pointer"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                          >
                            APPROVE
                          </button>
                          <button
                            onClick={() => openModal(w, 'rejected')}
                            className="px-2 py-1 text-[10px] border-[2px] border-[#1a1a1a] bg-[#fca5a5] text-[#1a1a1a] hover:opacity-80 transition-opacity cursor-pointer"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                          >
                            REJECT
                          </button>
                        </>
                      )}
                      {w.status === 'approved' && (
                        <button
                          onClick={() => openModal(w, 'paid')}
                          className="px-2 py-1 text-[10px] border-[2px] border-[#1a1a1a] bg-[#a5f3fc] text-[#1a1a1a] hover:opacity-80 transition-opacity cursor-pointer"
                          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                          MARK PAID
                        </button>
                      )}
                      {(w.status === 'rejected' || w.status === 'paid') && (
                        <span className="text-[#1a1a1a]/20 dark:text-foreground/20 text-[10px]" style={{ fontFamily: "'Kalam', cursive" }}>
                          done
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer / Pagination */}
            <div className="px-3 sm:px-5 py-2.5 flex items-center justify-between border-t-[2px] border-[#1a1a1a] bg-[#fffdf5] dark:bg-[#1c1a17]">
              <span className="text-[#1a1a1a]/30 dark:text-foreground/30 text-[10px] sm:text-xsmall" style={{ fontFamily: "'Kalam', cursive" }}>
                {total} request{total !== 1 ? 's' : ''} total
              </span>

              {lastPage > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-2 py-1 border-[2px] border-[#1a1a1a] text-[#1a1a1a] dark:border-foreground dark:text-foreground text-[11px] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1a1a1a] hover:text-white transition-colors duration-100 cursor-pointer"
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
                          ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white'
                          : 'border-[#1a1a1a]/30 text-[#1a1a1a]/50 hover:border-[#1a1a1a] hover:text-[#1a1a1a]'
                      }`}
                      style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                    disabled={page === lastPage}
                    className="px-2 py-1 border-[2px] border-[#1a1a1a] text-[#1a1a1a] dark:border-foreground dark:text-foreground text-[11px] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1a1a1a] hover:text-white transition-colors duration-100 cursor-pointer"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  >
                    →
                  </button>
                </div>
              )}

              <span className="text-[#1a1a1a]/20 dark:text-foreground/20 tracking-[0.2em] text-[9px] sm:text-xsmall" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                PAPER LANTERN ADMIN
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {modal.open && modal.withdrawal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div
            className="bg-[#fffdf5] border-[2.5px] border-[#1a1a1a] w-full max-w-sm overflow-hidden"
            style={{ boxShadow: '5px 5px 0 #1a1a1a' }}
          >
            <div className="bg-[#1a1a1a] px-5 py-4">
              <h2 className="text-white leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', letterSpacing: '0.04em' }}>
                {modal.action === 'approved' && '✅ APPROVE WITHDRAWAL'}
                {modal.action === 'rejected' && '❌ REJECT WITHDRAWAL'}
                {modal.action === 'paid'     && '💸 MARK AS PAID'}
              </h2>
              <p className="text-white/40 mt-1 text-small" style={{ fontFamily: "'Kalam', cursive" }}>
                {modal.withdrawal.user.name} — ₱{Number(modal.withdrawal.amount_php).toFixed(2)} via {METHOD_LABEL[modal.withdrawal.payout_method]}
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div
                className="px-3 py-2 bg-[#faf8ee] border-[2px] border-[#1a1a1a]/10 text-[11px]"
                style={{ fontFamily: "'Noto Serif', serif", color: '#1a1a1a' }}
              >
                {modal.withdrawal.payout_details}
              </div>

              <div>
                <label className="block text-[11px] tracking-[0.15em] text-[#1a1a1a]/50 mb-1" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                  ADMIN NOTES (OPTIONAL)
                </label>
                <textarea
                  value={modal.notes}
                  onChange={e => setModal(m => ({ ...m, notes: e.target.value }))}
                  placeholder="e.g. Sent via GCash ref #12345"
                  rows={3}
                  className="w-full border-[2px] border-[#1a1a1a] px-3 py-2 bg-white text-[#1a1a1a] text-small outline-none focus:border-amber-400 resize-none"
                  style={{ fontFamily: "'Noto Serif', serif" }}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setModal({ open: false, withdrawal: null, action: null, notes: '' })}
                  className="flex-1 py-2 border-[2px] border-[#d4cfc2] text-[#999] hover:border-[#888] hover:text-[#1a1a1a] transition-colors duration-100 cursor-pointer text-small"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
                >
                  CANCEL
                </button>
                <button
                  onClick={handleProcess}
                  disabled={!!processing}
                  className={`flex-1 py-2 border-[2px] border-[#1a1a1a] text-[#1a1a1a] text-small transition-opacity duration-100 cursor-pointer disabled:opacity-50 ${
                    modal.action === 'approved' ? 'bg-[#86efac]' :
                    modal.action === 'rejected' ? 'bg-[#fca5a5]' :
                    'bg-[#a5f3fc]'
                  }`}
                  style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
                >
                  {processing ? 'PROCESSING...' : 'CONFIRM'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}