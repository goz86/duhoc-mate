import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import obfuscator from 'vite-plugin-javascript-obfuscator'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    obfuscator({
      apply: 'build',
      exclude: [/node_modules/],
      options: {
        compact: true,
        controlFlowFlattening: false,
        controlFlowFlatteningThreshold: 0,
        numbersToExpressions: false,
        simplify: true,
        stringArray: true,
        stringArrayShuffle: true,
        stringArrayThreshold: 0.35,
        splitStrings: false,
        splitStringsChunkLength: 10,
      },
    }),
  ],
  build: {
    sourcemap: false,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})

