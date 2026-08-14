import { useEffect } from 'react'

const DEFAULT_IMAGE_MAX_MB = 10

export default function GlobalValidationBridge() {
    useEffect(() => {
        const clearError = (input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => {
            input.setCustomValidity('')
            const describedBy = input.dataset.validationErrorId
            if (describedBy) document.getElementById(describedBy)?.remove()
            delete input.dataset.validationErrorId
            input.removeAttribute('aria-invalid')
        }

        const showError = (
            input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
            message: string
        ) => {
            clearError(input)
            const id = `validation-${crypto.randomUUID()}`
            const error = document.createElement('p')
            error.id = id
            error.dataset.globalValidationError = 'true'
            error.className = 'mt-1 text-sm text-destructive'
            error.textContent = message
            input.insertAdjacentElement('afterend', error)
            input.dataset.validationErrorId = id
            input.setAttribute('aria-invalid', 'true')
            input.setCustomValidity(message)
        }

        const onChange = (event: Event) => {
            const input = event.target
            if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement || input instanceof HTMLSelectElement)) return
            clearError(input)

            if (!(input instanceof HTMLInputElement) || input.type !== 'file' || !input.files?.length) return
            const maxMb = Number(input.dataset.maxMb || DEFAULT_IMAGE_MAX_MB)
            const accepted = (input.accept || '').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean)

            for (const file of Array.from(input.files)) {
                if (file.size > maxMb * 1024 * 1024) {
                    input.value = ''
                    showError(input, `File must be ${maxMb} MB or smaller.`)
                    return
                }

                const extension = `.${file.name.split('.').pop()?.toLowerCase()}`
                const allowed = accepted.length === 0 || accepted.some((type) =>
                    type === file.type.toLowerCase()
                    || (type.endsWith('/*') && file.type.toLowerCase().startsWith(type.slice(0, -1)))
                    || type === extension
                )
                if (!allowed) {
                    input.value = ''
                    showError(input, `Unsupported file type. Choose one of: ${accepted.join(', ')}.`)
                    return
                }
            }
        }

        const onApiErrors = (event: Event) => {
            const errors = (event as CustomEvent<Record<string, string[]>>).detail
            Object.entries(errors ?? {}).forEach(([field, messages]) => {
                const escaped = CSS.escape(field)
                const input = document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
                    `[name="${escaped}"], [name="${escaped}[]"]`
                )
                if (input && messages[0]) showError(input, messages[0])
            })
        }

        document.addEventListener('change', onChange, true)
        window.addEventListener('api-validation-error', onApiErrors)
        return () => {
            document.removeEventListener('change', onChange, true)
            window.removeEventListener('api-validation-error', onApiErrors)
        }
    }, [])

    return null
}
