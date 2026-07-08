import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import TermsOfServiceSection from './TermsOfServiceSection'
import TermsOfServiceNotice from './TermsOfServiceNotice'

const SECTIONS = [
    {
        number: '01',
        title: 'Using Later N Comix',
        quote: '"a place built for readers and creators alike 🏮"',
        items: [
            {
                title: 'Who Can Use It',
                text: 'Later N Comix is open to anyone who wants to read, discover, or publish comics and novels.',
                warn: false,
            },
            {
                title: 'Your Account',
                text: 'You are responsible for keeping your account credentials secure. Do not share your password with anyone.',
                warn: false,
            },
            {
                title: 'Accurate Info',
                text: 'You agree to provide accurate information when registering. Fake or misleading accounts may be removed.',
                warn: false,
            },
            {
                title: 'One Account Per Person',
                text: 'Creating multiple accounts to evade a ban or abuse the platform is strictly prohibited.',
                warn: true,
            },
        ],
    },
    {
        number: '02',
        title: 'Content Standards',
        quote: '"keep it creative, keep it safe ✨"',
        items: [
            {
                title: 'No Explicit Content',
                text: 'Sexually explicit or suggestive content is not allowed — especially anything involving minors. Absolute rule, no exceptions.',
                warn: true,
            },
            {
                title: 'No Hate Speech',
                text: 'Content promoting hate speech, discrimination, harassment, or targeted abuse is strictly prohibited.',
                warn: true,
            },
            {
                title: 'No Plagiarism',
                text: 'You must not upload content you do not own or have rights to publish. Stolen works will be removed immediately.',
                warn: true,
            },
            {
                title: 'Violence Guidelines',
                text: 'Comic-style drawn violence is permitted within reason. Real photographs or realistic depictions of gore or graphic injury are strictly prohibited.',
                warn: false,
            },
        ],
    },
    {
        number: '03',
        title: 'Reader Conduct',
        quote: null,
        items: [
            {
                title: 'Comments & Reviews',
                text: 'Be respectful in comments and reviews. Harassment, hate speech, or spam directed at creators or readers will result in account action.',
                warn: false,
            },
            {
                title: 'No Circumventing Locks',
                text: 'Attempting to bypass, exploit, or share locked chapter content without purchasing is a violation of these terms.',
                warn: true,
            },
            {
                title: 'Reporting',
                text: 'If you see content that violates these terms, use the report button. False or malicious reports may result in account suspension.',
                warn: false,
            },
        ],
    },
    {
        number: '04',
        title: 'Earnings & Payments',
        quote: '"creators deserve to be paid for their work 💛"',
        items: [
            {
                title: 'How You Earn',
                text: 'You earn credits when readers purchase your locked chapters. Earnings accumulate in your creator wallet.',
                warn: false,
            },
            {
                title: 'Platform Fee',
                text: 'Later N Comix takes a platform fee from each transaction to cover hosting, payment processing, and maintenance.',
                warn: false,
            },
            {
                title: 'Withdrawals',
                text: 'Earnings are withdrawable once you reach the minimum threshold. Processing times may vary by payment method.',
                warn: false,
            },
            {
                title: 'No Fraud',
                text: 'Manipulating earnings, generating fake purchases, or exploiting the payment system results in permanent removal and potential legal action.',
                warn: true,
            },
        ],
    },
    {
        number: '05',
        title: 'Merchandise Advertising',
        quote: null,
        items: [
            {
                title: "What's Allowed",
                text: 'You may advertise your own merchandise below chapter images. Ads must be directly related to your published work.',
                warn: false,
            },
            {
                title: 'Honest Advertising',
                text: 'All ads must be accurate and not misleading. You are responsible for fulfilling any orders from your own store.',
                warn: false,
            },
            {
                title: 'Removal Rights',
                text: 'Later N Comix reserves the right to remove any advertisement that violates these guidelines without prior notice.',
                warn: false,
            },
        ],
    },
    {
        number: '06',
        title: 'Intellectual Property',
        quote: '"your story, your rights 📝"',
        items: [
            {
                title: 'You Own Your Work',
                text: 'All content you publish remains your intellectual property. Later N Comix does not claim ownership of your comics or novels.',
                warn: false,
            },
            {
                title: 'License to Display',
                text: 'By publishing, you grant Later N Comix a non-exclusive license to display, host, and distribute your work on the platform.',
                warn: false,
            },
            {
                title: 'Removing Your Work',
                text: 'You can unpublish or delete your work from your Studio at any time. Removal takes effect within 30 days.',
                warn: false,
            },
            {
                title: 'DMCA',
                text: 'If you believe your copyrighted work was uploaded without permission, contact dev@devorbitstudio.com / support@laterncomix.com with proof of ownership.',
                warn: false,
            },
        ],
    },
    {
        number: '07',
        title: 'Violations & Consequences',
        quote: '"we take our community seriously 🛡️"',
        items: [
            {
                title: 'Minor Violations',
                text: 'Minor violations such as low-quality spam or borderline content may result in content removal or a temporary suspension.',
                warn: false,
            },
            {
                title: 'Severe Violations',
                text: 'Uploading real photographs of gore, murder, or graphic violence will result in permanent account removal with no appeal.',
                warn: true,
            },
            {
                title: 'Content Involving Minors',
                text: 'Any sexual or suggestive content involving minors results in an immediate permanent ban and will be reported to relevant authorities.',
                warn: true,
            },
            {
                title: 'Ban Evasion',
                text: 'Creating a new account after a permanent ban is itself a violation. All associated accounts will be removed.',
                warn: true,
            },
        ],
    },
    {
        number: '08',
        title: 'Changes to These Terms',
        quote: null,
        items: [
            {
                title: "We'll Notify You",
                text: 'Later N Comix reserves the right to update these terms at any time. Significant changes will be communicated via email or an on-site banner.',
                warn: false,
            },
            {
                title: 'Continued Use',
                text: 'Continuing to use Later N Comix after an update means you accept the revised terms.',
                warn: false,
            },
            {
                title: 'Questions',
                text: 'For any questions about these terms, reach us at dev@devorbitstudio.com / support@laterncomix.com',
                warn: false,
            },
        ],
    },
]

interface Props {
    onBack: () => void
}

export default function TermsOfServiceView({ onBack }: Props) {
    return (
        <div className="max-w-2xl mx-auto mt-20">
            <div className="bg-white lg:bg-card rounded-xl px-4 py-5 my-6 mx-5 border">
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
                    <h1 className="text-xl font-bold">Terms of Service</h1>
                    <p className="text-xs text-muted-foreground mt-1">
                        By using Later N Comix, you agree to these terms — last updated 2025.
                    </p>
                </div>

                <Separator className="mb-6" />

                {/* Sections */}
                <div className="flex flex-col gap-6">
                    {SECTIONS.map((section) => (
                        <TermsOfServiceSection key={section.number} section={section} />
                    ))}
                </div>

                {/* Notice */}
                <div className="my-6">
                    <TermsOfServiceNotice />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-sm md:text-base text-muted-foreground/40 tracking-widest uppercase text-[10px]">
                        Terms of Service · V1.0
                    </span>
                    <span className="text-sm md:text-base text-muted-foreground/40 tracking-widest uppercase text-[10px]">
                        Later N Comix Publishing
                    </span>
                </div>
            </div>
        </div>
    )
}
