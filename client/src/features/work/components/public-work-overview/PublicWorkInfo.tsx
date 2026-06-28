import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import PublicWorkCover from './public-work-Info/PublicWorkCover'
import PublicWorkTags from './public-work-Info/PublicWorkTags'
import PublicWorkDescription from './public-work-Info/PublicWorkDescription'
import PublicWorkStats from './public-work-Info/PublicWorkStats'
import PublicWorkTitle from './public-work-Info/PublicWorkTitle'

interface PublicWorkInfoProps {
    work: any
    isOwner: boolean
    slug: string
    navigate: (path: string) => void
    coverUrl: (url: string) => string | null
}

export default function PublicWorkInfo({
    work,
    isOwner,
    slug,
    navigate,
    coverUrl,
}: PublicWorkInfoProps) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex flex-col md: fle-row sm:flex-row gap-6">
                    {/* Cover */}
                    <div className="shrink-0">
                        <PublicWorkCover coverUrl={coverUrl(work.cover)} title={work.title} />
                    </div>

                    {/* Meta */}
                    <div className="flex-1 min-w-0 space-y-4">
                        <PublicWorkTitle work={work} />
                        <PublicWorkTags genres={work.genres} />

                        <div className="flex items-center gap-3">
                            <p className="text-sm text-muted-foreground">
                                By{' '}
                                <span className="font-medium text-foreground">
                                    {work.user?.name || 'Unknown'}
                                </span>
                            </p>
                            {isOwner && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/studio/works/${slug}/chapters`)}
                                >
                                    Manage
                                </Button>
                            )}
                        </div>

                        <PublicWorkDescription description={work.description} />

                        <Separator />

                        <PublicWorkStats
                            chapters={work.chapters_count}
                            views={work.views}
                            likes={work.likes ?? 0}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
