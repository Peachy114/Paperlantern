import HeroSectionView from './hero-section/HeroSectionView'

interface Props {
    audience?: 'public' | 'studio'
}

export default function HeroSection({ audience }: Props) {
    return <HeroSectionView audience={audience} />
}
