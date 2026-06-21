import { Route } from 'react-router-dom'
import { Suspense } from 'react'
import { Pages } from './lazyImports'
import LoadingPunk from '@/components/shared/loading/LoadingPunk'

export const storytellerRoutes = (
    <>
        <Route
            path="/studio"
            element={
                <Suspense fallback={<LoadingPunk />}>
                    <Pages.StudioDashboard />
                </Suspense>
            }
        />
        <Route
            path="/studio/create"
            element={
                <Suspense fallback={<LoadingPunk />}>
                    <Pages.CreateWork />
                </Suspense>
            }
        />
        <Route
            path="/studio/works/:id/edit"
            element={
                <Suspense fallback={<LoadingPunk />}>
                    <Pages.EditWork />
                </Suspense>
            }
        />
        <Route
            path="/studio/works/:workId/chapters"
            element={
                <Suspense fallback={<LoadingPunk />}>
                    <Pages.ChapterIndex />
                </Suspense>
            }
        />
        <Route
            path="/studio/works/:workId/chapters/create"
            element={
                <Suspense fallback={<LoadingPunk />}>
                    <Pages.ChapterCreate />
                </Suspense>
            }
        />
        <Route
            path="/studio/works/:workId/chapters/:id/show"
            element={
                <Suspense fallback={<LoadingPunk />}>
                    <Pages.ChapterShow />
                </Suspense>
            }
        />
        <Route
            path="/studio/works/:workId/chapters/:id/edit"
            element={
                <Suspense fallback={<LoadingPunk />}>
                    <Pages.ChapterEdit />
                </Suspense>
            }
        />
        <Route path="/studio/earnings" element={<Pages.StudioEarnings />} />
    </>
)
