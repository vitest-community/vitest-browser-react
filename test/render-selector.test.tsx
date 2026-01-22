import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, server } from 'vitest/browser'

test('should apply and use a unique testid as the root selector when it does not exists', async () => {
  const screen = await render(<div>Render</div>)

  const selector = page.elementLocator(screen.baseElement).selector

  expect(selector).toMatch(/^internal:testid=\[[^\]]*\]$/)
})

test('should apply and use a unique testid as the locator selector when using default container', async () => {
  const screen = await render(<div>Render</div>)

  expect(screen.locator.selector).toMatch(/^internal:testid=\[[^\]]*\]$/)
})

test('should not override testid attribute if already set', async () => {
  document.body.setAttribute(server.config.browser.locators.testIdAttribute, 'custom-id')

  const screen = await render(<div>Render</div>)
  const selector = page.elementLocator(screen.baseElement).selector

  expect(selector).toBe(`internal:testid=[${server.config.browser.locators.testIdAttribute}="custom-id"s]`)
})
