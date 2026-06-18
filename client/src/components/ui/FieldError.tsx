// components/ui/FieldError.tsx

interface FieldErrorProps {
  fieldErrors: Record<string, string>
  field: string
  className?: string
}

export default function FieldError({ fieldErrors, field, className = '' }: FieldErrorProps) {
  const message = fieldErrors[field]
  if (!message) return null
  return (
    <p className={`text-xs text-red-500 dark:text-red-400 mt-1 ${className}`}>
      {message}
    </p>
  )
}