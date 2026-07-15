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
            path="/admin/tickets"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.AdminTickets />
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
            path="/admin/arts"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.AdminArts />
                </Suspense>
            }
        />
        <Route
            path="/admin/commission-applications"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.AdminCommissionApplications />
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
        <Route
            path="/admin/payout-requests"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.AdminWithdrawals />
                </Suspense>
            }
        />

        <Route
            path="/admin/tickets/:id"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.AdminTicketShow />
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
        <Route path="/admin/top-up-settings" element={<Pages.AdminTopUpSettings />} />
        <Route path="/admin/labeling" element={<Pages.AdminLabeling />} />
        <Route path="/admin/customize" element={<Pages.AdminPageCustomizer />} />
        <Route path="/admin/noble-royalty" element={<Pages.AdminNobleRoyalty />} />
    </>
)
