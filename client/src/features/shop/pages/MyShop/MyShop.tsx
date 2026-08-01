import {
    DndContext,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { PackagePlus, Store } from 'lucide-react'
import CreatorWorkspaceShell from '@/features/studio/components/workspace/CreatorWorkspaceShell'
import { useMyShop } from './hooks/useMyShop'
import type { ShopItem } from './types'
import { ShopDashboardHero } from './components/ShopDashboardHero'
import { ShopProductCard } from './components/ShopProductCard'
import { ShopForm } from './components/ShopForm'

function SortableProductCard({
    item,
    selected,
    onSelect,
    onEdit,
    onDelete,
    deleting,
}: {
    item: ShopItem
    selected: boolean
    onSelect: (id: string) => void
    onEdit: (item: ShopItem) => void
    onDelete: (id: string) => void
    deleting: boolean
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.id,
    })

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                opacity: isDragging ? 0.5 : 1,
            }}
            {...attributes}
            {...listeners}
        >
            <ShopProductCard
                item={item}
                selected={selected}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
                deleting={deleting}
            />
        </div>
    )
}

export default function MyShop() {
    const shop = useMyShop()
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

    const handleDragEnd = (event: DragEndEvent) => {
        shop.handleProductDragEnd(event)
    }

    return (
        <CreatorWorkspaceShell
            layout="dashboard"
            title="Shop"
            description=""
            action={
                <div className="flex items-center gap-2">
                    {shop.activeSection === 'form' ? (
                        <button
                            type="button"
                            onClick={shop.cancelForm}
                            className="inline-flex h-8 items-center rounded-full border border-sky-200 bg-card px-4 text-xs font-bold text-sky-600 shadow-sm transition hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-500/10"
                        >
                            Back to Shop
                        </button>
                    ) : null}
                    <button
                        type="button"
                        onClick={shop.startNewItem}
                        className="inline-flex h-8 items-center gap-1.5 rounded-full bg-sky-400 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-sky-500"
                    >
                        <PackagePlus className="h-3.5 w-3.5" />
                        Add Product
                    </button>
                </div>
            }
        >
            {shop.activeSection === 'shop' && (
                <>
                    <ShopDashboardHero
                        items={shop.shopItems}
                        stats={shop.stats}
                        workspaceBannerImage={shop.workspaceBannerImage}
                        onWorkspaceBannerChange={shop.setWorkspaceBannerImage}
                    />

                    <section className="mt-5">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                            <h2 className="text-xs font-black uppercase tracking-[0.12em]">
                                Shop Products
                            </h2>
                            {shop.shopItems.length > 0 ? (
                                <div className="flex flex-wrap items-center gap-1.5">
                                    {shop.selectedItems.length > 0 ? (
                                        <span className="mr-1 text-[10px] text-muted-foreground">
                                            {shop.selectedItems.length} selected
                                        </span>
                                    ) : null}
                                    <button
                                        type="button"
                                        onClick={shop.selectAllItems}
                                        disabled={
                                            shop.deleteMutation.isPending ||
                                            shop.selectedItems.length === shop.shopItems.length
                                        }
                                        className="rounded-full border px-3 py-1 text-[9px] font-bold transition hover:bg-muted disabled:opacity-40"
                                    >
                                        Select all
                                    </button>
                                    {shop.selectedItems.length > 0 ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={shop.clearSelectedItems}
                                                disabled={shop.deleteMutation.isPending}
                                                className="rounded-full border px-3 py-1 text-[9px] font-bold transition hover:bg-muted disabled:opacity-40"
                                            >
                                                Clear
                                            </button>
                                            <button
                                                type="button"
                                                onClick={shop.deleteSelectedItems}
                                                disabled={shop.deleteMutation.isPending}
                                                className="rounded-full bg-rose-500 px-3 py-1 text-[9px] font-bold text-white transition hover:bg-rose-600 disabled:opacity-40"
                                            >
                                                Delete selected
                                            </button>
                                        </>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>

                        {shop.shop.isLoading ? (
                            <div className="rounded-2xl border p-8 text-center text-sm text-muted-foreground">
                                Loading shop...
                            </div>
                        ) : shop.shopItems.length === 0 ? (
                            <div className="rounded-2xl border border-dashed p-10 text-center">
                                <Store className="mx-auto h-8 w-8 text-muted-foreground/40" />
                                <p className="mt-3 text-sm font-semibold">No shop products yet</p>
                                <button
                                    type="button"
                                    onClick={shop.startNewItem}
                                    className="mt-4 rounded-full bg-sky-400 px-4 py-2 text-xs font-bold text-white transition hover:bg-sky-500"
                                >
                                    Add your first product
                                </button>
                            </div>
                        ) : (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={shop.orderedShopItems.map((item) => item.id)}
                                    strategy={rectSortingStrategy}
                                >
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                        {shop.orderedShopItems.map((item) => (
                                            <SortableProductCard
                                                key={item.id}
                                                item={item}
                                                selected={shop.selectedItems.includes(item.id)}
                                                onSelect={shop.toggleSelectedItem}
                                                onEdit={shop.editItem}
                                                onDelete={(id) => shop.deleteMutation.mutate(id)}
                                                deleting={shop.deleteMutation.isPending}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        )}
                    </section>
                </>
            )}

            {shop.activeSection === 'form' && <ShopForm shop={shop} />}
        </CreatorWorkspaceShell>
    )
}