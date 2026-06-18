import { Route } from 'react-router-dom'
import { Suspense } from 'react'
import LoadingPunk from '@/components/loading/LoadingPunk'
import { Pages } from './lazyImports'

///admin/announcements
export const adminRoutes = (
    <>
        <Route path="/admin"                          element={<Suspense fallback={<LoadingPunk />}><Pages.AdminDashboard /></Suspense>} />
        <Route path="/admin/users"                    element={<Suspense fallback={<LoadingPunk />}><Pages.AdminUsersList /></Suspense>} />
        <Route path="/admin/logs"                     element={<Suspense fallback={<LoadingPunk />}><Pages.AdminActionLogs /></Suspense>} />
        <Route path="/admin/withdrawals"              element={<Suspense fallback={<LoadingPunk />}><Pages.AdminWithdrawals /></Suspense>} />
      
        <Route path="/admin/moderation"                      element={<Pages.ModerationPage />} />
        <Route path="/admin/moderation/chapters/:id"         element={<Pages.ModerationShow />} />
        <Route path='/admin/moderation/works/:id'            element={<Pages.ModerationShowWork />} />
        <Route path='/admin/moderation/sticky-notes/:id'     element={<Pages.ModerationShowStickyNote />} />
        <Route path='/admin/announcements'                   element={<Pages.AdminAnnouncements />} />

        <Route path="/admin/earnings"                        element={<Pages.AdminEarnings />} />
    </>
)