import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

import BecomeCreatorSection from './BecomeCreatorSection'
import BecomeCreatorNotice from './BecomeCreatorNotice'
import BecomeCreatorAgreement from './BecomeCreatorAgreement'
import BecomeCreatorAlreadyBadge from './BecomeCreatorAlreadyBadge'

const sections = [
    {
        number: '01',
        title: 'Content Standards',
        items: [
            {
                text: 'Comic-style drawn violence is permitted within reason — action scenes, dramatic battles, stylized gore are fine.',
                warn: false,
            },
            {
                text: 'Real photographs or realistic depictions of gore, murder, or graphic injury are strictly prohibited.',
                warn: true,
            },
            {
                text: 'Sexually explicit or suggestive content is not allowed — especially anything involving minors.',
                warn: true,
            },
            {
                text: 'Hate speech, discrimination, harassment, or content that targets individuals or groups is banned.',
                warn: true,
            },
            {
                text: 'Plagiarism is strictly forbidden. Only upload content you own or have rights to.',
                warn: false,
            },
        ],
    },
    {
        number: '02',
        title: 'Earnings & Credits',
        items: [
            {
                text: 'You earn credits when readers purchase access to your locked chapters.',
                warn: false,
            },
            {
                text: 'Later N Comix collects a platform fee from each transaction to keep the lights on.',
                warn: false,
            },
            {
                text: 'Earnings are withdrawable once you reach the minimum threshold set by Later N Comix.',
                warn: false,
            },
            {
                text: 'Fraudulent purchases or manipulation of the credit system will result in immediate account removal.',
                warn: true,
            },
        ],
    },
    {
        number: '03',
        title: 'Merchandise Advertising',
        items: [
            {
                text: 'You may place merchandise ads below your chapter images — promote your own stuff!',
                warn: false,
            },
            {
                text: 'Ads must be relevant to your work. No misleading, deceptive, or third-party promotions.',
                warn: false,
            },
            {
                text: 'Later N Comix reserves the right to remove any ad that violates community guidelines.',
                warn: false,
            },
        ],
    },
    {
        number: '04',
        title: 'Violations & Consequences',
        items: [
            {
                text: 'Minor violations may result in content removal or a temporary suspension.',
                warn: false,
            },
            {
                text: 'Severe violations — especially uploading real photographs of gore, murder, or graphic violence — will result in permanent account removal with no appeal.',
                warn: true,
            },
            {
                text: 'Repeated offenses of any kind escalate to permanent removal regardless of severity.',
                warn: true,
            },
            {
                text: 'Later N Comix reserves the right to update these terms at any time. Continued use means acceptance.',
                warn: false,
            },
        ],
    },
]

interface Props {
    agreed: boolean
    loading: boolean
    alreadyCreator: boolean
    showWarning: boolean
    onToggle: () => void
    onSubmit: () => void
    onBack: () => void
}

export default function BecomeCreatorView({
    agreed,
    loading,
    alreadyCreator,
    showWarning,
    onToggle,
    onSubmit,
    onBack,
}: Props) {
    return (
        <div className="max-w-2xl mx-auto mt-5 lg:mt-20">
            <div className="bg-white dark:bg-card rounded-xl px-4 py-5 my-6 mx-5">
                {/* Header */}
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-2 text-muted-foreground hover:text-foreground mb-2"
                        onClick={onBack}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Go back
                    </Button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold">Storyteller Agreement</h1>
                        {alreadyCreator && <BecomeCreatorAlreadyBadge />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Read and agree to the following before publishing on Later N Comix.
                    </p>
                </div>

                <Separator className="mb-6" />

                {/* Sections */}
                <div className="flex flex-col gap-6">
                    {sections.map((section) => (
                        <div key={section.number}>
                            <BecomeCreatorSection section={section} />
                            <Separator className="mt-6" />
                        </div>
                    ))}
                </div>

                {/* Notice */}
                <div className="my-6">
                    <BecomeCreatorNotice />
                </div>

                {/* Agreement */}
                <BecomeCreatorAgreement
                    agreed={agreed}
                    loading={loading}
                    alreadyCreator={alreadyCreator}
                    showWarning={showWarning}
                    onToggle={onToggle}
                    onSubmit={onSubmit}
                    onBack={onBack}
                />
            </div>
        </div>
    )
}
