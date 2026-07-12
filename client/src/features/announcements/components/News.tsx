import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAnnouncements } from '@/features/announcements/hooks/useAnnouncements'
import { storageUrl } from '@/utils/storage'

export default function News({ audience }: { audience: 'public' | 'studio' }) {
    const { announcements, loading, error } = useAnnouncements(audience)
    const [current, setCurrent] = useState(0)

    if (loading)
        return (
            <div
                style={{
                    fontFamily: 'var(--comix-font-family)',
                    color: 'var(--comix-text-muted)',
                    fontSize: 'var(--comix-font-sm)',
                }}
            >
                Loading...
            </div>
        )
    if (error || !announcements.length) return null

    const sorted = [
        ...announcements.filter((a) => a.is_pinned),
        ...announcements.filter((a) => !a.is_pinned),
    ]

    const featured = sorted[current]
    const total = sorted.length
    const listItems = sorted.slice(0, 5)

    return (
        <div style={{ fontFamily: 'var(--comix-font-family)', marginBottom: '3.5rem' }}>
            <div
                style={{
                    display: 'flex',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #3a2510 0%, #1e1208 60%, #2a1a09 100%)',
                    minHeight: '220px',
                }}
            >
                {/* Left: featured image with carousel dots */}
                <div
                    style={{
                        flex: '0 0 52%',
                        position: 'relative',
                        overflow: 'hidden',
                        background: '#2a1a09',
                    }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={featured.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{ width: '100%', height: '100%', minHeight: '220px' }}
                        >
                            {storageUrl(featured.image) ? (
                                <img
                                    src={storageUrl(featured.image)!}
                                    alt={featured.title}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        display: 'block',
                                        minHeight: '220px',
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: '100%',
                                        minHeight: '220px',
                                        background:
                                            'linear-gradient(135deg, #4a3520 0%, #2a1e0f 100%)',
                                    }}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {total > 1 && (
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '10px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                display: 'flex',
                                gap: '6px',
                            }}
                        >
                            {sorted.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrent(i)}
                                    aria-label={`Slide ${i + 1}`}
                                    style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background:
                                            i === current
                                                ? 'var(--comix-text-accent)'
                                                : 'rgba(255,255,255,0.3)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: 0,
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: news list */}
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            padding: '14px 20px 10px',
                            borderBottom: '1px solid rgba(255,255,255,0.08)',
                        }}
                    >
                        <span
                            style={{
                                fontSize: 'var(--comix-font-sm)',
                                fontWeight: 500,
                                color: 'var(--comix-text-accent)',
                                borderBottom: '2px solid var(--comix-text-accent)',
                                paddingBottom: '4px',
                                display: 'inline-block',
                            }}
                        >
                            Latest
                        </span>
                    </div>

                    <div style={{ flex: 1 }}>
                        {listItems.map((item, i) => (
                            <div
                                key={item.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    gap: '10px',
                                    padding: '11px 20px',
                                    borderBottom:
                                        i < listItems.length - 1
                                            ? '1px solid rgba(255,255,255,0.06)'
                                            : 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 'var(--comix-font-sm)',
                                        color: 'rgba(240,225,200,0.9)',
                                        lineHeight: 1.4,
                                        flex: 1,
                                    }}
                                >
                                    {item.title}
                                </span>
                                <span
                                    style={{
                                        fontSize: 'var(--comix-font-xs)',
                                        color: 'rgba(240,225,200,0.4)',
                                        whiteSpace: 'nowrap',
                                        marginTop: '2px',
                                        flexShrink: 0,
                                    }}
                                >
                                    {new Date(item.created_at).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </span>
                            </div>
                        ))}
                    </div>

                    {total > 5 && (
                        <div
                            style={{
                                padding: '10px 20px',
                                borderTop: '1px solid rgba(255,255,255,0.08)',
                                display: 'flex',
                                justifyContent: 'flex-end',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 'var(--comix-font-xs)',
                                    color: 'rgba(240,225,200,0.5)',
                                    cursor: 'pointer',
                                }}
                            >
                                + More
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
