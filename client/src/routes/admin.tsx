//ADMIN ROUTES
import { Route } from 'react-router-dom'
import { Suspense } from 'react'
import Loading from '@/components/shared/Loading'
import { Pages } from './lazyImports'

///admin/announcements
export const adminRoutes = (
    <>
        <Route
            path="/admin"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.AdminDashboard />
                </Suspense>
            }
        />
        <Route
            path="/admin/users"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.AdminUsersList />
                </Suspense>
            }
        />
        <Route
            path="/admin/logs"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.AdminActionLogs />
                </Suspense>
            }
        />
        <Route
            path="/admin/withdrawals"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.AdminWithdrawals />
                </Suspense>
            }
        />

        <Route path="/admin/moderation" element={<Pages.ModerationPage />} />
        <Route path="/admin/moderation/chapters/:chapterSlug" element={<Pages.ModerationShow />} />
        <Route path="/admin/moderation/works/:workSlug" element={<Pages.ModerationShowWork />} />
        <Route
            path="/admin/moderation/sticky-notes/:id"
            element={<Pages.ModerationShowStickyNote />}
        />
        <Route path="/admin/announcements" element={<Pages.AdminAnnouncements />} />
        <Route path="/admin/earnings" element={<Pages.AdminEarnings />} />
    </>
)
