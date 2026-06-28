import { useNavigate } from 'react-router-dom'
import CookiesPolicy from './CookiesPolicy'

export default function CookiesPolicyPage() {
    const navigate = useNavigate()
    return <CookiesPolicy onBack={() => navigate(-1)} />
}
