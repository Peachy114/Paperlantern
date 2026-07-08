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
    server: {
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
            },
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

                        // Isolate the heavy, page-specific libraries into their own chunks
                        // instead of dumping them into one shared vendor-misc bucket.
                        if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts'
                        if (id.includes('xlsx')) return 'vendor-xlsx'
                        if (id.includes('@reduxjs/toolkit') || id.includes('redux'))
                            return 'vendor-redux'
                        if (id.includes('@dnd-kit')) return 'vendor-dnd'
                        if (id.includes('embla-carousel')) return 'vendor-carousel'
                        if (id.includes('date-fns')) return 'vendor-dates'

                        // Let everything else auto-chunk naturally (small, truly shared deps)
                        return undefined
                    }
                },
            },
        },
    },
})
