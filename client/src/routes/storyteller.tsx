//STORYTELLER ROUTES
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
            path="/studio/works/:slug/edit"
            element={
                <Suspense fallback={<LoadingPunk />}>
                    <Pages.EditWork />
                </Suspense>
            }
        />
        <Route
            path="/studio/works/:workSlug/chapters"
            element={
                <Suspense fallback={<LoadingPunk />}>
                    <Pages.ChapterIndex />
                </Suspense>
            }
        />
        <Route
            path="/studio/works/:workSlug/chapters/create"
            element={
                <Suspense fallback={<LoadingPunk />}>
                    <Pages.ChapterCreate />
                </Suspense>
            }
        />
        <Route
            path="/studio/works/:workSlug/chapters/:chapterSlug/show"
            element={
                <Suspense fallback={<LoadingPunk />}>
                    <Pages.ChapterShow />
                </Suspense>
            }
        />
        <Route
            path="/studio/works/:workSlug/chapters/:chapterSlug/edit"
            element={
                <Suspense fallback={<LoadingPunk />}>
                    <Pages.ChapterEdit />
                </Suspense>
            }
        />
        <Route path="/studio/earnings" element={<Pages.StudioEarnings />} />
        <Route
            path="/studio/trash"
            element={
                <Suspense fallback={<LoadingPunk />}>
                    <Pages.StudioTrash />
                </Suspense>
            }
        />
    </>
)
