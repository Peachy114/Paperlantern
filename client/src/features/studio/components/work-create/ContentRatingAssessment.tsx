import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

type RatingKey = 'violence' | 'sexual_content' | 'nudity' | 'profanity' | 'substances'

interface Props {
    values: Record<RatingKey, string>
    sensitivityFlags: string[]
    agreement: boolean
    errors: Record<string, string>
    onRatingChange: (field: RatingKey, value: string) => void
    onSensitivityToggle: (flag: string) => void
    onAgreementChange: (checked: boolean) => void
}

const ratingGroups: Array<{
    key: RatingKey
    label: string
    options: string[]
}> = [
    {
        key: 'violence',
        label: 'Violence',
        options: [
            'No violent content, blood, or gore.',
            'Mild action or fantasy injury appears occasionally.',
            'Recurring violent themes with moderate blood or injury.',
            'Detailed violence, blood, gore, or intense harm.',
        ],
    },
    {
        key: 'sexual_content',
        label: 'Sexual themes',
        options: [
            'No sexual content or sexual themes.',
            'Mild romantic or suggestive themes.',
            'Occasional sexual references, innuendo, or suggestive scenes.',
            'Frequent sexual themes or strongly suggestive content.',
        ],
    },
    {
        key: 'nudity',
        label: 'Nudity',
        options: [
            'No partial or full nudity.',
            'Non-sexual minimal clothing such as swimwear or underwear.',
            'Comedic or non-explicit nudity with clear censoring.',
            'Sexualized posing, fan-service imagery, or suggestive nudity.',
        ],
    },
    {
        key: 'profanity',
        label: 'Profanity',
        options: [
            'No profanity.',
            'Censored profanity appears occasionally.',
            'Occasional uncensored or partially censored profanity.',
            'Frequent uncensored profanity.',
        ],
    },
    {
        key: 'substances',
        label: 'Alcohol, drugs, or tobacco',
        options: [
            'No alcohol, tobacco, or drug references.',
            'Brief mentions only.',
            'Implied or mild use.',
            'Moderate, excessive, or recurring depiction of use.',
        ],
    },
]

const sensitivityGroups = [
    {
        title: 'Abuse or exploitation themes',
        description:
            'Content that depicts abuse, exploitation, or harm involving minors, animals, or vulnerable people.',
        flags: [
            ['animal_abuse', 'Animal abuse'],
            ['child_abuse', 'Child abuse'],
            ['domestic_abuse', 'Domestic abuse'],
            ['sexual_abuse', 'Sexual abuse'],
        ],
    },
    {
        title: 'Self-harm or mental health crisis themes',
        description:
            'Content involving eating disorders, self-harm, suicide, or serious mental health crises.',
        flags: [
            ['eating_disorder', 'Eating disorder'],
            ['mental_health', 'Mental health crisis'],
            ['self_harm', 'Self-harm'],
            ['suicide', 'Suicide'],
        ],
    },
    {
        title: 'Extremism, organized crime, or political violence',
        description:
            'Content that includes extremist activity, terrorism, organized crime, or politically motivated violence.',
        flags: [
            ['extremism', 'Extremism'],
            ['organized_crime', 'Organized crime'],
            ['political_content', 'Political violence'],
            ['terrorism', 'Terrorism'],
        ],
    },
    {
        title: 'Risk behavior or harmful conduct',
        description:
            'Content involving bullying, gambling, substance abuse, or illegal trafficking.',
        flags: [
            ['bullying', 'Bullying'],
            ['gambling', 'Gambling'],
            ['substance_abuse', 'Substance abuse'],
            ['drug_trafficking', 'Drug trafficking'],
        ],
    },
]

export default function ContentRatingAssessment({
    values,
    sensitivityFlags,
    agreement,
    errors,
    onRatingChange,
    onSensitivityToggle,
    onAgreementChange,
}: Props) {
    return (
        <section className="rounded-lg border border-border bg-card p-5 space-y-5">
            <div className="space-y-2">
                <h2 className="text-lg font-semibold">Content Rating Self-Assessment</h2>
                <p className="text-sm text-muted-foreground">
                    Every series needs a clear content rating so readers can make informed choices.
                    Answer honestly based on the full series plan. Ratings and availability may be
                    adjusted later if required by policy or local law.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {ratingGroups.map((group) => {
                    const error = errors[`content_rating_assessment.${group.key}`]
                    return (
                        <div key={group.key} className="space-y-2">
                            <Label>{group.label}</Label>
                            {error && <p className="text-xs text-destructive">{error}</p>}
                            <Select
                                value={values[group.key]}
                                onValueChange={(value) => onRatingChange(group.key, value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Please select one" />
                                </SelectTrigger>
                                <SelectContent>
                                    {group.options.map((option, index) => (
                                        <SelectItem key={option} value={String(index)}>
                                            {index}: {option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )
                })}
            </div>

            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-semibold">Regional and Cultural Sensitivities</h3>
                    <p className="text-sm text-muted-foreground">
                        Some topics may require age limits or regional restrictions. Check any that
                        apply to your series.
                    </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    {sensitivityGroups.map((group) => (
                        <div key={group.title} className="rounded-lg border border-border p-4">
                            <p className="text-sm font-medium">{group.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {group.description}
                            </p>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                {group.flags.map(([value, label]) => (
                                    <label
                                        key={value}
                                        className="flex items-center gap-2 text-sm text-foreground"
                                    >
                                        <Checkbox
                                            checked={sensitivityFlags.includes(value)}
                                            onCheckedChange={() => onSensitivityToggle(value)}
                                        />
                                        <span>{label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <label className="flex items-start gap-3 rounded-lg bg-muted/30 p-4 text-sm">
                <Checkbox
                    checked={agreement}
                    onCheckedChange={(checked) => onAgreementChange(Boolean(checked))}
                />
                <span>
                    I confirm that this self-assessment is accurate to the best of my knowledge and
                    that my series will follow LaterNComix community and upload policies.
                    {errors.content_rating_agreement && (
                        <span className="mt-1 block text-xs text-destructive">
                            {errors.content_rating_agreement}
                        </span>
                    )}
                </span>
            </label>
        </section>
    )
}
