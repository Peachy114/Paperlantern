import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        rolldownOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('framer-motion')) return 'vendor-motion'
                        if (id.includes('@tanstack')) return 'vendor-query'
                        if (id.includes('@radix-ui') || id.includes('radix-ui'))
                            return 'vendor-radix'
                        if (
                            id.includes('react-hook-form') ||
                            id.includes('@hookform') ||
                            id.includes('yup')
                        )
                            return 'vendor-forms'
                        if (id.includes('react-router-dom')) return 'vendor-router'
                        if (id.includes('react-icons') || id.includes('lucide-react'))
                            return 'vendor-icons'
                        if (id.includes('zustand')) return 'vendor-state'
                        if (id.includes('react') || id.includes('react-dom')) return 'vendor-react'
                        return 'vendor-misc'
                    }
                },
            },
        },
    },
})
