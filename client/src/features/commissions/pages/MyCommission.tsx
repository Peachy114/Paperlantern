import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { studioApi } from '@/api/studio'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type {
    ClientFields,
    CommissionPageResponse,
    ConfirmAction,
    FlowStep,
    InfoQuestion,
    PromoDiscount,
    RequestQuestion,
} from '@/features/commissions/types/studioCommission'
import { CommissionDashboardHero, ConfirmActionDialog } from '@/features/commissions/components/CommissionDashboard'
import { CommissionServicesSection } from '@/features/commissions/components/CommissionServiceWorkspace'
import {
    CommissionRatingsSectionV2,
    CommissionRequestsSection,
} from '@/features/commissions/components/CommissionOrderViews'
import {
    CommissionApplicationSection,
    CommissionSettingsSection,
    CommissionWorkflowSection,
} from '@/features/commissions/components/CommissionOverviewSections'
import {
    CommissionDiscountWorkspace,
    CommissionFaqWorkspace,
    CommissionFormsWorkspace,
    CommissionPoliciesSection,
} from '@/features/commissions/components/CommissionContentWorkspaces'
import { COMMISSION_NAV_ITEMS, COMMISSION_QUERY_KEY } from '@/features/commissions/constants/workspace'

export default function MyCommission() {
    const queryClient = useQueryClient()
    const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
    const { data, isLoading } = useQuery<CommissionPageResponse>({
        queryKey: COMMISSION_QUERY_KEY,
        queryFn: () => studioApi.getCommissionProfile().then((res) => res.data),
    })

    const profile = data?.commission_profile
    const categories = data?.categories ?? []
    const services = data?.services ?? []
    const orders = data?.orders ?? []
    const ratings = data?.ratings ?? []
    const widgets = data?.widgets

    const applyCommission = useMutation({
        mutationFn: (application_reason: string) =>
            studioApi.applyCommission({ application_reason }).then((res) => res.data),
        onSuccess: () => {
            toast.success('Commission application submitted.')
            queryClient.invalidateQueries({ queryKey: COMMISSION_QUERY_KEY })
        },
        onError: (error: any) =>
            toast.error(
                error?.response?.data?.message ?? 'Could not submit commission application.'
            ),
    })

    const updateSettings = useMutation({
        mutationFn: (payload: {
            commissions_enabled?: boolean
            commission_status?: 'open' | 'closed'
            terms?: string
            policies?: Record<string, string>
            request_forms?: RequestQuestion[]
            faqs?: InfoQuestion[]
            discounts?: PromoDiscount[]
            client_fields?: ClientFields
            flow_template?: FlowStep[]
        }) => studioApi.updateCommissionProfile(payload).then((res) => res.data),
        onSuccess: () => {
            toast.success('Commission settings saved.')
            queryClient.invalidateQueries({ queryKey: COMMISSION_QUERY_KEY })
        },
        onError: (error: any) =>
            toast.error(error?.response?.data?.message ?? 'Could not save commission settings.'),
    })

    const createService = useMutation({
        mutationFn: (payload: FormData) => studioApi.createCommissionService(payload),
        onSuccess: () => {
            toast.success('Commission service created.')
            queryClient.invalidateQueries({ queryKey: COMMISSION_QUERY_KEY })
        },
        onError: (error: any) =>
            toast.error(error?.response?.data?.message ?? 'Could not save commission service.'),
    })

    const updateService = useMutation({
        mutationFn: ({ slug, payload }: { slug: string; payload: FormData }) =>
            studioApi.updateCommissionService(slug, payload),
        onSuccess: () => {
            toast.success('Commission service updated.')
            queryClient.invalidateQueries({ queryKey: COMMISSION_QUERY_KEY })
        },
        onError: (error: any) =>
            toast.error(error?.response?.data?.message ?? 'Could not update commission service.'),
    })

    const deleteService = useMutation({
        mutationFn: (slug: string) => studioApi.deleteCommissionService(slug),
        onSuccess: () => {
            toast.success('Commission service deleted.')
            queryClient.invalidateQueries({ queryKey: COMMISSION_QUERY_KEY })
        },
        onError: () => toast.error('Could not delete commission service.'),
    })

    const updateOrder = useMutation({
        mutationFn: ({
            id,
            status,
            board_column,
        }: {
            id: string
            status: 'in_progress' | 'delivered' | 'cancelled' | 'disputed'
            board_column?: 'todo' | 'in_progress' | 'done'
        }) => studioApi.updateCommissionOrder(id, { status, board_column }),
        onSuccess: () => {
            toast.success('Commission request updated.')
            queryClient.invalidateQueries({ queryKey: COMMISSION_QUERY_KEY })
        },
        onError: () => toast.error('Could not update commission request.'),
    })

    const advanceStage = useMutation({
        mutationFn: ({ id, step_index, note }: { id: string; step_index: number; note?: string }) =>
            studioApi.advanceCommissionStage(id, { step_index, note }),
        onSuccess: () => {
            toast.success('Commission stage updated.')
            queryClient.invalidateQueries({ queryKey: COMMISSION_QUERY_KEY })
        },
        onError: (error: any) =>
            toast.error(error?.response?.data?.message ?? 'Could not update stage.'),
    })

    const archiveOrder = useMutation({
        mutationFn: (id: string) => studioApi.archiveCommissionOrder(id).then((res) => res.data),
        onSuccess: () => {
            toast.success('Commission archived.')
            queryClient.invalidateQueries({ queryKey: COMMISSION_QUERY_KEY })
        },
        onError: (error: any) =>
            toast.error(error?.response?.data?.message ?? 'Could not archive commission.'),
    })

    const appealRating = useMutation({
        mutationFn: ({ id, appeal_reason }: { id: string; appeal_reason: string }) =>
            studioApi.appealCommissionRating(id, appeal_reason).then((res) => res.data),
        onSuccess: () => {
            toast.success('Rating appeal sent to admin.')
            queryClient.invalidateQueries({ queryKey: COMMISSION_QUERY_KEY })
        },
        onError: (error: any) =>
            toast.error(error?.response?.data?.message ?? 'Could not appeal rating.'),
    })

    if (isLoading || !profile) {
        return (
            <div className="rounded-3xl border bg-muted/30 p-8 text-sm text-muted-foreground">
                Loading commission settings...
            </div>
        )
    }

    const nextCommissionStatus = profile.commission_status === 'open' ? 'closed' : 'open'
    const requestStatusChange = () => {
        setConfirmAction({
            title:
                nextCommissionStatus === 'open'
                    ? 'Open commissions?'
                    : 'Close commissions?',
            description:
                nextCommissionStatus === 'open'
                    ? 'Wanderers will be able to request your published commission services again.'
                    : 'All published commission services will stop accepting new requests until you reopen commissions.',
            confirmLabel: nextCommissionStatus === 'open' ? 'Open commissions' : 'Close commissions',
            destructive: nextCommissionStatus === 'closed',
            onConfirm: () =>
                updateSettings.mutate({
                    commissions_enabled: nextCommissionStatus === 'open',
                    commission_status: nextCommissionStatus,
                }),
        })
    }

    const requestDeleteService = (slug: string, title: string) => {
        setConfirmAction({
            title: 'Delete commission service?',
            description: `Delete "${title}"? Wanderers will no longer be able to request this service.`,
            confirmLabel: 'Delete service',
            destructive: true,
            onConfirm: () => deleteService.mutate(slug),
        })
    }

    const requestDeleteServices = (targets: Array<{ slug: string; title: string }>) => {
        setConfirmAction({
            title: 'Delete selected services?',
            description: `Delete ${targets.length} selected commission service${targets.length === 1 ? '' : 's'}? This cannot be undone.`,
            confirmLabel: 'Delete selected',
            destructive: true,
            onConfirm: () => targets.forEach((service) => deleteService.mutate(service.slug)),
        })
    }

    return (
        <>
        <div className="mx-auto w-full max-w-[1500px] pb-16">
            <header className="mb-5 px-1">
                <h1 className="text-2xl font-black uppercase tracking-[0.03em] sm:text-3xl">
                    Commissions
                </h1>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                    Apply, create commission services, and manage your commission availability.
                </p>
            </header>

            <CommissionDashboardHero
                profile={profile}
                services={services}
                orders={orders}
                widgets={widgets}
                statusBusy={updateSettings.isPending}
                onToggleStatus={requestStatusChange}
            />

            {profile.application_status !== 'approved' && (
                <div className="mt-5">
                    <CommissionApplicationSection
                        profile={profile}
                        busy={applyCommission.isPending}
                        onApply={(reason) => applyCommission.mutate(reason)}
                    />
                </div>
            )}

            <Tabs
                defaultValue="workflow"
                className="mt-5 grid items-start gap-5 lg:grid-cols-[210px_minmax(0,1fr)]"
            >
                <TabsList className="flex h-auto w-full flex-row items-stretch justify-start gap-1.5 overflow-x-auto rounded-2xl border border-border bg-background/80 p-2 shadow-sm backdrop-blur lg:sticky lg:top-24 lg:flex-col lg:overflow-visible lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none">
                    {COMMISSION_NAV_ITEMS.map(({ value, label, icon: Icon }) => (
                        <TabsTrigger
                            key={value}
                            value={value}
                            className="group h-11 shrink-0 justify-start gap-3 rounded-xl border border-transparent bg-transparent px-3 py-2.5 text-left text-sm font-semibold text-foreground shadow-none transition-all duration-200 hover:bg-muted/70 data-[state=active]:border-sky-200 data-[state=active]:bg-sky-500 data-[state=active]:text-white data-[state=active]:shadow-[0_8px_20px_rgba(14,165,233,0.28)] lg:w-full"
                        >
                            <Icon className="h-4 w-4 shrink-0 text-orange-500 transition-colors group-data-[state=active]:text-white" />
                            <span>{label}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>

                <div className="min-w-0">
                    <TabsContent value="workflow" className="mt-0">
                        <CommissionWorkflowSection
                            orders={orders}
                            busy={
                                advanceStage.isPending ||
                                updateOrder.isPending ||
                                archiveOrder.isPending
                            }
                            onMove={(id, status, board_column) =>
                                updateOrder.mutate({ id, status, board_column })
                            }
                            onArchive={(id) => archiveOrder.mutate(id)}
                        />
                    </TabsContent>

                    <TabsContent value="services" className="mt-0">
                        <CommissionServicesSection
                            profile={profile}
                            services={services}
                            categories={categories}
                            saving={createService.isPending || updateService.isPending}
                            deleting={deleteService.isPending}
                            onCreate={(payload) => createService.mutate(payload)}
                            onUpdate={(slug, payload) => updateService.mutate({ slug, payload })}
                            onDelete={requestDeleteService}
                            onDeleteSelected={requestDeleteServices}
                        />
                    </TabsContent>

                    <TabsContent value="forms" className="mt-0">
                        <CommissionFormsWorkspace
                            profile={profile}
                            busy={updateSettings.isPending}
                            onSave={(request_forms) => updateSettings.mutate({ request_forms })}
                        />
                    </TabsContent>

                    <TabsContent value="requests" className="mt-0">
                        <CommissionRequestsSection orders={orders} />
                    </TabsContent>

                    <TabsContent value="policies" className="mt-0">
                        <CommissionPoliciesSection
                            profile={profile}
                            busy={updateSettings.isPending}
                            onSave={(policies) => updateSettings.mutate({ policies })}
                        />
                    </TabsContent>

                    <TabsContent value="discounts" className="mt-0">
                        <CommissionDiscountWorkspace
                            profile={profile}
                            busy={updateSettings.isPending}
                            onSave={(discounts) => updateSettings.mutate({ discounts })}
                        />
                    </TabsContent>

                    <TabsContent value="faq" className="mt-0">
                        <CommissionFaqWorkspace
                            profile={profile}
                            busy={updateSettings.isPending}
                            onSave={(faqs) => updateSettings.mutate({ faqs })}
                        />
                    </TabsContent>

                    <TabsContent value="ratings" className="mt-0">
                        <CommissionRatingsSectionV2
                            ratings={ratings}
                            busy={appealRating.isPending}
                            onAppeal={(id, appeal_reason) =>
                                appealRating.mutate({ id, appeal_reason })
                            }
                        />
                    </TabsContent>

                    <TabsContent value="settings" className="mt-0">
                        <CommissionSettingsSection
                            profile={profile}
                            busy={updateSettings.isPending}
                            onSave={(payload) => updateSettings.mutate(payload)}
                        />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
        <ConfirmActionDialog
            action={confirmAction}
            busy={updateSettings.isPending || deleteService.isPending}
            onOpenChange={(open) => {
                if (!open) setConfirmAction(null)
            }}
        />
        </>
    )
}

