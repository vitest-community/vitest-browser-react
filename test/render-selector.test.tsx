import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, server } from 'vitest/browser'

const testIdAttribute = server.config.browser.locators.testIdAttribute

test('should apply and use a unique testid as the root selector when it does not exists', async () => {
  const screen = await render(<div>Render</div>)
  const selector = page.elementLocator(screen.baseElement).selector

  const regexp = new RegExp(`^internal:testid=\\[${testIdAttribute}="__vitest_\\d+__"s\\]$`)
  expect(selector).toMatch(regexp)
})

test('should apply and use a unique testid as the locator selector when using default container', async () => {
  const screen = await render(<div>Render</div>)

  const regexp = new RegExp(`^internal:testid=\\[${testIdAttribute}="__vitest_\\d+__"s\\]$`)
  expect(screen.locator.selector).toMatch(regexp)
})

test('should apply even if baseElement and container are provided', async () => {
  const customBase = document.createElement('div')
  const customContainer = document.createElement('div')
  customBase.appendChild(customContainer)

  const screen = await render(<div>Render</div>, {
    baseElement: document.body.appendChild(customBase),
    container: customContainer,
  })

  const regexp = new RegExp(`^internal:testid=\\[${testIdAttribute}="__vitest_\\d+__"s\\]$`)
  expect(page.elementLocator(screen.baseElement).selector).toMatch(regexp)
  expect(screen.locator.selector).toMatch(regexp)
})

test('should not override testid attribute if already set', async () => {
  document.body.setAttribute(testIdAttribute, 'custom-id')

  const screen = await render(<div>Render</div>)
  const selector = page.elementLocator(screen.baseElement).selector

  expect(selector).toBe(`internal:testid=[${testIdAttribute}="custom-id"s]`)
})
