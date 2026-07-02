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
    coverUrl: (url: string, variant?: 'sm') => string | null
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
            <CardContent>
                <div className="flex flex-col gap-6">
                    {/* Cover
                    <PublicWorkCover coverUrl={coverUrl(work.cover, 'sm')} title={work.title} /> */}

                    {/* Meta */}
                    <div className="space-y-4">
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
