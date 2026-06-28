import studioImg from '@/assets/images/studio.png'
import admin_wanderer from '@/assets/images/admin_wanderer.png'

interface Props {
    isStoryteller: boolean
}

export default function ProfileNews({ isStoryteller }: Props) {
    return (
        <img
            src={isStoryteller ? studioImg : admin_wanderer}
            alt={isStoryteller ? 'Studio' : 'Profile'}
            className="w-full object-cover rounded-md"
        />
    )
}
