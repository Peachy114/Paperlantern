import { AboutHero } from './AboutHero'
import { AboutOrigin } from './AboutOrigin'
import { AboutTeam, type TeamMember } from './AboutTeam'
import { AboutComix, type ComixType } from './AboutComix'
import { AboutArtists, type ArtistCard } from './AboutArtists'
import { AboutFooter } from './AboutFooter'

const TEAM: TeamMember[] = [
    {
        role: 'Lead Developer',
        name: 'Fatma',
        note: 'built this with too much coffee ☕',
    },
    {
        role: 'UI / Design',
        name: 'Haya',
        note: 'every pixel placed with love 🎨',
    },
    {
        role: 'Backend',
        name: 'Hajar',
        note: 'databases are my love language 🗄️',
    },
]

const COMIX_TYPES: ComixType[] = [
    {
        emoji: '🎨',
        title: 'Webtoon',
        text: 'Upload your panels chapter by chapter. Build a readership that comes back every update.',
    },
    {
        emoji: '📖',
        title: 'Novel',
        text: 'Write and publish your story one chapter at a time. Readers follow along as you go.',
    },
]

const ARTIST_CARDS: ArtistCard[] = [
    {
        emoji: '🖊️',
        title: 'Webtoon Artist',
        text: 'Post your art style, share sample pages, and let readers know you take commissions.',
    },
    {
        emoji: '✍️',
        title: 'Novel Writer',
        text: 'Share your writing samples and open commissions for custom stories or worldbuilding.',
    },
    {
        emoji: '🧑‍🎨',
        title: 'Character Artist',
        text: 'Post your commission sheet, set your rates, and get hired to bring characters to life.',
    },
]

export default function About() {
    return (
        <div className="max-w-2xl mx-auto px-4 py-12 mt-16">
            <AboutHero />
            <AboutOrigin />
            <AboutComix types={COMIX_TYPES} />
            <AboutArtists cards={ARTIST_CARDS} />
            <AboutTeam team={TEAM} />
            <AboutFooter />
        </div>
    )
}
