import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface Props {
    agreed: boolean
    loading: boolean
    alreadyCreator: boolean
    showWarning: boolean
    onToggle: () => void
    onSubmit: () => void
    onBack: () => void
}

export default function BecomeCreatorAgreement({
    agreed,
    loading,
    alreadyCreator,
    showWarning,
    onToggle,
    onSubmit,
    onBack,
}: Props) {
    return (
        <div className="flex flex-col gap-4">
            {showWarning && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Please read and agree to the terms first.</AlertDescription>
                </Alert>
            )}

            <div className="flex items-start gap-3">
                <Checkbox
                    id="agree"
                    checked={agreed || alreadyCreator}
                    disabled={alreadyCreator}
                    onCheckedChange={onToggle}
                />
                <Label
                    htmlFor="agree"
                    className="text-xs md:text-sm leading-relaxed text-muted-foreground cursor-pointer"
                >
                    I have read and agree to the Later N Comix Storyteller Agreement. I understand
                    that violations may result in permanent account removal.
                </Label>
            </div>

            <div className="flex items-center gap-3 pt-2">
                <Button onClick={onSubmit} disabled={loading || alreadyCreator}>
                    {loading
                        ? 'Signing...'
                        : alreadyCreator
                          ? 'Already signed ✓'
                          : 'Sign & become a storyteller'}
                </Button>
                <Button variant="ghost" size="sm" onClick={onBack}>
                    ← Go back
                </Button>
            </div>
        </div>
    )
}
