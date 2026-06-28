import HeroSectionView from './hero-section/HeroSectionView'
import type { HeroWork } from './hero-section/hero.types'

interface Props {
    hero: HeroWork[]
    cover: (path: string | null) => string | null
    audience?: 'public' | 'studio'
}

export default function HeroSection({ hero, cover, audience }: Props) {
    return <HeroSectionView hero={hero} cover={cover} audience={audience} />
}
