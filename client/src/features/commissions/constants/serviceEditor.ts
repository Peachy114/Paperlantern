import type {
    ClientFields,
    RequestQuestion,
    ServiceForm,
    SetupOptions,
} from '@/features/commissions/types/studioCommission'

// Client details ----
export const DEFAULT_CLIENT_FIELDS: ClientFields = {
    name: { collect: true, required: false },
    username: { collect: true, required: false },
    email: { collect: true, required: true },
    discord: { collect: false, required: false },
    twitter: { collect: false, required: false },
    instagram: { collect: false, required: false },
    facebook: { collect: false, required: false },
    tiktok: { collect: false, required: false },
}

// Service setup ----
export const DEFAULT_SETUP_OPTIONS: SetupOptions = {
    visibility: 'discoverable',
    service_type: 'custom',
    communication_style: 'open',
    requesting_process: 'custom_proposal',
    notify_followers_on_status_change: false,
    sensitive: false,
    display_service_stats: true,
    estimated_start: 'this_month',
    start_time: '',
    end_time: '',
    guaranteed_delivery_days: 14,
}

export function defaultLicenseOptions() {
    return [
        'Personal - individual, non-commercial and non-monetized use only',
        'Commercial: Content - for content creators or businesses distributing commercial or monetized digital content',
        'Commercial: Merchandising - for creating, promoting, and reselling digital or physical products with the asset',
    ]
}

export const DEFAULT_LICENSE_QUESTION: RequestQuestion = {
    id: 'license-use',
    title: 'How will you be using this commission?',
    description: 'Choose the license you need.',
    type: 'multiple_choice',
    required: false,
    options: defaultLicenseOptions(),
}

// Service form ----
export const EMPTY_SERVICE_FORM: ServiceForm = {
    title: '',
    commission_category_id: '',
    description: '',
    image: null,
    imagePreview: null,
    base_price_credits: 0,
    min_price_credits: 0,
    delivery_days: 7,
    slots_available: 1,
    status: 'open',
    is_published: true,
    terms: '',
    quote_rules: '',
    refund_policy:
        '100% refund if no sketch/work has been sent. 50% refund once the first sketch/work has started.',
    required_references: '',
    request_questions: [DEFAULT_LICENSE_QUESTION],
    info_questions: [],
    client_fields: DEFAULT_CLIENT_FIELDS,
    promo_discounts: [],
    setup_options: DEFAULT_SETUP_OPTIONS,
    flow: [
        { type: 'pay', label: 'Pay 50%', percent: 50 },
        { type: 'sketch', label: 'Sketch', rounds: 2 },
        { type: 'revision', label: 'Revision', rounds: 1 },
        { type: 'pay', label: 'Pay 50%', percent: 50 },
        { type: 'done', label: 'Delivery and receipt' },
    ],
}
