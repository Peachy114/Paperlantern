import SettingHeader from '../components/SettingHeader'
import SettingTable from '../components/SettingTable'

const rows = [{ label: 'Profile', to: '/settings/profile' }]
export default function SettingView() {
    return (
        <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-4">
            <SettingHeader title="Settings" />
            <SettingTable rows={rows} />
        </div>
    )
}
