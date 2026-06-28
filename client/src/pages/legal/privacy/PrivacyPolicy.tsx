import {
    Database,
    Settings,
    Eye,
    Brush,
    Cookie,
    KeyRound,
    Shield,
    Lock,
    type LucideIcon,
} from 'lucide-react'
import { PolicyHeader } from './PolicyHeader'
import { PolicySection, type PolicyItem } from './PolicySection'
import { PolicyFooter } from './PolicyFooter'

interface Section {
    title: string
    icon: LucideIcon
    items: PolicyItem[]
}

const SECTIONS: Section[] = [
    {
        title: 'Data We Collect',
        icon: Database,
        items: [
            {
                text: 'Your name, username, email address, and password. Passwords are hashed — we never store or see them in plain text.',
                warn: false,
            },
            {
                text: 'Bookmarks, reading history, liked chapters, and your progress on stories you follow.',
                warn: false,
            },
            {
                text: 'Comments and reviews you leave are stored and visible to other users on the platform.',
                warn: false,
            },
            {
                text: 'Browser type, device, and IP address are collected automatically when you visit Later N Comix.',
                warn: false,
            },
        ],
    },
    {
        title: 'How We Use It',
        icon: Settings,
        items: [
            {
                text: 'To manage your account, display your reading history, and keep all features working smoothly.',
                warn: false,
            },
            {
                text: 'To notify you when a story you follow gets a new chapter — only if you opt in.',
                warn: false,
            },
            {
                text: 'To detect spam, enforce policy violations, and keep the community a safe place for everyone.',
                warn: false,
            },
            { text: 'To suggest comics and novels based on what you read and save.', warn: false },
        ],
    },
    {
        title: "What's Public vs Private",
        icon: Eye,
        items: [
            {
                text: 'PUBLIC — Your username, comments, reviews, and any profile info you choose to display are visible to all users.',
                warn: false,
            },
            {
                text: 'PRIVATE — Your email address, password, IP address, and payment info are never visible to other users.',
                warn: false,
            },
            {
                text: 'We will never publicly display your private information without your explicit consent.',
                warn: true,
            },
        ],
    },
    {
        title: 'Creator Accounts',
        icon: Brush,
        items: [
            {
                text: 'Everything you publish belongs to you. Later N Comix only has a license to display your work on the platform.',
                warn: false,
            },
            {
                text: 'If you delete your account, your published works will be removed from public view within 30 days.',
                warn: false,
            },
            {
                text: 'Transaction history and withdrawal records are kept for up to 2 years for accounting and dispute purposes.',
                warn: false,
            },
        ],
    },
    {
        title: 'Cookies',
        icon: Cookie,
        items: [
            {
                text: 'Session cookies keep you logged in between visits. Without them you would need to log in every page.',
                warn: false,
            },
            {
                text: 'Preference cookies save your dark mode setting so the site looks right every time you return.',
                warn: false,
            },
            {
                text: 'We do not use third-party advertising cookies. We do not sell your data. Ever.',
                warn: true,
            },
        ],
    },
    {
        title: 'Your Rights',
        icon: KeyRound,
        items: [
            {
                text: 'You can request a copy of the data we hold about you at any time by contacting us.',
                warn: false,
            },
            {
                text: 'You can update your username, email, and profile directly from your account settings.',
                warn: false,
            },
            {
                text: 'You can delete your account from settings. Your personal data will be removed within 30 days.',
                warn: false,
            },
            { text: 'For any privacy requests, reach us at support@laterncomix.com', warn: false },
        ],
    },
    {
        title: 'DMCA & Copyright',
        icon: Shield,
        items: [
            {
                text: 'If you believe your work has been uploaded without permission, contact us and we will investigate promptly.',
                warn: false,
            },
            {
                text: 'Accounts found repeatedly uploading stolen content will be permanently removed with no appeal.',
                warn: true,
            },
            {
                text: 'Send DMCA takedown requests to support@laterncomix.com with proof of ownership.',
                warn: false,
            },
        ],
    },
    {
        title: 'Security',
        icon: Lock,
        items: [
            {
                text: 'All passwords are hashed using industry-standard encryption. We cannot see your password in plain text.',
                warn: false,
            },
            {
                text: 'All data between you and Later N Comix is encrypted in transit via HTTPS.',
                warn: false,
            },
            {
                text: 'If a data breach occurs, we will notify affected users within 72 hours.',
                warn: false,
            },
        ],
    },
]

export default function PrivacyPolicy() {
    return (
        <div className="max-w-2xl mx-auto px-4 py-12">
            <PolicyHeader />
            <div className="space-y-3">
                {SECTIONS.map((section, i) => (
                    <PolicySection
                        key={section.title}
                        index={i + 1}
                        title={section.title}
                        icon={section.icon}
                        items={section.items}
                    />
                ))}
            </div>
            <PolicyFooter />
        </div>
    )
}
