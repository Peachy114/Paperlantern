// import { Card, CardContent } from '@/components/ui/card'
// import { BookOpen, Eye, Heart } from 'lucide-react'

// interface Props {
//     chapterCount: number
//     totalViews: number
//     totalLikes: number
// }

// const stats = [
//     { key: 'chapters', label: 'Chapters', icon: BookOpen },
//     { key: 'views', label: 'Total Views', icon: Eye },
//     { key: 'likes', label: 'Total Likes', icon: Heart },
// ] as const

// export default function ChapterManageStats({ chapterCount, totalViews, totalLikes }: Props) {
//     const values: Record<string, number> = {
//         chapters: chapterCount,
//         views: totalViews,
//         likes: totalLikes,
//     }

//     return (
//         <div className="grid grid-cols-3 gap-3">
//             {stats.map(({ key, label, icon: Icon }) => (
//                 <Card key={key} className="shadow-none">
//                     <CardContent className="p-4 flex items-center gap-3">
//                         <div className="p-2 rounded-md bg-muted">
//                             <Icon className="h-4 w-4 text-muted-foreground" />
//                         </div>
//                         <div>
//                             <p className="text-xl font-semibold tabular-nums">
//                                 {values[key].toLocaleString()}
//                             </p>
//                             <p className="text-xs text-muted-foreground">{label}</p>
//                         </div>
//                     </CardContent>
//                 </Card>
//             ))}
//         </div>
//     )
// }
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Eye, Heart } from 'lucide-react'

interface Props {
    chapterCount: number
    totalViews: number
    totalLikes: number
}

const stats = [
    { key: 'chapters', label: 'Chapters', icon: BookOpen },
    { key: 'views', label: 'Total Views', icon: Eye },
    { key: 'likes', label: 'Total Likes', icon: Heart },
] as const

export default function ChapterManageStats({ chapterCount, totalViews, totalLikes }: Props) {
    const values: Record<string, number> = {
        chapters: chapterCount,
        views: totalViews,
        likes: totalLikes,
    }

    return (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {stats.map(({ key, label, icon: Icon }) => (
                <Card key={key} className="shadow-none">
                    <CardContent className="p-2.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-3">
                        <div className="p-1.5 sm:p-2 rounded-md bg-muted">
                            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-base sm:text-xl font-semibold tabular-nums leading-tight">
                                {values[key].toLocaleString()}
                            </p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
                                {label}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
