import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PublicShowLikesProps {
    liked: boolean
    likes: number
    toggleLike: () => void
}

export default function PublicShowLikes({ liked, likes, toggleLike }: PublicShowLikesProps) {
    return (
        <div className="flex flex-col items-center gap-1.5 py-6">
            <Button
                variant="ghost"
                size="sm"
                onClick={toggleLike}
                className={`gap-2 ${liked ? 'text-red-500 hover:text-red-400' : 'text-muted-foreground hover:text-red-500'}`}
            >
                <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                {liked ? 'Liked' : 'Like this chapter'}
            </Button>
            <span className="text-xs text-muted-foreground">
                {likes.toLocaleString()} {likes === 1 ? 'like' : 'likes'}
            </span>
        </div>
    )
}
