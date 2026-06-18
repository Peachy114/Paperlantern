import { lazy } from "react";

export const Pages = {
    NotFound         : lazy(() => import('@/components/pages/NotFound')),

    //PUBLIC ===================================================
    IndexHome        : lazy(() => import('@/pages/home/Index')),
    SearchWork       : lazy(() => import('@/pages/home/SearchWork')),
    ComicShow        : lazy(() => import('@/pages/home/comics/Show')),
    ComicChapter     : lazy(() => import('@/pages/home/comics/Chapter')),
    ComicIndex       : lazy(() => import('@/pages/home/Comics')),
    WattpadIndex     : lazy(() => import('@/pages/home/Wattpad')),
    // FOOTER
    About            : lazy(() => import('@/pages/About')),
    Blog             : lazy(() => import('@/pages/Blog')),
    PrivacyPolicy    : lazy(() => import('@/pages/PrivacyPolicy')),
    TermsAndServices : lazy(() => import('@/pages/TermsAndServices')),
    Cookie           : lazy(() => import('@/pages/Cookie')),

    // AUTH ==========================================================
    BecomeCreator    : lazy(() => import('@/pages/auth/BecomeCreatorForm')),
    Wallet           : lazy(() => import('@/pages/home/CreditsPage')),

    //STORY TELLER 
    StudioDashboard  : lazy(() => import('@/pages/storyteller/studioDashboard/Index')),
    CreateWork       : lazy(() => import('@/pages/storyteller/studioDashboard/Create')),
    EditWork         : lazy(() => import('@/pages/storyteller/studioDashboard/Edit')),
    ChapterIndex     : lazy(() => import('@/pages/storyteller/chapter/Index')),
    ChapterCreate    : lazy(() => import('@/pages/storyteller/chapter/Create')),
    ChapterEdit      : lazy(() => import('@/pages/storyteller/chapter/Edit')),
    ChapterShow      : lazy(() => import('@/pages/storyteller/chapter/Show')),
    StudioEarnings   : lazy(() => import('@/pages/storyteller/Earnings/Index')),

    // ADMIN 
    AdminDashboard            : lazy(() => import('@/pages/superAdmin/Index')),
    AdminUsersList            : lazy(() => import('@/pages/superAdmin/UsersList')),
    AdminActionLogs           : lazy(() => import('@/pages/superAdmin/ActionLogs')),
    ModerationPage            : lazy(() => import('@/pages/superAdmin/Moderation')),
    ModerationShow            : lazy(() => import('@/pages/superAdmin/ModerationShow')),
    ModerationShowWork        : lazy(() => import('@/pages/superAdmin/ModerationShowWork')),
    ModerationShowStickyNote  : lazy(() => import('@/pages/superAdmin/ModerationShowStickyNote')),
    AdminAnnouncements        : lazy(() => import('@/pages/superAdmin/Announcements/Index')),
    AdminWithdrawals          : lazy(() => import('@/pages/superAdmin/Withdrawal/Index')),
    AdminEarnings             : lazy(() => import('@/pages/superAdmin/Earnings/Index')),
}