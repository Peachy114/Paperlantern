import { BriefcaseBusiness, CheckCircle2, ClipboardList, FileQuestion, Settings, ShieldAlert, Sparkles, Star, Workflow } from 'lucide-react'

// Commission workspace configuration ----
export const COMMISSION_QUERY_KEY = ['studio-commission-profile'] as const

export const COMMISSION_NAV_ITEMS = [
    { value: 'workflow', label: 'Commissions', icon: Sparkles },
    { value: 'services', label: 'Services', icon: BriefcaseBusiness },
    { value: 'forms', label: 'Forms', icon: ClipboardList },
    { value: 'requests', label: 'Orders', icon: Workflow },
    { value: 'policies', label: 'Policies', icon: ShieldAlert },
    { value: 'discounts', label: 'Promotions', icon: Star },
    { value: 'faq', label: 'FAQ', icon: FileQuestion },
    { value: 'ratings', label: 'Ratings', icon: CheckCircle2 },
    { value: 'settings', label: 'Settings', icon: Settings },
] as const
