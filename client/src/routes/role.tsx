import { Route } from 'react-router-dom'
import RoleLayout from '@/layouts/RoleLayout'
import { adminRoutes } from './admin'
import { storytellerRoutes } from './storyteller'



export const roleRoutes = (
    <>
        <Route element={<RoleLayout roles={['storyteller']} />}>{storytellerRoutes}</Route>
        <Route element={<RoleLayout roles={['super_admin']} />}>{adminRoutes}</Route>
    </>
)