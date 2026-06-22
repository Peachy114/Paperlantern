//PUBLIC ROUTES
import { Route } from 'react-router-dom'
import { Suspense } from 'react'
import { Pages } from './lazyImports'
import LoadingHomePage from '@/components/shared/loading/loadingHomePage'

export const publicRoutes = (
    <>
        <Route
            path="/"
            element={
                <Suspense fallback={<LoadingHomePage />}>
                    <Pages.IndexHome />
                </Suspense>
            }
        />
        <Route path="/search" element={<Pages.SearchWork />} />
        <Route
            path="/all-comics"
            element={
                <Suspense fallback={<LoadingHomePage />}>
                    <Pages.ComicIndex />
                </Suspense>
            }
        />
        <Route
            path="/all-wattpad"
            element={
                <Suspense fallback={<LoadingHomePage />}>
                    <Pages.WattpadIndex />
                </Suspense>
            }
        />
        <Route
            path="/comics/:slug"
            element={
                <Suspense fallback={<LoadingHomePage />}>
                    <Pages.ComicShow />
                </Suspense>
            }
        />
        <Route
            path="/comics/:slug/chapters/:chapterSlug"
            element={
                <Suspense fallback={<LoadingHomePage />}>
                    <Pages.ComicChapter />
                </Suspense>
            }
        />
        <Route
            path="/about"
            element={
                <Suspense fallback={<LoadingHomePage />}>
                    <Pages.About />
                </Suspense>
            }
        />
        <Route
            path="/blog"
            element={
                <Suspense fallback={<LoadingHomePage />}>
                    <Pages.Blog />
                </Suspense>
            }
        />
        <Route
            path="/privacy-policy"
            element={
                <Suspense fallback={<LoadingHomePage />}>
                    <Pages.PrivacyPolicy />
                </Suspense>
            }
        />
        <Route
            path="/terms-and-services"
            element={
                <Suspense fallback={<LoadingHomePage />}>
                    <Pages.TermsAndServices />
                </Suspense>
            }
        />
        <Route
            path="/cookies"
            element={
                <Suspense fallback={<LoadingHomePage />}>
                    <Pages.Cookie />
                </Suspense>
            }
        />
        <Route
            path="/become-creator"
            element={
                <Suspense fallback={<LoadingHomePage />}>
                    <Pages.BecomeCreator />
                </Suspense>
            }
        />

        <Route
            path="/credits"
            element={
                <Suspense fallback={<LoadingHomePage />}>
                    <Pages.Wallet />
                </Suspense>
            }
        />

        <Route
            path="*"
            element={
                <Suspense fallback={<LoadingHomePage />}>
                    <Pages.NotFound />
                </Suspense>
            }
        />
    </>
)
