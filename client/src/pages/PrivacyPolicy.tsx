// import { motion } from 'framer-motion'

const SECTIONS = [
  {
    number: '01',
    title: 'Data We Collect',
    accentColor: '#f59e0b',
    sticky: { text: 'good to know 📖', color: '#fef08a', rotate: '-2deg' },
    items: [
      { text: 'Your name, username, email address, and password. Passwords are hashed — we never store or see them in plain text.', warn: false },
      { text: 'Bookmarks, reading history, liked chapters, and your progress on stories you follow.', warn: false },
      { text: 'Comments and reviews you leave are stored and visible to other users on the platform.', warn: false },
      { text: 'Browser type, device, and IP address are collected automatically when you visit Paper Lantern.', warn: false },
    ],
  },
  {
    number: '02',
    title: 'How We Use It',
    accentColor: '#f472b6',
    sticky: { text: 'only what we need 🏮', color: '#ffbacf', rotate: '1.5deg' },
    items: [
      { text: 'To manage your account, display your reading history, and keep all features working smoothly.', warn: false },
      { text: 'To notify you when a story you follow gets a new chapter — only if you opt in.', warn: false },
      { text: 'To detect spam, enforce policy violations, and keep the community a safe place for everyone.', warn: false },
      { text: 'To suggest comics and novels based on what you read and save.', warn: false },
    ],
  },
  {
    number: '03',
    title: "What's Public vs Private",
    accentColor: '#34d399',
    sticky: { text: 'check this one! 👀', color: '#86efac', rotate: '-1deg' },
    items: [
      { text: 'PUBLIC — Your username, comments, reviews, and any profile info you choose to display are visible to all users.', warn: false },
      { text: 'PRIVATE — Your email address, password, IP address, and payment info are never visible to other users.', warn: false },
      { text: 'We will never publicly display your private information without your explicit consent.', warn: true },
    ],
  },
  {
    number: '04',
    title: 'Creator Accounts',
    accentColor: '#a78bfa',
    sticky: { text: 'your work = yours 🎨', color: '#c4b5fd', rotate: '2deg' },
    items: [
      { text: 'Everything you publish belongs to you. Paper Lantern only has a license to display your work on the platform.', warn: false },
      { text: 'If you delete your account, your published works will be removed from public view within 30 days.', warn: false },
      { text: 'Transaction history and withdrawal records are kept for up to 2 years for accounting and dispute purposes.', warn: false },
    ],
  },
  {
    number: '05',
    title: 'Cookies',
    accentColor: '#fb923c',
    sticky: { text: 'just the basics 🍪', color: '#ffc6a6', rotate: '-1.5deg' },
    items: [
      { text: 'Session cookies keep you logged in between visits. Without them you would need to log in every page.', warn: false },
      { text: 'Preference cookies save your dark mode setting so the site looks right every time you return.', warn: false },
      { text: 'We do not use third-party advertising cookies. We do not sell your data. Ever.', warn: true },
    ],
  },
  {
    number: '06',
    title: 'Your Rights',
    accentColor: '#38bdf8',
    sticky: { text: "you're in control 🔑", color: '#bae6fd', rotate: '1deg' },
    items: [
      { text: 'You can request a copy of the data we hold about you at any time by contacting us.', warn: false },
      { text: 'You can update your username, email, and profile directly from your account settings.', warn: false },
      { text: 'You can delete your account from settings. Your personal data will be removed within 30 days.', warn: false },
      { text: 'For any privacy requests, reach us at privacy@paperlantern.app', warn: false },
    ],
  },
  {
    number: '07',
    title: 'DMCA & Copyright',
    accentColor: '#f87171',
    sticky: { text: 'no stolen work 🚫', color: '#fca5a5', rotate: '-2deg' },
    items: [
      { text: 'If you believe your work has been uploaded without permission, contact us and we will investigate promptly.', warn: false },
      { text: 'Accounts found repeatedly uploading stolen content will be permanently removed with no appeal.', warn: true },
      { text: 'Send DMCA takedown requests to dmca@paperlantern.app with proof of ownership.', warn: false },
    ],
  },
  {
    number: '08',
    title: 'Security',
    accentColor: '#4ade80',
    sticky: { text: 'we keep you safe 🔐', color: '#86efac', rotate: '1.5deg' },
    items: [
      { text: 'All passwords are hashed using industry-standard encryption. We cannot see your password in plain text.', warn: false },
      { text: 'All data between you and Paper Lantern is encrypted in transit via HTTPS.', warn: false },
      { text: 'If a data breach occurs, we will notify affected users within 72 hours.', warn: false },
    ],
  },
]

