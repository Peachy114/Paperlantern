// pages/TermsOfService.tsx
import { useNavigate } from 'react-router-dom'

const SECTIONS = [
  {
    number: '01',
    title: 'Using Paper Lantern',
    accentColor: '#f59e0b',
    sticky: { text: 'read carefully! ✍️', color: '#fef08a', rotate: '-2deg' },
    quote: '"a place built for readers and creators alike 🏮"',
    items: [
      { text: 'Paper Lantern is open to anyone who wants to read, discover, or publish comics and novels.', title: 'Who Can Use It', warn: false },
      { text: 'You are responsible for keeping your account credentials secure. Do not share your password with anyone.', title: 'Your Account', warn: false },
      { text: 'You agree to provide accurate information when registering. Fake or misleading accounts may be removed.', title: 'Accurate Info', warn: false },
      { text: 'Creating multiple accounts to evade a ban or abuse the platform is strictly prohibited.', title: 'One Account Per Person', warn: true },
    ],
  },
  {
    number: '02',
    title: 'Content Standards',
    accentColor: '#f472b6',
    sticky: { text: 'sign at bottom ✍️', color: '#ffc6a6', rotate: '1.5deg' },
    quote: '"keep it creative, keep it safe ✨"',
    items: [
      { text: 'Sexually explicit or suggestive content is not allowed — especially anything involving minors. Absolute rule, no exceptions.', title: 'No Explicit Content', warn: true },
      { text: 'Content promoting hate speech, discrimination, harassment, or targeted abuse is strictly prohibited.', title: 'No Hate Speech', warn: true },
      { text: 'You must not upload content you do not own or have rights to publish. Stolen works will be removed immediately.', title: 'No Plagiarism', warn: true },
      { text: 'Comic-style drawn violence is permitted within reason. Real photographs or realistic depictions of gore or graphic injury are strictly prohibited.', title: 'Violence Guidelines', warn: false },
    ],
  },
  {
    number: '03',
    title: 'Reader Conduct',
    accentColor: '#34d399',
    sticky: { text: 'be respectful 👍', color: '#86efac', rotate: '-1deg' },
    quote: null,
    items: [
      { text: 'Be respectful in comments and reviews. Harassment, hate speech, or spam directed at creators or readers will result in account action.', title: 'Comments & Reviews', warn: false },
      { text: 'Attempting to bypass, exploit, or share locked chapter content without purchasing is a violation of these terms.', title: 'No Circumventing Locks', warn: true },
      { text: 'If you see content that violates these terms, use the report button. False or malicious reports may result in account suspension.', title: 'Reporting', warn: false },
    ],
  },
  {
    number: '04',
    title: 'Earnings & Payments',
    accentColor: '#f59e0b',
    sticky: { text: 'important!! 💛', color: '#fef08a', rotate: '2deg' },
    quote: '"creators deserve to be paid for their work 💛"',
    items: [
      { text: 'You earn credits when readers purchase your locked chapters. Earnings accumulate in your creator wallet.', title: 'How You Earn', warn: false },
      { text: 'Paper Lantern takes a platform fee from each transaction to cover hosting, payment processing, and maintenance.', title: 'Platform Fee', warn: false },
      { text: 'Earnings are withdrawable once you reach the minimum threshold. Processing times may vary by payment method.', title: 'Withdrawals', warn: false },
      { text: 'Manipulating earnings, generating fake purchases, or exploiting the payment system results in permanent removal and potential legal action.', title: 'No Fraud', warn: true },
    ],
  },
  {
    number: '05',
    title: 'Merchandise Advertising',
    accentColor: '#a78bfa',
    sticky: { text: 'your merch! 🛍️', color: '#c4b5fd', rotate: '-1.5deg' },
    quote: null,
    items: [
      { text: 'You may advertise your own merchandise below chapter images. Ads must be directly related to your published work.', title: "What's Allowed", warn: false },
      { text: 'All ads must be accurate and not misleading. You are responsible for fulfilling any orders from your own store.', title: 'Honest Advertising', warn: false },
      { text: 'Paper Lantern reserves the right to remove any advertisement that violates these guidelines without prior notice.', title: 'Removal Rights', warn: false },
    ],
  },
  {
    number: '06',
    title: 'Intellectual Property',
    accentColor: '#34d399',
    sticky: { text: 'your story, your rights 📝', color: '#86efac', rotate: '1.5deg' },
    quote: '"your story, your rights 📝"',
    items: [
      { text: 'All content you publish remains your intellectual property. Paper Lantern does not claim ownership of your comics or novels.', title: 'You Own Your Work', warn: false },
      { text: 'By publishing, you grant Paper Lantern a non-exclusive license to display, host, and distribute your work on the platform.', title: 'License to Display', warn: false },
      { text: 'You can unpublish or delete your work from your Studio at any time. Removal takes effect within 30 days.', title: 'Removing Your Work', warn: false },
      { text: 'If you believe your copyrighted work was uploaded without permission, contact dev@devorbitstudio.com with proof of ownership.', title: 'DMCA', warn: false },
    ],
  },
  {
    number: '07',
    title: 'Violations & Consequences',
    accentColor: '#fb923c',
    sticky: { text: 'got it? 👍', color: '#fca5a5', rotate: '-2deg' },
    quote: '"we take our community seriously 🛡️"',
    items: [
      { text: 'Minor violations such as low-quality spam or borderline content may result in content removal or a temporary suspension.', title: 'Minor Violations', warn: false },
      { text: 'Uploading real photographs of gore, murder, or graphic violence will result in permanent account removal with no appeal.', title: 'Severe Violations', warn: true },
      { text: 'Any sexual or suggestive content involving minors results in an immediate permanent ban and will be reported to relevant authorities.', title: 'Content Involving Minors', warn: true },
      { text: 'Creating a new account after a permanent ban is itself a violation. All associated accounts will be removed.', title: 'Ban Evasion', warn: true },
    ],
  },
  {
    number: '08',
    title: 'Changes to These Terms',
    accentColor: '#f59e0b',
    sticky: { text: 'stay updated 📢', color: '#fef08a', rotate: '1deg' },
    quote: null,
    items: [
      { text: "Paper Lantern reserves the right to update these terms at any time. Significant changes will be communicated via email or an on-site banner.", title: "We'll Notify You", warn: false },
      { text: 'Continuing to use Paper Lantern after an update means you accept the revised terms.', title: 'Continued Use', warn: false },
      { text: 'For any questions about these terms, reach us at dev@devorbitstudio.com', title: 'Questions', warn: false },
    ],
  },
]

