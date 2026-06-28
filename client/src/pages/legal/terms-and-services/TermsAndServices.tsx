import { useNavigate } from 'react-router-dom'
import TermsOfServiceView from './TermsOfServiceView'

export default function TermsOfService() {
    const navigate = useNavigate()
    return <TermsOfServiceView onBack={() => navigate(-1)} />
}
