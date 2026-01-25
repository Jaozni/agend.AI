import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      manifest: {
        name: 'Agend.AI',
        short_name: 'Agend.AI',
        description: 'Gerencie seus plantões, aulas e eventos pessoais com facilidade.',
        theme_color: '#2563eb', // Blue-600
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'vite.svg', // Placeholder temporário
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  server: {
    host: true, // Expor para a rede local (acessar pelo celular)
    https: true // Forçar HTTPS
  }
})
