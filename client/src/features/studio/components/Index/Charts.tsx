import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import { studioApi } from '@/api/studio'

interface ViewDataPoint {
    date: string
    views: number
}

const chartConfig = {
    views: {
        label: 'Views',
        color: 'hsl(var(--chart-1))',
    },
} satisfies ChartConfig

export default function Charts() {
    const [data, setData] = useState<ViewDataPoint[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        studioApi
            .getViewsChart()
            .then((r) => setData(r.data))
            .catch(() => setError(true))
            .finally(() => setLoading(false))
    }, [])

    const totalViews = data.reduce((s, d) => s + Number(d.views), 0)
    const peak = data.length > 0 ? Math.max(...data.map((d) => Number(d.views))) : 0

    if (loading) {
        return (
            <Card className="h-full animate-pulse">
                <CardHeader>
                    <div className="h-4 w-32 bg-muted rounded" />
                </CardHeader>
                <CardContent>
                    <div className="h-40 bg-muted/40 rounded" />
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="h-full">
                <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground">Could not load analytics.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Views</CardTitle>
                <CardDescription>Last 7 days — {totalViews.toLocaleString()} total</CardDescription>
            </CardHeader>
            <CardContent>
                {totalViews === 0 ? (
                    <div className="h-40 flex items-center justify-center">
                        <p className="text-xs text-muted-foreground/40">No views yet this week</p>
                    </div>
                ) : (
                    <ChartContainer config={chartConfig} className="h-[200px] w-full">
                        <AreaChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                            <defs>
                                <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                                    <stop
                                        offset="5%"
                                        stopColor="var(--color-views)"
                                        stopOpacity={0.8}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="var(--color-views)"
                                        stopOpacity={0.1}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tick={{ fontSize: 10 }}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent indicator="dot" />}
                            />
                            <Area
                                type="natural"
                                dataKey="views"
                                stroke="var(--color-views)"
                                strokeWidth={2}
                                fill="url(#fillViews)"
                                dot={false}
                                activeDot={{ r: 4 }}
                            />
                        </AreaChart>
                    </ChartContainer>
                )}
            </CardContent>
            <CardFooter>
                <div className="flex w-full items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                        Peak day:{' '}
                        <span className="font-medium text-foreground">
                            {peak.toLocaleString()} views
                        </span>
                    </span>
                </div>
            </CardFooter>
        </Card>
    )
}
