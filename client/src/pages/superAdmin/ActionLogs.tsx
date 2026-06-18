import { useAdminLogs } from '@/hooks/useAdminLogs'
import { useNavigate } from 'react-router-dom'

const FONTS = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Kalam:wght@400;700&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap"

const ACTION_BADGE: Record<string, { label: string; color: string }> = {
  banned_user:     { label: 'Banned User',     color: '#fca5a5' },
  unbanned_user:   { label: 'Unbanned User',   color: '#86efac' },
  deleted_user:    { label: 'Deleted User',    color: '#f87171' },
  deleted_work:    { label: 'Deleted Work',    color: '#fbbf24' },
  deleted_chapter: { label: 'Deleted Chapter', color: '#fbbf24' },
  viewed_chapter:  { label: 'Viewed Chapter',  color: '#93c5fd' },
}

export default function AdminActionLogs() {
  const { logs, currentPage, lastPage, setPage } = useAdminLogs()
  const navigate = useNavigate()
  

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
              LOGS
            </span>
          </div>

          {/* Main */}
          <div
            className="flex-1 min-w-0 border-[2.5px] border-[#1a1a1a] overflow-hidden bg-[#fffdf5] dark:bg-[#1c1a17]"
            style={{ boxShadow: '4px 4px 0 #1a1a1a' }}
          >
            {/* Header */}
            <div className="border-b-[2.5px] border-[#000000] px-3 sm:px-5 py-3 sm:py-5 bg-[#1a1a1a]">
              <button
                onClick={() => navigate('/admin')}
                className="text-white/30 hover:text-white text-[11px] mb-1 transition-colors"
                style={{ fontFamily: "'Kalam', cursive" }}
              >
                ← Back to Admin
              </button>
              <h1
                className="text-red-400 leading-none"
                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(26px, 6vw, 38px)', letterSpacing: '0.04em' }}
              >
                ACTION LOGS
              </h1>
              <p className="text-white/30 mt-1 text-[12px]" style={{ fontFamily: "'Kalam', cursive" }}>
                every action is recorded
              </p>
            </div>

            {/* TOC Header */}
            <div className="bg-[#1a1a1a] dark:bg-[#2a2825] px-3 sm:pl-14 sm:pr-5 py-3 flex items-center justify-between border-b-[2px] border-[#1a1a1a]">
              <span className="text-white text-[12px] tracking-[0.18em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                ◆ RECENT ACTIONS
              </span>
              <div
                className="px-2 py-1 rotate-[1deg] text-[10px]"
                style={{ background: '#93c5fd', fontFamily: "'Kalam', cursive", color: '#1a1a1a', boxShadow: '1px 2px 4px rgba(0,0,0,0.25)' }}
              >
                last 100 actions
              </div>
            </div>

            {/* Logs */}
            { logs.length === 0 ? (
              <div className="px-5 py-12 text-center text-muted-foreground" style={{ fontFamily: "'Kalam', cursive" }}>
                No actions logged yet.
              </div>
            ) : (
              <div className="divide-y divide-blue-200/30 dark:divide-white/10 relative">
                <div className="hidden sm:block absolute left-10 top-0 bottom-0 w-[1.5px] bg-red-300/60 dark:bg-red-400/20 pointer-events-none z-10" />

                {logs.map((log, i) => {
                  const badge = ACTION_BADGE[log.action] ?? { label: log.action, color: '#e5e7eb' }
                  return (
                    <div
                      key={log.id}
                      className={`relative flex items-center gap-2 sm:gap-3 px-3 sm:pl-14 sm:pr-4 py-3 ${
                        i % 2 === 0 ? 'bg-[#fffdf5] dark:bg-[#1c1a17]' : 'bg-[#faf8ee] dark:bg-[#191713]'
                      }`}
                    >
                      <span
                        className="hidden sm:block absolute left-0 w-10 text-right pr-2.5 text-[#1a1a1a]/20 text-xsmall"
                        style={{ fontFamily: "'Kalam', cursive" }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>

                      {/* Action badge */}
                      <div
                        className="shrink-0 px-2 py-1 text-[10px] sm:text-xsmall -rotate-[0.5deg]"
                        style={{ background: badge.color, fontFamily: "'Kalam', cursive", color: '#1a1a1a', boxShadow: '1px 2px 0 rgba(0,0,0,0.15)', minWidth: '90px', textAlign: 'center' }}
                      >
                        {badge.label}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 text-start">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className="text-[#1a1a1a] dark:text-foreground text-[12px] sm:text-small"
                            style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}
                          >
                            {log.admin.name}
                          </span>
                          <span className="text-[#1a1a1a]/30 text-[10px]" style={{ fontFamily: "'Kalam', cursive" }}>
                            @{log.admin.username}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[#1a1a1a]/40 dark:text-foreground/40 text-[10px]" style={{ fontFamily: "'Noto Serif', serif" }}>
                            {log.target_type} #{log.target_id}
                          </span>
                          {log.notes && (
                            <>
                              <span className="text-[#1a1a1a]/20 text-[10px]">·</span>
                              <span className="text-[#1a1a1a]/40 dark:text-foreground/40 text-[10px] italic" style={{ fontFamily: "'Kalam', cursive" }}>
                                "{log.notes}"
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Time */}
                      <div className="shrink-0 text-[#1a1a1a]/30 dark:text-foreground/30 text-[10px]" style={{ fontFamily: "'Kalam', cursive" }}>
                        {new Date(log.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Footer */}
           <div className="px-3 sm:pl-14 sm:pr-5 py-2.5 flex items-center justify-between border-t-[2px] border-[#1a1a1a] bg-[#fffdf5] dark:bg-[#1c1a17]">
              <span className="text-[#1a1a1a]/30 dark:text-foreground/30 text-[10px]" style={{ fontFamily: "'Kalam', cursive" }}>
                {logs.length} actions logged
              </span>

              {lastPage > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="text-[10px] px-2 py-1 border border-[#1a1a1a]/20 disabled:opacity-30"
                    style={{ fontFamily: "'Kalam', cursive" }}
                  >
                    ← prev
                  </button>
                  <span className="text-[10px]" style={{ fontFamily: "'Kalam', cursive" }}>
                    {currentPage} / {lastPage}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                    disabled={currentPage === lastPage}
                    className="text-[10px] px-2 py-1 border border-[#1a1a1a]/20 disabled:opacity-30"
                    style={{ fontFamily: "'Kalam', cursive" }}
                  >
                    next →
                  </button>
                </div>
              )}

              <span className="text-[#1a1a1a]/20 tracking-[0.2em] text-[9px]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                PAPER LANTERN ADMIN
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}