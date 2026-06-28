import { Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

export interface TeamMember {
    role: string
    name: string
    note: string
}

interface AboutTeamProps {
    team: TeamMember[]
}

export function AboutTeam({ team }: AboutTeamProps) {
    return (
        <Card className="border border-border shadow-none rounded-lg mb-4">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                        <Users className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-sm font-medium">The Team</CardTitle>
                    <Badge variant="secondary" className="ml-auto text-xs font-normal">
                        devOrbit
                    </Badge>
                </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {team.map((member) => (
                        <div
                            key={member.name}
                            className="rounded-md border border-border bg-muted/30 px-4 py-3 space-y-0.5"
                        >
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                                {member.role}
                            </p>
                            <p className="text-sm font-medium">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.note}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
