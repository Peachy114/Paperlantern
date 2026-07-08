import { useState } from 'react'
import { ticketsApi } from '../api/tickets'
import { type CreateTicketPayload } from '../types/tickets'

export function useCreateTicket() {
    const [errors, setErrors] = useState<Record<string, string[]>>({})
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)

    const createTicket = async (payload: CreateTicketPayload) => {
        setSubmitting(true)
        setErrors({})
        setSuccess(false)

        try {
            await ticketsApi.create(payload)
            setSuccess(true)
            return true
        } catch (err: any) {
            if (err?.response?.status === 422) {
                setErrors(err.response.data.errors ?? {})
            } else {
                setErrors({ general: ['Something went wrong. Please try again.'] })
            }
            return false
        } finally {
            setSubmitting(false)
        }
    }

    return { createTicket, errors, submitting, success }
}
