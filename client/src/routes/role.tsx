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
            path="/credits"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.Wallet />
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
            path="/artworks"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.ComingSoon />
                </Suspense>
            }
        />
    </>
)