export default function TermsOfService() {
  const navigate = useNavigate()

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Kalam:wght@400;700&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap"
        rel="stylesheet"
      />

      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
        <div className="flex gap-0 mb-4">

          {/* ── Spine ── */}
          <div
            className="w-4 sm:w-6 shrink-0 flex flex-col items-center justify-between py-4 bg-[#080808] border-l border-border"
            style={{ minHeight: '400px' }}
          >
            <span
              className="text-amber-400 text-[8px] sm:text-xsmall tracking-[0.3em] rotate-90 whitespace-nowrap mt-4"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              PAPER LANTERN
            </span>
            <span
              className="text-white/20 text-[8px] sm:text-xsmall tracking-[0.2em] rotate-90 whitespace-nowrap mb-4"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              STUDIO
            </span>
          </div>

          {/* ── Main panel ── */}
          <div
            className="flex-1 min-w-0 border-[2.5px] border-[#1a1a1a] overflow-visible bg-[#fffdf5] dark:bg-[#1c1a17]"
            style={{ boxShadow: '4px 4px 0 #1a1a1a' }}
          >

            {/* Header */}
            <div className="relative border-b-[2.5px] border-[#1a1a1a] px-3 sm:px-5 py-3 sm:py-5 bg-[#fffdf5] dark:bg-[#1c1717] overflow-visible">
              <p
                className="text-[#1a1a1a]/40 dark:text-foreground/40 text-[11px] tracking-[0.1em] mb-1"
                style={{ fontFamily: "'Kalam', cursive" }}
              >
                ◆ OFFICIAL_DOC · EST.2025 · TERMS OF SERVICE
              </p>
              <h1
                className="text-[#1a1a1a] dark:text-foreground leading-none"
                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(26px, 6vw, 42px)', letterSpacing: '0.04em' }}
              >
                TERMS OF SERVICE
              </h1>
              <p
                className="text-[#1a1a1a]/40 dark:text-foreground/40 mt-1 text-[12px] sm:text-small"
                style={{ fontFamily: "'Kalam', cursive" }}
              >
                by using paper lantern, you agree to these terms — last updated 2025
              </p>
              <div
                className="mt-3 h-[2px] opacity-40"
                style={{ background: 'linear-gradient(90deg,#f59e0b,#fbbf24,#f59e0b,#d97706)' }}
              />
            </div>

            {/* TOC bar */}
            <div className="bg-[#1a1a1a] dark:bg-[#2a2825] px-3 sm:px-5 py-3 flex items-center justify-between">
              <span
                className="text-white text-[12px] sm:text-normal tracking-[0.18em]"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                ◆ TABLE OF CONTENTS
              </span>
              <div
                className="px-2 py-1 -rotate-[1.5deg] text-[10px] sm:text-xsmall shrink-0"
                style={{ background: '#86efac', fontFamily: "'Kalam', cursive", color: '#1a1a1a', boxShadow: '1px 2px 4px rgba(0,0,0,0.25)' }}
              >
                8 sections
              </div>
            </div>

            {/* Sections */}
            <div className="divide-y divide-blue-200/30 dark:divide-white/10 relative">
              <div className="hidden sm:block absolute left-10 top-0 bottom-0 w-[1.5px] bg-red-300/50 dark:bg-red-500/20 pointer-events-none z-10" />

              {SECTIONS.map((section, si) => (
                <div
                  key={section.number}
                  className={`relative overflow-visible pt-1 ${si % 2 === 0 ? 'bg-[#fffdf5] dark:bg-[#1c1a17]' : 'bg-[#faf8ee] dark:bg-[#191713]'}`}
                >
                  {/* Sticky note */}
                  <div
                    className="absolute -top-3 right-3 px-2 sm:px-2.5 pt-3 py-1 text-[9px] sm:text-[10px] leading-tight z-20 whitespace-nowrap pointer-events-none"
                    style={{
                      background: section.sticky.color,
                      fontFamily: "'Kalam', cursive",
                      color: '#1a1a1a',
                      boxShadow: '2px 3px 0 rgba(0,0,0,0.2)',
                      transform: `rotate(${section.sticky.rotate})`,
                    }}
                  >
                    {/* Tape */}
                    <div
                      className="absolute -top-2 left-1/2 -translate-x-1/2 w-7 h-3.5 opacity-50"
                      style={{ background: 'rgba(251,191,36,0.45)', border: '1px solid rgba(0,0,0,0.07)' }}
                    />
                    {section.sticky.text}
                  </div>

                  {/* Section header */}
                  <div
                    className="flex items-center gap-2 sm:gap-3 px-3 sm:pl-14 sm:pr-5 py-2.5 border-b border-black/[0.08] dark:border-white/[0.08]"
                    style={{ borderLeft: `3px solid ${section.accentColor}` }}
                  >
                    <span
                      className="text-[#1a1a1a]/35 dark:text-foreground/35 text-[11px] tracking-[0.15em]"
                      style={{ fontFamily: "'Kalam', cursive" }}
                    >
                      [{section.number}]
                    </span>
                    <h2
                      className="text-[#1a1a1a] dark:text-foreground text-[18px] sm:text-[20px]"
                      style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.08em' }}
                    >
                      {section.title}
                    </h2>
                    <div
                      className="flex-1 h-[1px] ml-1 opacity-20 dark:opacity-10"
                      style={{ background: `linear-gradient(90deg, ${section.accentColor}, transparent)` }}
                    />
                  </div>

                  {/* Quote sticky */}
                  {section.quote && (
                    <div className="px-3 sm:pl-14 sm:pr-5 pt-3">
                      <div
                        className="inline-block px-3 py-2 text-[12px] sm:text-[13px]"
                        style={{
                          background: '#fef08a',
                          fontFamily: "'Kalam', cursive",
                          color: '#1a1a1a',
                          transform: 'rotate(-0.5deg)',
                          boxShadow: '2px 2px 0 rgba(0,0,0,0.12)',
                        }}
                      >
                        {section.quote}
                      </div>
                    </div>
                  )}

                  {/* Items */}
                  <div className="px-3 sm:pl-14 sm:pr-5 py-2.5 flex flex-col gap-1.5">
                    {section.items.map((item, ii) => (
                      <div key={ii} className="flex gap-2.5 sm:gap-3 items-start px-2 sm:px-3 py-1.5">
                        <span
                          className="shrink-0 mt-0.5 text-[11px]"
                          style={{
                            fontFamily: "'Kalam', cursive",
                            color: item.warn ? '#92400e' : 'rgba(26,26,26,0.35)',
                          }}
                        >
                          {item.warn ? '!!' : '//'}
                        </span>
                        <p
                          className="text-[12.5px] sm:text-[13px] leading-relaxed"
                          style={{ fontFamily: "'Noto Serif', serif" }}
                        >
                          <span
                            className="mr-1"
                            style={{
                              fontFamily: "'Bebas Neue', sans-serif",
                              fontSize: '13px',
                              letterSpacing: '0.1em',
                              color: item.warn ? '#92400e' : undefined,
                            }}
                          >
                            {item.title} —
                          </span>
                          {item.warn
                            ? <span style={{ color: '#92400e' }}>{item.text}</span>
                            : <span className="text-[#1a1a1a]/75 dark:text-foreground/70">{item.text}</span>
                          }
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Big sticky note closing ── */}
            <div className="px-3 sm:px-5 py-6 flex justify-center bg-[#faf8ee] dark:bg-[#191713] border-t border-black/[0.06] dark:border-white/[0.06]">
              <div
                className="relative w-full max-w-sm px-5 pt-8 pb-6"
                style={{
                  background: '#fef08a',
                  boxShadow: '3px 4px 0 rgba(0,0,0,0.18)',
                  transform: 'rotate(-1.2deg)',
                  fontFamily: "'Kalam', cursive",
                }}
              >
                {/* Tape strip */}
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 opacity-60"
                  style={{ background: 'rgba(251,191,36,0.45)', border: '1px solid rgba(0,0,0,0.08)' }}
                />
                <p
                  className="text-[#1a1a1a] text-[15px] sm:text-[17px] mb-2 leading-none"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.08em' }}
                >
                  THANKS FOR READING
                </p>
                <p className="text-[#1a1a1a]/80 text-[12.5px] sm:text-[13.5px] leading-relaxed">
                  We love our community! Paper Lantern is a safe space for everyone — readers and creators alike. Keep it creative, keep it kind, and we'll have a great time together! 🌟
                </p>
                <p
                  className="mt-3 text-[#1a1a1a]/40 text-[11px]"
                  style={{ fontFamily: "'Kalam', cursive" }}
                >
                  — The Paper Lantern Team 🏮
                </p>
              </div>
            </div>

            {/* Footer bar */}
            <div className="px-3 sm:px-5 py-2.5 flex items-center justify-between border-t-[2px] border-[#1a1a1a] bg-[#fffdf5] dark:bg-[#1c1a17]">
              <span className="text-[#1a1a1a]/25 dark:text-foreground/25 text-[10px] sm:text-xsmall tracking-[0.15em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                TERMS OF SERVICE · V1.0
              </span>
              <button
                onClick={() => navigate(-1)}
                className="text-[#1a1a1a]/35 dark:text-foreground/35 hover:text-[#1a1a1a] dark:hover:text-foreground transition-colors text-[12px]"
                style={{ fontFamily: "'Kalam', cursive", textDecoration: 'underline', textUnderlineOffset: '3px', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ← go back
              </button>
              <span className="text-[#1a1a1a]/20 dark:text-foreground/20 tracking-[0.2em] text-[9px] sm:text-xsmall" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
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
    </>
  )
}