import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  plugins: [
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    viteReact(),
  ],
  base: '/earthquake-web-demo/',
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
  },
})

export default config
