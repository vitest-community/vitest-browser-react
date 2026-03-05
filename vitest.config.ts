import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['vitest-browser-react'],
    force: true,
  },
  test: {
    projects: [
      {
        extends: true,
        test: { name: 'react' },
      },
      {
        extends: true,
        test: {
          name: 'custom-attr',
          include: ['test/render-selector.test.tsx'],
          browser: {
            locators: {
              testIdAttribute: 'data-custom-test-id',
            },
          },
        },
      },
    ],
    printConsoleTrace: true,
    browser: {
      enabled: true,
      viewport: { width: 500, height: 600 },
      provider: playwright({
        actionTimeout: 3000,
        contextOptions: {
          viewport: { width: 500, height: 600 },
        },
      }),
      instances: [
        { browser: 'chromium' },
      ],
    },
  },
})
