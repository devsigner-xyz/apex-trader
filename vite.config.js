import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createMarketDataMiddleware } from './server/marketDataMiddleware.mjs'

function marketDataApi() {
  return {
    name: 'apex-market-data-api',
    configureServer(server) {
      server.middlewares.use(createMarketDataMiddleware())
    }
  }
}

export default defineConfig({
  plugins: [react(), marketDataApi()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
