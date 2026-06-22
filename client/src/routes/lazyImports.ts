import { lazy } from 'react'

export const Pages = {
    NotFound: lazy(() => import('@/components/pages/NotFound')),

    //PUBLIC ===================================================
    IndexHome: lazy(() => import('@/features/work/pages/Homepage')),
    SearchWork: lazy(() => import('@/features/work/components/SearchWork')),
    ComicShow: lazy(() => import('@/features/work/pages/WorkOverview')),
    ComicChapter: lazy(() => import('@/features/work/pages/WorkShow')),
    ComicIndex: lazy(() => import('@/features/work/pages/ComicLists')),
    WattpadIndex: lazy(() => import('@/features/work/pages/NovelLists')),
    // FOOTER
    About: lazy(() => import('@/pages/About')),
    Blog: lazy(() => import('@/pages/Blog')),
    PrivacyPolicy: lazy(() => import('@/pages/legal/PrivacyPolicy')),
    TermsAndServices: lazy(() => import('@/pages/legal/TermsAndServices')),
    Cookie: lazy(() => import('@/pages/legal/Cookie')),

    // AUTH ==========================================================
    BecomeCreator: lazy(() => import('@/features/auth/pages/BecomeCreatorForm')),
    Wallet: lazy(() => import('@/features/credits/pages/CreditsPage')),

    //STORY TELLER
    StudioDashboard: lazy(() => import('@/features/studio/pages/work/Index')),
    CreateWork: lazy(() => import('@/features/studio/pages/work/Create')),
    EditWork: lazy(() => import('@/features/studio/pages/work/Edit')),
    ChapterIndex: lazy(() => import('@/features/studio/pages/chapters/Index')),
    ChapterCreate: lazy(() => import('@/features/studio/pages/chapters/Create')),
    ChapterEdit: lazy(() => import('@/features/studio/pages/chapters/Edit')),
    ChapterShow: lazy(() => import('@/features/studio/pages/chapters/Show')),
    StudioEarnings: lazy(() => import('@/features/studio/pages/Earnings')),
    StudioTrash: lazy(() => import('@/features/studio/pages/StudioTrash')),

    // ADMIN
    AdminDashboard: lazy(() => import('@/features/admin/pages/AdminDashboard')),
    AdminUsersList: lazy(() => import('@/features/admin/pages/UsersList')),
    AdminActionLogs: lazy(() => import('@/features/admin/pages/ActionLogs')),
    ModerationPage: lazy(() => import('@/features/admin/pages/ModerationLists')),
    ModerationShow: lazy(() => import('@/features/admin/pages/ModerationShow')),
    ModerationShowWork: lazy(() => import('@/features/admin/pages/ModerationWork')),
    ModerationShowStickyNote: lazy(() => import('@/features/admin/pages/ModerationStickyNote')),
    AdminAnnouncements: lazy(() => import('@/features/admin/pages/Announcements')),
    AdminWithdrawals: lazy(() => import('@/features/admin/pages/Withdrawal')),
    AdminEarnings: lazy(() => import('@/features/admin/pages/Earnings')),
}
