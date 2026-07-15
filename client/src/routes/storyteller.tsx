//STORYTELLER ROUTES
import { Route } from 'react-router-dom'
import { Suspense } from 'react'
import { Pages } from './lazyImports'
import Loading from '@/components/shared/Loading'

export const storytellerRoutes = (
    <>
        <Route
            path="/studio"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.StudioDashboard />
                </Suspense>
            }
        />
        <Route
            path="/arts"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.MyArts />
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
            path="/studio/create"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.CreateWork />
                </Suspense>
            }
        />
        <Route
            path="/studio/works/:slug/edit"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.EditWork />
                </Suspense>
            }
        />
        <Route
            path="/studio/works/:workSlug/chapters"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.ChapterIndex />
                </Suspense>
            }
        />
        <Route
            path="/studio/works/:workSlug/chapters/create"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.ChapterCreate />
                </Suspense>
            }
        />
        <Route
            path="/studio/works/:workSlug/chapters/:chapterSlug/show"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.ChapterShow />
                </Suspense>
            }
        />
        <Route
            path="/studio/works/:workSlug/chapters/:chapterSlug/edit"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.ChapterEdit />
                </Suspense>
            }
        />
        <Route
            path="/studio/trash"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.StudioTrash />
                </Suspense>
            }
        />
    </>
)
