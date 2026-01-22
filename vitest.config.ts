import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: { include: ['vitest-browser-react'] },
  test: {
    projects: [
      {
        extends: true,
        test: { name: 'prod' },
      },
      {
        extends: true,
        test: { name: 'dev' },
        resolve: { conditions: ['vdev'] },
      },
      {
        extends: true,
        test: { name: 'selector-custom-attr', include: ['test/render-selector.test.tsx'], browser: { locators: { testIdAttribute: 'data-custom-test-id' } } },
      },
    ],
    printConsoleTrace: true,
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [
        { browser: 'chromium' },
      ],
    },
  },
})
