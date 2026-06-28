interface Props {
    title: string
}

export default function SettingHeader({ title }: Props) {
    return <h1 className="text-xl font-bold">{title}</h1>
}
