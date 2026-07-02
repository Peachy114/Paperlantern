//PUBLIC ROUTES
import { Route } from 'react-router-dom'
import { Suspense } from 'react'
import { Pages } from './lazyImports'
import Loading from '@/components/shared/Loading'

export const publicRoutes = (
    <>
        <Route
            path="/"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.IndexHome />
                </Suspense>
            }
        />
        <Route path="/search" element={<Pages.SearchWork />} />
        <Route
            path="/comix"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.Comix />
                </Suspense>
            }
        />
        <Route
            path="/works/:slug"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.ComicShow />
                </Suspense>
            }
        />
        <Route
            path="/works/:slug/chapters/:chapterSlug"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.ComicChapter />
                </Suspense>
            }
        />
        <Route
            path="/about"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.About />
                </Suspense>
            }
        />
        <Route
            path="/blog"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.Blog />
                </Suspense>
            }
        />
        <Route
            path="/privacy-policy"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.PrivacyPolicy />
                </Suspense>
            }
        />
        <Route
            path="/terms-and-services"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.TermsAndServices />
                </Suspense>
            }
        />
        <Route
            path="/cookies"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.Cookie />
                </Suspense>
            }
        />
        <Route
            path="/become-creator"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.BecomeCreator />
                </Suspense>
            }
        />

        <Route
            path="*"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.NotFound />
                </Suspense>
            }
        />

        <Route
            path="/auth/callback"
            element={
                <Suspense fallback={<Loading />}>
                    <Pages.GoogleCallback />
                </Suspense>
            }
        />
    </>
)
