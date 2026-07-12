import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'

// Dark mode init runs before render.
const authStorage = JSON.parse(localStorage.getItem('auth-storage') ?? '{}')
const savedDark = authStorage?.state?.user?.dark_mode
const localDark = localStorage.getItem('darkMode') === 'true'
const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches

if (savedDark ?? localDark ?? systemDark) {
    document.documentElement.classList.add('dark')
}

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    </StrictMode>
)
