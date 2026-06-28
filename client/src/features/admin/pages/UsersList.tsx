import { useAdminUsers } from '@/features/admin/hooks/useAdminUsers'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

const FONTS =
    'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Kalam:wght@400;700&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap'

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
    wanderer: { label: 'Wanderer', className: 'bg-sky-100 text-sky-800' },
    storyteller: { label: 'Storyteller', className: 'bg-indigo-100 text-indigo-800' },
    super_admin: { label: 'Super Admin', className: 'bg-red-100 text-red-800' },
}

const ADMIN_ROLES = ['super_admin']

function UserRow({
    user,
    index,
    actionLoading,
    banUser,
    unbanUser,
    setConfirmDelete,
}: {
    user: any
    index: number
    actionLoading: any
    banUser: (id: string) => void
    unbanUser: (id: string) => void
    setConfirmDelete: (id: string) => void
}) {
    const badge = ROLE_BADGE[user.role] ?? {
        label: user.role,
        className: 'bg-gray-100 text-gray-600',
    }
    const isLoading = actionLoading === user.id

    return (
        <div
            className={`relative flex items-center gap-2 sm:gap-3 px-3 sm:pl-14 sm:pr-4 py-3 transition-colors duration-100 hover:bg-amber-400/[0.07] ${
                user.is_banned ? 'opacity-60' : ''
            } ${index % 2 === 0 ? 'bg-[#fffdf5] dark:bg-[#1c1a17]' : 'bg-[#faf8ee] dark:bg-[#191713]'}`}
        >
            <span
                className="hidden sm:block absolute left-0 w-10 text-right pr-2.5 text-[#1a1a1a]/20 dark:text-foreground/20 text-xsmall"
                style={{ fontFamily: "'Kalam', cursive" }}
            >
                {String(index + 1).padStart(2, '0')}
            </span>

            {/* Avatar */}
            <div className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 bg-[#1a1a1a] border border-black/10 flex items-center justify-center">
                <span
                    className="text-amber-400 text-[14px]"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                    {user.name.charAt(0).toUpperCase()}
                </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-start">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <div
                        className="text-[#1a1a1a] dark:text-foreground text-[13px] sm:text-normal truncate"
                        style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}
                    >
                        {user.name}
                    </div>
                    {user.is_banned && (
                        <span
                            className="text-[9px] px-1.5 py-0.5 bg-red-100 text-red-700"
                            style={{ fontFamily: "'Kalam', cursive" }}
                        >
                            BANNED
                        </span>
                    )}
                    {!user.is_banned && user.strike_count > 0 && (
                        <span
                            className="text-[9px] px-1.5 py-0.5"
                            style={{
                                background: user.strike_count === 1 ? '#86efac' : '#fbbf24',
                                fontFamily: "'Kalam', cursive",
                                color: '#1a1a1a',
                            }}
                        >
                            ⚠️ {user.strike_count}/3 strikes
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span
                        className="text-[#1a1a1a]/40 dark:text-foreground/40 text-[10px]"
                        style={{ fontFamily: "'Kalam', cursive" }}
                    >
                        @{user.username}
                    </span>
                    <span className="text-[#1a1a1a]/20 text-[10px]">·</span>
                    <span
                        className={`text-[10px] px-1.5 py-0.5 ${badge.className}`}
                        style={{ fontFamily: "'Kalam', cursive" }}
                    >
                        {badge.label}
                    </span>
                    <span className="text-[#1a1a1a]/20 text-[10px]">·</span>
                    <span
                        className="text-[#1a1a1a]/40 dark:text-foreground/40 text-[10px]"
                        style={{ fontFamily: "'Noto Serif', serif" }}
                    >
                        {user.works_count} works
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
                {user.is_banned ? (
                    <button
                        onClick={() => unbanUser(user.id)}
                        disabled={isLoading}
                        className="border-[2px] border-green-400 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/40 transition-colors px-2 py-1 text-[10px] sm:text-xsmall disabled:opacity-50 cursor-pointer"
                        style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
                    >
                        UNBAN
                    </button>
                ) : (
                    <button
                        onClick={() => banUser(user.id)}
                        disabled={isLoading || user.role === 'super_admin'}
                        className="border-[2px] border-yellow-400 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950/40 transition-colors px-2 py-1 text-[10px] sm:text-xsmall disabled:opacity-50 cursor-pointer"
                        style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
                    >
                        BAN
                    </button>
                )}
                <button
                    onClick={() => setConfirmDelete(user.id)}
                    disabled={isLoading || user.role === 'super_admin'}
                    className="border-[2px] border-red-300 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors px-2 py-1 text-[10px] sm:text-xsmall disabled:opacity-50 cursor-pointer"
                    style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
                >
                    DELETE
                </button>
            </div>
        </div>
    )
}

function SectionHeader({ label, count, tag }: { label: string; count: number; tag?: string }) {
    return (
        <div className="bg-[#1a1a1a] dark:bg-[#2a2825] px-3 sm:pl-14 sm:pr-5 py-3 flex items-center justify-between border-b-[2px] border-[#1a1a1a]">
            <span
                className="text-white text-[12px] tracking-[0.18em]"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
                ◆ {label}
            </span>
            <div
                className="px-2 py-1 -rotate-[1.5deg] text-[10px]"
                style={{
                    background: '#fca5a5',
                    fontFamily: "'Kalam', cursive",
                    color: '#1a1a1a',
                    boxShadow: '1px 2px 4px rgba(0,0,0,0.25)',
                }}
            >
                {tag ?? `${count} total`}
            </div>
        </div>
    )
}

export default function AdminUsersList() {
    const { users, actionLoading, banUser, unbanUser, deleteUser } = useAdminUsers()
    const navigate = useNavigate()
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

    const handleDelete = async (id: string) => {
        await deleteUser(id)
        setConfirmDelete(null)
    }

    const admins = users.filter((u) => ADMIN_ROLES.includes(u.role))
    const regularUsers = users.filter((u) => !ADMIN_ROLES.includes(u.role))

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
                            LATER N COMIX
                        </span>
                        <span
                            className="text-white/30 text-[8px] sm:text-xsmall tracking-[0.2em] rotate-90 whitespace-nowrap mb-4"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            USERS
                        </span>
                    </div>

                    {/* Main */}
                    <div
                        className="flex-1 min-w-0 border-[2.5px] border-[#1a1a1a] overflow-hidden bg-[#fffdf5] dark:bg-[#1c1a17]"
                        style={{ boxShadow: '4px 4px 0 #1a1a1a' }}
                    >
                        {/* Header */}
                        <div className="border-b-[2.5px] border-[#000000] px-3 sm:px-5 py-3 sm:py-5 flex items-center justify-between bg-[#1a1a1a]">
                            <div>
                                <button
                                    onClick={() => navigate('/admin')}
                                    className="text-white/30 hover:text-white text-[11px] mb-1 transition-colors"
                                    style={{ fontFamily: "'Kalam', cursive" }}
                                >
                                    ← Back to Admin
                                </button>
                                <h1
                                    className="text-red-400 leading-none"
                                    style={{
                                        fontFamily: "'Bebas Neue', sans-serif",
                                        fontSize: 'clamp(26px, 6vw, 38px)',
                                        letterSpacing: '0.04em',
                                    }}
                                >
                                    USER MANAGEMENT
                                </h1>
                                <p
                                    className="text-white/30 mt-1 text-[12px]"
                                    style={{ fontFamily: "'Kalam', cursive" }}
                                >
                                    {users.length} registered users
                                </p>
                            </div>
                        </div>

                        {/* ── Admins Section ── */}
                        <SectionHeader
                            label="ADMINS"
                            count={admins.length}
                            tag={`${admins.length} admin${admins.length !== 1 ? 's' : ''}`}
                        />
                        <div className="divide-y divide-blue-200/30 dark:divide-white/10 relative">
                            <div className="hidden sm:block absolute left-10 top-0 bottom-0 w-[1.5px] bg-red-300/60 dark:bg-red-400/20 pointer-events-none z-10" />
                            {admins.length === 0 ? (
                                <div
                                    className="px-3 sm:pl-14 py-4 text-[11px] text-[#1a1a1a]/30 dark:text-foreground/30"
                                    style={{ fontFamily: "'Kalam', cursive" }}
                                >
                                    No admins found.
                                </div>
                            ) : (
                                admins.map((user, i) => (
                                    <UserRow
                                        key={user.id}
                                        user={user}
                                        index={i}
                                        actionLoading={actionLoading}
                                        banUser={banUser}
                                        unbanUser={unbanUser}
                                        setConfirmDelete={setConfirmDelete}
                                    />
                                ))
                            )}
                        </div>

                        {/* ── All Users Section ── */}
                        <SectionHeader
                            label="ALL USERS"
                            count={regularUsers.length}
                            tag={`${regularUsers.filter((u) => u.is_banned).length} banned`}
                        />
                        <div className="divide-y divide-blue-200/30 dark:divide-white/10 relative">
                            <div className="hidden sm:block absolute left-10 top-0 bottom-0 w-[1.5px] bg-red-300/60 dark:bg-red-400/20 pointer-events-none z-10" />
                            {regularUsers.length === 0 ? (
                                <div
                                    className="px-3 sm:pl-14 py-4 text-[11px] text-[#1a1a1a]/30 dark:text-foreground/30"
                                    style={{ fontFamily: "'Kalam', cursive" }}
                                >
                                    No users found.
                                </div>
                            ) : (
                                regularUsers.map((user, i) => (
                                    <UserRow
                                        key={user.id}
                                        user={user}
                                        index={i}
                                        actionLoading={actionLoading}
                                        banUser={banUser}
                                        unbanUser={unbanUser}
                                        setConfirmDelete={setConfirmDelete}
                                    />
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-3 sm:pl-14 sm:pr-5 py-2.5 flex items-center justify-between border-t-[2px] border-[#1a1a1a] bg-[#fffdf5] dark:bg-[#1c1a17]">
                            <span
                                className="text-[#1a1a1a]/30 dark:text-foreground/30 text-[10px]"
                                style={{ fontFamily: "'Kalam', cursive" }}
                            >
                                {users.length} users total
                            </span>
                            <span
                                className="text-[#1a1a1a]/20 tracking-[0.2em] text-[9px]"
                                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                            >
                                LATER N COMIX ADMIN
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Confirm Delete Modal ── */}
            {confirmDelete !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div
                        className="w-full max-w-sm border-[3px] border-foreground bg-[#fffdf5] dark:bg-[#1e1b14] p-6 text-center"
                        style={{ boxShadow: '7px 7px 0 var(--foreground)' }}
                    >
                        <p
                            className="text-[16px] tracking-[0.08em] text-foreground mb-2"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            DELETE USER?
                        </p>
                        <p className="text-[12px] text-muted-foreground font-sans mb-5">
                            This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => handleDelete(confirmDelete)}
                                disabled={actionLoading === confirmDelete}
                                className="px-5 py-1.5 border-2 border-[#F09595] bg-[#F09595] text-white text-[12px] tracking-[0.12em] hover:opacity-80 disabled:opacity-50"
                                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                            >
                                {actionLoading === confirmDelete ? 'DELETING...' : 'DELETE'}
                            </button>
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="px-5 py-1.5 border-2 border-foreground text-foreground text-[12px] tracking-[0.12em] hover:bg-foreground/5"
                                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                            >
                                CANCEL
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
