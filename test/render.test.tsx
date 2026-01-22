import { expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { Button } from 'react-aria-components'
import React, { Suspense } from 'react'
import { render } from 'vitest-browser-react'
import { HelloWorld } from './fixtures/HelloWorld'
import { Counter } from './fixtures/Counter'
import { SuspendedHelloWorld } from './fixtures/SuspendedHelloWorld'

test('renders simple component', async () => {
  const screen = await render(<HelloWorld />)
  await expect.element(page.getByText('Hello World')).toBeVisible()

  screen.container.setAttribute('data-testid', 'stable-snapshot')
  expect(screen.container).toMatchSnapshot()
})

test('renders counter', async () => {
  const screen = await render(<Counter initialCount={1} />)

  await expect.element(screen.getByText('Count is 1')).toBeVisible()
  await screen.getByRole('button', { name: 'Increment' }).click()
  await expect.element(screen.getByText('Count is 2')).toBeVisible()
})

test('should fire the onPress/onClick handler', async () => {
  const handler = vi.fn()
  const screen = await page.render(<Button onPress={handler}>Button</Button>)
  await userEvent.click(screen.getByRole('button'))
  // await screen.getByRole('button').click()
  expect(handler).toHaveBeenCalled()
})

test('waits for suspended boundaries', async ({ onTestFinished }) => {
  vi.useFakeTimers()
  onTestFinished(() => {
    vi.useRealTimers()
  })

  const fakeCacheLoadPromise = new Promise<void>((resolve) => {
    setTimeout(() => resolve(), 100)
  })

  const result = render(<SuspendedHelloWorld name="Vitest" promise={fakeCacheLoadPromise} />, {
    wrapper: ({ children }) => (
      <Suspense fallback={<div>Suspended!</div>}>{children}</Suspense>
    ),
  })
  await expect.element(page.getByText('Suspended!')).toBeInTheDocument()
  vi.runAllTimers()
  await result
  expect(page.getByText('Hello Vitest')).toBeInTheDocument()
})

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
  document.body.setAttribute('data-testid', 'custom-id')

  const screen = await render(<div>Render</div>)
  const selector = page.elementLocator(screen.baseElement).selector

  expect(selector).toBe(`internal:testid=[data-testid="custom-id"s]`)
})
