import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, X } from 'lucide-react'
import { announcementApi, type Announcement } from '@/api/announcement'
import { storageUrl } from '@/utils/storage'

export default function NewsDetail() {
    const { id = '' } = useParams()
    const navigate = useNavigate()
    const [item, setItem] = useState<Announcement | null>(null)
    const isComic = item?.format === 'comic'

    useEffect(() => {
        announcementApi.getPublicOne(id).then(({ data }) => setItem(data))
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = '' }
    }, [id])

    return (
        <div className="fixed inset-0 z-[10000] overflow-y-auto bg-background text-foreground" role="dialog" aria-modal="true" aria-label={item?.title ?? 'News details'}>
            <div className="sticky top-0 z-[10001] flex h-0 items-start justify-between px-3 pt-3 sm:px-4 sm:pt-4">
                <Link to="/news" className="inline-flex h-11 items-center gap-2 rounded-full border bg-background/95 px-4 font-display text-sm font-bold shadow-lg backdrop-blur hover:bg-muted"><ArrowLeft className="size-4" /> Back to News</Link>
                <button type="button" onClick={() => navigate('/news')} className="grid size-11 place-items-center rounded-full border bg-background/95 shadow-lg backdrop-blur hover:bg-muted" aria-label="Close news details">
                    <X className="size-5" />
                </button>
            </div>
            {item && (
                <article className="pb-16">
                    {item.image ? (
                        <img src={storageUrl(item.image)!} alt={item.title} className="h-[42vh] min-h-72 w-full object-cover sm:h-[56vh]" />
                    ) : (
                        <div aria-hidden="true" className="h-[30vh] min-h-56 w-full bg-brand-gradient-soft sm:h-[42vh]" />
                    )}
                    <div className={`mx-auto -mt-12 px-4 sm:px-6 ${isComic ? 'max-w-3xl' : 'max-w-4xl'}`}>
                        <div className="relative rounded-3xl border bg-card p-6 shadow-xl sm:p-10">
                            <p className="font-display text-sm font-black uppercase tracking-widest text-[var(--selected)]">{item.is_event || item.tag === 'event' ? 'Event' : 'Announcement'}</p>
                            <h1 className="mt-3 break-words text-3xl font-black leading-tight [overflow-wrap:anywhere] sm:text-5xl">{item.title}</h1>
                            <p className="mt-4 text-sm text-muted-foreground">{new Date(item.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })} · {item.creator?.name ?? 'LaterNComix Staff'}</p>
                            {item.excerpt && <p className="mt-7 text-lg font-semibold leading-8">{item.excerpt}</p>}
                            {item.format === 'long' && item.body_html ? (
                                <div className="news-rich-content mt-8" dangerouslySetInnerHTML={{ __html: item.body_html }} />
                            ) : (
                                <p className="mt-8 whitespace-pre-line leading-8">{item.content}</p>
                            )}
                        </div>
                        {!!item.gallery_images?.length && (
                            <div className={isComic ? 'mx-auto mt-8 w-full space-y-0 overflow-hidden bg-black' : 'mt-8 grid gap-5 sm:grid-cols-2'}>
                                {item.gallery_images.map((image, index) => <img key={image} src={storageUrl(image)!} alt={isComic ? `Comic panel ${index + 1}` : 'News detail'} className={isComic ? 'block h-auto w-full' : 'w-full rounded-2xl border object-cover shadow-sm'} />)}
                            </div>
                        )}
                    </div>
                </article>
            )}
        </div>
    )
}
