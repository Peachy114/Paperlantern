import { Bell, BellRing, Heart, MessageCircle, Megaphone, Sparkles, Wallet } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const categories = [
    {
        title: 'New releases',
        value: 'new-releases',
        description: 'Boosted releases from series, novels, arts, and commission creators.',
        icon: BellRing,
    },
    {
        title: 'Favorite chapters',
        value: 'favorite-chapters',
        description: 'New episodes from webtoons and novels you follow.',
        icon: Heart,
    },
    {
        title: 'Admin announcements',
        value: 'admin-announcements',
        description: 'Official updates, policy notices, and platform news.',
        icon: Megaphone,
    },
    {
        title: 'Likes',
        value: 'likes',
        description: 'Likes from series, arts, and commission activity.',
        icon: Heart,
    },
    {
        title: 'Commissions',
        value: 'commissions',
        description: 'Requests, quotes, approvals, payments, stages, and delivery notices.',
        icon: Sparkles,
    },
    {
        title: 'Messages',
        value: 'messages',
        description: 'Unread message alerts and commission conversation updates.',
        icon: MessageCircle,
    },
    {
        title: 'Super likes',
        value: 'super-likes',
        description: 'Super likes and reward notices from readers and clients.',
        icon: Sparkles,
    },
    {
        title: 'Credits bought from artists',
        value: 'credits-bought',
        description: 'Credit purchase notices connected to your creator activity.',
        icon: Wallet,
    },
]

export default function Notifications() {
    return (
        <main className="mx-auto max-w-5xl px-6 py-10">
            <div className="mb-8">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Bell className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-2xl font-bold">Notifications</h1>
                        <p className="text-sm text-muted-foreground">
                            Track releases, favorites, announcements, commissions, messages, super
                            likes, and credit activity.
                        </p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue={categories[0].value}>
                <TabsList className="h-auto w-full flex-wrap justify-start">
                    {categories.map((category) => (
                        <TabsTrigger key={category.value} value={category.value}>
                            {category.title}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {categories.map((category) => {
                    const Icon = category.icon
                    return (
                        <TabsContent key={category.value} value={category.value}>
                            <section className="mt-4 rounded-lg border border-border bg-card p-5">
                                <div className="flex gap-3">
                                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <h2 className="text-base font-semibold">
                                            {category.title}
                                        </h2>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {category.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-5 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                                    No notifications in this tab yet.
                                </div>
                            </section>
                        </TabsContent>
                    )
                })}
            </Tabs>
        </main>
    )
}
