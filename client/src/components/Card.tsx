import { useNavigate } from 'react-router-dom'
// import CardSkeleton from '@/components/CardSkeleton'
import { useState } from 'react'


interface CardProps {
  id: string | number
  title: string
  cover: string | null
  type?: 'webtoon' | 'novel' | 'wattpad'
  status?: string
  genres?: string[]
  // views?: number
  likes?: number
  rank?: number
  chapter?: { order: number; title: string }
  showStats?: boolean
  onClick?: () => void
}

function RankBadge({ rank }: { rank: number }) {
  if (rank > 10) return null
  return (
    <span
      className="absolute bottom-1 left-2 leading-none select-none pointer-events-none z-10"
      style={{
        fontSize: '56px',
        fontWeight: 900,
        lineHeight: 1,
        color: '#000000',
        WebkitTextStroke: '2px rgba(255,255,255,0.9)',
        textShadow: '2px 3px 6px rgba(0,0,0,0.5)',
      }}
    >
      {rank}
    </span>
  )
}

export default function Card({ id, title, cover, type, status, genres, likes, rank, chapter, showStats = false, onClick }: CardProps) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const navigate = useNavigate()
  const handleClick = onClick ?? (() => navigate(`/comics/${id}`))

  return (
    <div onClick={handleClick} className="cursor-pointer group">
      <div className="relative rounded-xl overflow-hidden aspect-[2/3] bg-muted">
        {/* Skeleton shown until image loads */}
        {cover && !imgLoaded && (
          <div className="absolute inset-0">
            <div className="w-full h-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          </div>
        )}

        {cover && (
          <img
            src={cover}
            alt={title}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
          />
        )}

        {rank !== undefined && rank <= 10 && (
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
        )}
        
        {rank !== undefined && rank <= 10 && <RankBadge rank={rank} />}
        {status === 'completed' && (
          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/70 text-white text-xsmall font-semibold">
            Completed
          </span>
        )}
        {showStats && !rank && likes !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2 text-xsmall text-white/90">
              <span>♥ {likes.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
      <div className="mt-2">
        <div className="text-small font-semibold leading-snug text-foreground line-clamp-2">{title}</div>
        {chapter ? (
          <div className="text-xsmall text-muted-foreground mt-0.5 line-clamp-1">Ch. {chapter.order} · {chapter.title}</div>
        ) : genres && genres.length > 0 ? (
          <div className="text-xsmall text-muted-foreground mt-0.5 line-clamp-1">{genres.slice(0, 2).join(' · ')}</div>
        ) : type ? (
          <div className="text-xsmall text-muted-foreground mt-0.5">
            {type === 'webtoon' ? 'Webtoon' : type === 'wattpad' ? 'Wattpad' : 'Novel'}
          </div>
        ) : null}

         {likes !== undefined && (
            <div className="text-xsmall text-muted-foreground/60 mt-0.5" style={{ fontFamily: "'Kalam', cursive" }}>
              ♥ {likes.toLocaleString()}
            </div>
          )}
      </div>
    </div>
  )
}