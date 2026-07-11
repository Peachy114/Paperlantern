import { lazy } from 'react'

export const Pages = {
    NotFound: lazy(() => import('@/pages/NotFound')),

    //PUBLIC ===================================================
    IndexHome: lazy(() => import('@/features/work/pages/Homepage')),
    SearchWork: lazy(() => import('@/features/work/components/SearchWork')),
    ComicShow: lazy(() => import('@/features/work/pages/WorkOverview')),
    ComicChapter: lazy(() => import('@/features/work/pages/WorkShow')),
    Comix: lazy(() => import('@/features/work/pages/Comix')),
    ExploreArts: lazy(() => import('@/features/arts/pages/ExploreArts')),
    ArtistProfile: lazy(() => import('@/features/artist-profile/pages/ArtistProfile')),
    GoogleCallback: lazy(() => import('@/pages/GoogleCallback')),

    // FOOTER
    About: lazy(() => import('@/pages/about/About')),
    Blog: lazy(() => import('@/pages/Blog')),
    PrivacyPolicy: lazy(() => import('@/pages/legal/privacy/PrivacyPolicy')),
    TermsAndServices: lazy(() => import('@/pages/legal/terms-and-services/TermsAndServices')),
    Cookie: lazy(() => import('@/pages/legal/cookies/Cookie')),

    // AUTH ==========================================================
    BecomeCreator: lazy(() => import('@/features/auth/pages/BecomeCreatorForm')),
    Wallet: lazy(() => import('@/features/credits/pages/CreditsPage')),
    CreditPayment: lazy(() => import('@/features/credits/pages/CreditPaymentPage')),
    Transaction: lazy(() => import('@/features/transactions/TransactionView')),
    Settings: lazy(() => import('@/features/settings/pages/SettingView')),
    ProfileSettings: lazy(() => import('@/features/settings/pages/ProfileSettings')),
    Tickets: lazy(() => import('@/features/tickets/Tickets')),
    TicketShow: lazy(() => import('@/features/tickets/TicketShow')),
    MyArts: lazy(() => import('@/features/arts/pages/MyArts')),
    MyStickers: lazy(() => import('@/features/stickers/pages/MyStickers')),
    Favorites: lazy(() => import('@/features/account/pages/Favorites')),
    MyComments: lazy(() => import('@/features/account/pages/MyComments')),
    History: lazy(() => import('@/features/account/pages/History')),

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
    AdminArts: lazy(() => import('@/features/admin/pages/AdminArts')),
    ModerationPage: lazy(() => import('@/features/admin/pages/ModerationLists')),
    ModerationShow: lazy(() => import('@/features/admin/pages/ModerationShow')),
    ModerationShowWork: lazy(() => import('@/features/admin/pages/ModerationWork')),
    ModerationShowStickyNote: lazy(() => import('@/features/admin/pages/ModerationStickyNote')),
    AdminAnnouncements: lazy(() => import('@/features/admin/pages/Announcements')),
    AdminWithdrawals: lazy(() => import('@/features/admin/pages/Withdrawal')),
    AdminEarnings: lazy(() => import('@/features/admin/pages/Earnings')),
    AdminTickets: lazy(() => import('@/features/admin/tickets/Tickets')),
    AdminTicketShow: lazy(() => import('@/features/admin/tickets/AdminTicketShow')),

    // COMING SOON.
    ComingSoon: lazy(() => import('@/pages/ComingSoon')),
}