export default function PrivacyPolicy() {
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
              PRIVACY
            </span>
          </div>

          {/* ── Main panel ── */}
          <div
            className="flex-1 min-w-0 border-r border-[2.5px] border-[#202020] overflow-visible bg-[#fffdf5] dark:bg-[#1c1a17]"
            style={{ boxShadow: '4px 4px 0 #1a1a1a' }}
          >

            {/* Header */}
            <div className="relative border-b-[2.5px] border-[#1a1a1a] px-3 sm:px-5 py-3 sm:py-5 bg-[#fffdf5] dark:bg-[#1c1717]">
              <p
                className="text-[#1a1a1a]/40 dark:text-foreground/40 text-[11px] tracking-[0.1em] mb-1"
                style={{ fontFamily: "'Kalam', cursive" }}
              >
                ◆ OFFICIAL_DOC · EST.2025 · PRIVACY POLICY
              </p>
              <h1
                className="text-[#1a1a1a] dark:text-foreground leading-none"
                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(26px, 6vw, 42px)', letterSpacing: '0.04em' }}
              >
                PRIVACY POLICY
              </h1>
              <p
                className="text-[#1a1a1a]/40 dark:text-foreground/40 mt-1 text-[12px] sm:text-small"
                style={{ fontFamily: "'Kalam', cursive" }}
              >
                your data is yours — here's exactly how we handle it
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
                style={{ background: '#bae6fd', fontFamily: "'Kalam', cursive", color: '#1a1a1a', boxShadow: '1px 2px 4px rgba(0,0,0,0.25)' }}
              >
                8 sections
              </div>
            </div>

            {/* Sections */}
            <div className="divide-y divide-blue-200/30 dark:divide-white/10 relative">
              <div className="hidden sm:block absolute left-10 top-0 bottom-0 w-[1.5px] bg-amber-300/50 dark:bg-amber-400/20 pointer-events-none z-10" />

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
                          style={{
                            fontFamily: "'Noto Serif', serif",
                            color: item.warn ? '#92400e' : undefined,
                          }}
                        >
                          {item.warn
                            ? item.text
                            : <span className="text-[#1a1a1a]/75 dark:text-foreground/70">{item.text}</span>
                          }
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Policy Changes note ── */}
            <div className="px-3 sm:px-5 py-6 flex justify-center bg-[#faf8ee] dark:bg-[#191713] border-t border-black/[0.06] dark:border-white/[0.06]">
              <div
                className="relative w-full max-w-sm px-5 pt-8 pb-6"
                style={{
                  background: '#fef08a',
                  boxShadow: '3px 4px 0 rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.1)',
                  transform: 'rotate(-1.2deg)',
                  fontFamily: "'Kalam', cursive",
                }}
              >
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 opacity-60"
                  style={{ background: 'rgba(251,191,36,0.45)', border: '1px solid rgba(0,0,0,0.08)' }}
                />
                <p
                  className="text-[#1a1a1a] text-[15px] sm:text-[17px] mb-2 leading-none"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.08em' }}
                >
                  POLICY CHANGES
                </p>
                <p className="text-[#1a1a1a]/80 text-[12.5px] sm:text-[13.5px] leading-relaxed">
                  If we make significant changes, we'll notify you via email or a banner on the site. Continued use of Paper Lantern after changes means you accept the updated policy. Questions? Contact us at <strong>dev@devorbitstudio.com</strong>
                </p>
                <p
                  className="mt-3 text-[#1a1a1a]/40 text-[11px]"
                  style={{ fontFamily: "'Kalam', cursive" }}
                >
                  — The Paper Lantern Team
                </p>
              </div>
            </div>

            {/* Footer bar */}
            <div className="px-3 sm:px-5 py-2.5 flex items-center justify-between border-t-[2px] border-[#1a1a1a] bg-[#fffdf5] dark:bg-[#1c1a17]">
              <span className="text-[#1a1a1a]/25 dark:text-foreground/25 text-[10px] sm:text-xsmall tracking-[0.15em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                PRIVACY POLICY · V1.0
              </span>
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