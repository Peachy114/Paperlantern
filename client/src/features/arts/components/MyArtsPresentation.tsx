import { BarChart3, Eye, MoreHorizontal, Pencil, RotateCcw, Sparkles, Trash2, type LucideIcon } from 'lucide-react'
import type { Art } from '@/types/art'
import { storageUrl } from '@/utils/storage'
import { getArtImages, getFirstImagePath } from '@/features/arts/utils/myArts'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Art metrics ----
export function ArtMetric({ label, value }: { label: string; value: number }) {
    return <div className="rounded-lg border bg-muted/20 p-3"><div className="text-lg font-semibold">{value.toLocaleString()}</div><div className="text-xs text-muted-foreground">{label}</div></div>
}

export function ArtsEmptyState({ icon: Icon, title, actionLabel, onAction }: { icon: LucideIcon; title: string; actionLabel?: string; onAction?: () => void }) {
    return <div className="py-16 text-center"><Icon className="mx-auto mb-3 h-6 w-6 text-muted-foreground" /><p className="mb-4 text-sm text-muted-foreground">{title}</p>{actionLabel && onAction && <Button onClick={onAction}>{actionLabel}</Button>}</div>
}

// Art row actions ----
export function ArtActions({ art, onView, onEdit, onBoost, onTrash }: { art: Art; onView: (art: Art) => void; onEdit: (art: Art) => void; onBoost: (art: Art) => void; onTrash: (art: Art) => void }) {
    return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={16} /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => onView(art)}><Eye size={14} className="mr-2" />View</DropdownMenuItem><DropdownMenuItem onClick={() => onEdit(art)}><Pencil size={14} className="mr-2" />Edit</DropdownMenuItem><DropdownMenuItem onClick={() => onBoost(art)}><Sparkles size={14} className="mr-2" />Boost</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={() => onTrash(art)} className="text-red-500 focus:text-red-500"><Trash2 size={14} className="mr-2" />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
}

// Art analytics table ----
export function AnalyticsTable({ arts }: { arts: Art[] }) {
    if (arts.length === 0) return <ArtsEmptyState icon={BarChart3} title="No analytics yet" />
    return <Table><TableHeader><TableRow><TableHead>Art Post</TableHead><TableHead className="hidden sm:table-cell">Pictures</TableHead><TableHead className="hidden sm:table-cell">Views</TableHead><TableHead className="hidden sm:table-cell">Likes</TableHead><TableHead className="hidden sm:table-cell">Comments</TableHead><TableHead className="hidden sm:table-cell">Super Likes</TableHead></TableRow></TableHeader><TableBody>{arts.map((art) => <TableRow key={art.id}><TableCell><div className="flex items-center gap-3"><img src={storageUrl(getFirstImagePath(art))!} alt={art.title} className="h-10 w-10 rounded-md bg-muted object-cover" /><span className="text-sm font-medium">{art.title}</span></div><p className="mt-1 text-xs text-muted-foreground sm:hidden">{art.views.toLocaleString()} views - {art.likes.toLocaleString()} likes</p></TableCell><TableCell className="hidden sm:table-cell">{getArtImages(art).length.toLocaleString()}</TableCell><TableCell className="hidden sm:table-cell">{art.views.toLocaleString()}</TableCell><TableCell className="hidden sm:table-cell">{art.likes.toLocaleString()}</TableCell><TableCell className="hidden sm:table-cell">{art.comments_count.toLocaleString()}</TableCell><TableCell className="hidden sm:table-cell">{art.super_likes_count.toLocaleString()}</TableCell></TableRow>)}</TableBody></Table>
}

// Art trash table ----
export function TrashTable({ arts, daysLeft, onRestore, onForceDelete }: { arts: Art[]; daysLeft: (deletedAt?: string | null) => number; onRestore: (art: Art) => void; onForceDelete: (art: Art) => void }) {
    return <Table><TableHeader><TableRow><TableHead>Art Post</TableHead><TableHead className="hidden sm:table-cell">Days Left</TableHead><TableHead className="w-28" /></TableRow></TableHeader><TableBody>{arts.map((art) => <TableRow key={art.id}><TableCell><div className="flex items-center gap-3"><img src={storageUrl(getFirstImagePath(art))!} alt={art.title} className="h-10 w-10 rounded-md bg-muted object-cover opacity-70 grayscale" /><div><p className="text-sm font-medium">{art.title}</p><p className="text-xs text-muted-foreground sm:hidden">{daysLeft(art.deleted_at)} days left</p></div></div></TableCell><TableCell className="hidden text-sm text-muted-foreground sm:table-cell">{daysLeft(art.deleted_at)}</TableCell><TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="icon-sm" onClick={() => onRestore(art)}><RotateCcw className="h-4 w-4" /></Button><Button variant="ghost" size="icon-sm" onClick={() => onForceDelete(art)} className="text-red-500 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>)}</TableBody></Table>
}
