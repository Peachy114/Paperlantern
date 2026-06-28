import React from 'react'
import formatCount from '@/utils/formatCount'
import { Separator } from '@/components/ui/separator'

interface PublicWorkStatsProps {
    chapters: number
    views: number
    likes: number
}

export default function PublicWorkStats({ chapters, views, likes }: PublicWorkStatsProps) {
    const stats = [
        { value: chapters, label: 'Chapters' },
        { value: views, label: 'Views' },
        { value: likes, label: 'Likes' },
    ]

    return (
        <div className="flex gap-4">
            {stats.map((stat, i) => (
                <React.Fragment key={stat.label}>
                    <div className="flex flex-col gap-1 min-w-0">
                        <p className="text-lg sm:text-2xl font-bold truncate">
                            {formatCount(stat.value)}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                    </div>
                    {i < stats.length - 1 && <Separator orientation="vertical" />}
                </React.Fragment>
            ))}
        </div>
    )
}
