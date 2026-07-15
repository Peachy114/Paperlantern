import { Suspense } from 'react'
import { Route } from 'react-router-dom'
import RoleLayout from '@/layouts/RoleLayout'
import { adminRoutes } from './admin'
import { storytellerRoutes } from './storyteller'
import Loading from '@/components/shared/Loading'
import { Pages } from './lazyImports'

export const roleRoutes = (
    <>
        <Route element={<RoleLayout roles={['storyteller']} />}>{storytellerRoutes}</Route>
        <Route element={<RoleLayout roles={['super_admin']} />}>{adminRoutes}</Route>

        {/* ROUTES FOR AUTH */}
        <Route
            path="/settings"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.Settings />
                </Suspense>
            }
        />
        <Route
            path="/transaction"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.Transaction />
                </Suspense>
            }
        />
        <Route
            path="/expenses"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.Transaction />
                </Suspense>
            }
        />
        <Route
            path="/earnings"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.Earnings />
                </Suspense>
            }
        />
        <Route
            path="/withdrawals"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.Withdrawals />
                </Suspense>
            }
        />
        <Route
            path="/favorites"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.Favorites />
                </Suspense>
            }
        />
        <Route
            path="/comments"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.MyComments />
                </Suspense>
            }
        />
        <Route
            path="/history"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.History />
                </Suspense>
            }
        />
        <Route
            path="/stickers"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.MyStickers />
                </Suspense>
            }
        />
        <Route
            path="/noble-royalty"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.NobleRoyalty />
                </Suspense>
            }
        />
        <Route
            path="/subscriptions"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.Subscriptions />
                </Suspense>
            }
        />
        <Route
            path="/credits"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.Wallet />
                </Suspense>
            }
        />
        <Route
            path="/notifications"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.Notifications />
                </Suspense>
            }
        />
        <Route
            path="/feeds"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.Feeds />
                </Suspense>
            }
        />
        <Route
            path="/credits/payment/:paymentId"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.CreditPayment />
                </Suspense>
            }
        />
        <Route
            path="/commission"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.MyCommission />
                </Suspense>
            }
        />
        <Route
            path="/messages"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.Messages />
                </Suspense>
            }
        />

        <Route
            path="/settings/profile"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.ProfileSettings />
                </Suspense>
            }
        />
        <Route
            path="/settings/payments"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.PaymentSettings />
                </Suspense>
            }
        />

        <Route
            path="/tickets"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.Tickets />
                </Suspense>
            }
        />

        <Route
            path="/tickets/:id"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.TicketShow />
                </Suspense>
            }
        />
    </>
)
