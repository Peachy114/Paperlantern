import ProfileView from '../profile/ProfileView'

type ProfileProps = {
    open: boolean
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
    buttonRef: React.RefObject<HTMLButtonElement | null>
}

export default function Profile({ open, setOpen, buttonRef }: ProfileProps) {
    return <ProfileView open={open} setOpen={setOpen} buttonRef={buttonRef} />
}
