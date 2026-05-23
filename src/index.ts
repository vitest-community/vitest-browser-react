import { page } from 'vitest/browser'
import { beforeEach } from 'vitest'
import { cleanup, render, renderHook } from './pure'

export { render, renderHook, cleanup } from './pure'
export type { ComponentRenderOptions, RenderHookOptions, RenderHookResult, RenderOptions, RenderResult } from './pure'

page.extend({
  render,
  renderHook,
  [Symbol.for('vitest:component-cleanup')]: cleanup,
})

beforeEach(async () => {
  await cleanup()
})

declare module 'vitest/browser' {
  interface BrowserPage {
    render: typeof render
    renderHook: typeof renderHook
  }
}
