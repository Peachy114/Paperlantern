import { Routes, Route } from 'react-router-dom'
import { Suspense } from 'react'
import PublicLayout from '@/layouts/PublicLayout'
import AuthLayout from '@/layouts/AuthLayout'
import { publicRoutes } from './public'
import { roleRoutes } from './role'
import Loading from '@/components/shared/Loading'

export default function AppRoutes() {
    return (
        <Suspense fallback={<Loading />}>
            <Routes>
                <Route element={<PublicLayout />}>{publicRoutes}</Route>
                <Route element={<AuthLayout />}>{roleRoutes}</Route>
            </Routes>
        </Suspense>
    )
}
