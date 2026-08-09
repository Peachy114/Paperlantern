import type { CommissionProfile } from '@/types/art'
import type {
    ClientFields,
    FlowStep,
    FlowType,
    PromoDiscount,
    RequestQuestion,
    ServiceForm,
} from '@/features/commissions/types/studioCommission'

// Local identifiers ----
export function makeCommissionLocalId() {
    return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
import {
    DEFAULT_CLIENT_FIELDS,
    DEFAULT_LICENSE_QUESTION,
    EMPTY_SERVICE_FORM,
} from '@/features/commissions/constants/serviceEditor'

// Commission service form mapping ----
function makeLocalId() {
    return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function normalizeClientFields(value?: CommissionProfile['client_fields']): ClientFields {
    const fields = { ...(value ?? {}) } as Record<string, unknown>
    delete fields.nickname

    return {
        ...DEFAULT_CLIENT_FIELDS,
        ...fields,
        name: normalizeClientField(DEFAULT_CLIENT_FIELDS.name, fields.name),
        username: normalizeClientField(DEFAULT_CLIENT_FIELDS.username, fields.username),
        email: normalizeClientField(DEFAULT_CLIENT_FIELDS.email, fields.email),
        discord: normalizeClientField(DEFAULT_CLIENT_FIELDS.discord, fields.discord),
        twitter: normalizeClientField(DEFAULT_CLIENT_FIELDS.twitter, fields.twitter),
        instagram: normalizeClientField(DEFAULT_CLIENT_FIELDS.instagram, fields.instagram),
        facebook: normalizeClientField(DEFAULT_CLIENT_FIELDS.facebook, fields.facebook),
        tiktok: normalizeClientField(DEFAULT_CLIENT_FIELDS.tiktok, fields.tiktok),
    }
}

export function normalizeClientField(
    fallback: { collect: boolean; required: boolean },
    value: unknown
): { collect: boolean; required: boolean } {
    const field = (value ?? {}) as Partial<{ collect: unknown; required: unknown }>

    return {
        collect: booleanFieldValue(field.collect, fallback.collect),
        required: booleanFieldValue(field.required, fallback.required),
    }
}

export function booleanFieldValue(value: unknown, fallback = false) {
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase()
        if (['1', 'true', 'on', 'yes'].includes(normalized)) return true
        if (['0', 'false', 'off', 'no', ''].includes(normalized)) return false
    }

    if (value === true || value === 1) return true
    if (value === false || value === 0 || value === null) return false

    return fallback
}

export function normalizeFlowTemplate(value?: CommissionProfile['flow_template']): FlowStep[] {
    const source = Array.isArray(value) && value.length > 0 ? value : EMPTY_SERVICE_FORM.flow
    return source.map((step) => ({
        type: normalizeFlowType(step.type),
        label: step.label || 'Commission step',
        percent: typeof step.percent === 'number' ? step.percent : undefined,
        rounds: typeof step.rounds === 'number' ? step.rounds : undefined,
    }))
}

export function normalizeFlowType(type: string): FlowType {
    return ['pay', 'sketch', 'revision', 'add', 'done'].includes(type) ? (type as FlowType) : 'add'
}

export function normalizeRequestQuestions(value?: CommissionProfile['request_forms']): RequestQuestion[] {
    const source = Array.isArray(value) && value.length > 0 ? value : [DEFAULT_LICENSE_QUESTION]
    return source.map((question) => ({
        id: question.id || makeLocalId(),
        title: question.title || 'Question',
        description: question.description ?? '',
        type: question.type ?? 'textarea',
        required: Boolean(question.required),
        options: Array.isArray(question.options) ? question.options : [],
    }))
}

export function normalizePromoDiscounts(value?: CommissionProfile['discounts']): PromoDiscount[] {
    return (value ?? []).map((discount) => ({
        ...discount,
        starts_at: discount.starts_at ?? '',
        ends_at: discount.ends_at ?? '',
    }))
}


export function buildServicePayload(form: ServiceForm): FormData {
    const payload = new FormData()
    payload.append('title', form.title.trim())
    payload.append('commission_category_id', form.commission_category_id)
    payload.append('description', form.description.trim())
    payload.append('base_price_credits', String(form.base_price_credits))
    payload.append('min_price_credits', String(form.base_price_credits))
    payload.append('delivery_days', String(form.delivery_days))
    payload.append('slots_available', String(form.slots_available))
    payload.append('status', form.status)
    payload.append('is_published', form.is_published ? '1' : '0')
    payload.append('terms', form.terms.trim())
    payload.append('quote_rules', form.quote_rules.trim())
    payload.append('refund_policy', form.refund_policy.trim())
    payload.append('required_references', form.required_references.trim())
    form.request_questions.forEach((question, index) => {
        payload.append(`request_questions[${index}][id]`, question.id)
        payload.append(`request_questions[${index}][title]`, question.title)
        payload.append(`request_questions[${index}][description]`, question.description)
        payload.append(`request_questions[${index}][type]`, question.type)
        payload.append(`request_questions[${index}][required]`, question.required ? '1' : '0')
        question.options.forEach((option, optionIndex) => {
            payload.append(`request_questions[${index}][options][${optionIndex}]`, option)
        })
    })
    form.info_questions.forEach((item, index) => {
        payload.append(`info_questions[${index}][id]`, item.id)
        payload.append(`info_questions[${index}][question]`, item.question)
        payload.append(`info_questions[${index}][answer]`, item.answer)
    })
    Object.entries(form.client_fields).forEach(([field, config]) => {
        payload.append(`client_fields[${field}][collect]`, config.collect ? '1' : '0')
        payload.append(`client_fields[${field}][required]`, config.required ? '1' : '0')
    })
    form.promo_discounts.forEach((discount, index) => {
        payload.append(`promo_discounts[${index}][id]`, discount.id)
        payload.append(`promo_discounts[${index}][label]`, discount.label)
        payload.append(`promo_discounts[${index}][type]`, discount.type)
        payload.append(`promo_discounts[${index}][amount]`, String(discount.amount))
        if (discount.starts_at)
            payload.append(`promo_discounts[${index}][starts_at]`, discount.starts_at)
        if (discount.ends_at) payload.append(`promo_discounts[${index}][ends_at]`, discount.ends_at)
        payload.append(`promo_discounts[${index}][active]`, discount.active ? '1' : '0')
    })
    Object.entries({
        ...form.setup_options,
        guaranteed_delivery_days: form.delivery_days,
    }).forEach(([key, value]) => {
        payload.append(
            `setup_options[${key}]`,
            typeof value === 'boolean' ? (value ? '1' : '0') : String(value ?? '')
        )
    })
    if (form.image) payload.append('image', form.image)
    form.flow.forEach((step, index) => {
        payload.append(`flow[${index}][type]`, step.type)
        payload.append(`flow[${index}][label]`, step.label)
        if (typeof step.percent === 'number')
            payload.append(`flow[${index}][percent]`, String(step.percent))
        if (typeof step.rounds === 'number')
            payload.append(`flow[${index}][rounds]`, String(step.rounds))
    })
    return payload
}
