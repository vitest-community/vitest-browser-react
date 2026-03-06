# vitest-browser-react

Render React components in Vitest Browser Mode. This library follows `testing-library` principles and exposes only [locators](https://vitest.dev/guide/browser/locators) and utilities that encourage you to write tests that closely resemble how your React components are used.

`vitest-browser-react` aims to deliver a good developer experience in Vitest Browser Mode by incorporating the [locators API](https://vitest.dev/api/browser/locators.html) and [retry-ability](https://vitest.dev/api/browser/assertions.html) mechanism directly into the `render` result. This allows you to call user methods without needing to verify the element's existence or wait for external events (like API calls) to render the element.

Requires `vitest` 4.0.0 or higher.

```tsx
import { render } from 'vitest-browser-react'
import { expect, test } from 'vitest'

test('counter button increments the count', async () => {
  const screen = await render(<Component count={1} />)

  await screen.getByRole('button', { name: 'Increment' }).click()

  await expect.element(screen.getByText('Count is 2')).toBeVisible()
})
```

> 💡 This library doesn't expose React's `act` and uses it only to flush operations happening as part of `useEffect` during initial rendering and unmounting.
Other use cases are handled by [CDP](https://chromedevtools.github.io/devtools-protocol/) and `expect.element` which both have built-in [retry-ability mechanism](https://vitest.dev/guide/browser/assertion-api).

`vitest-browser-react` also exposes `renderHook` helper to test React hooks.

```tsx
import { renderHook } from 'vitest-browser-react'
import { expect, test } from 'vitest'

test('should increment counter', async () => {
  const { result, act } = await renderHook(() => useCounter())

  await act(() => {
    result.current.increment()
  })

  expect(result.current.count).toBe(1)
})
```

`vitest-browser-react` also automatically injects `render` method on the `page`. Example:

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    setupFiles: ['./setup-file.ts'],
    browser: {
      // ... your config
    },
  },
})

// ./setup-file.ts
// add an import at the top of your setup file so TypeScript can pick up types
import 'vitest-browser-react'
```

> 💡 Note that `@vitejs/plugin-react` is recommended for some of React's features to work (like auto importing of `React`). You can also configure [JSX](https://vite.dev/guide/features#jsx) options manually.

```tsx
import { page } from 'vitest/browser'

test('counter button increments the count', async () => {
  const screen = await page.render(<Component count={1} />)

  await screen.cleanup()
})
```

Unlike `@testing-library/react`, `vitest-browser-react` performs cleanup of the component before the test begins, allowing you to see the rendered result in the Browser UI. If you prefer to disable auto-cleanup, you can import the `render` function from `vitest-browser-react/pure`.

## Configuration

You can configure if the component should be rendered in Strict Mode with `configure` method from `vitest-browser-react/pure`:

```ts
import { configure } from 'vitest-browser-react/pure'

configure({
  // disabled by default
  reactStrictMode: true,
})
```

## The difference with `@testing-library/react`

The main difference is that `vitest-browser-react` integrates with Vitest Browser Mode locators: https://github.com/vitest-dev/vitest/discussions/5828#discussioncomment-10314822

One small advantage is that locators are built-in, so this package is just a very lightweight wrapper around Browser Mode, but locators are also good because they provide an intuitive and ergonomic way to query and make assertions:

```ts
await expect.element(page.getByRole('button')).toBeVisible()
```

You can write the same with testing-library:

```ts
const button = await screen.findByRole('button')
expect(button).toBeVisible()

// or
await expect.poll(() => screen.getByRole('button')).toBeVisible()
```

One nice thing that comes out of this approach is that Vitest can keep querying the element _during_ the assertion instead of before. This means that if the element was found, but it has an invalid state, the assertion will continue checking the element until it works. This makes your tests less flaky.

```ts
const button = await screen.findByRole('button')
// it's possible that the element is in the dom with an invalid state
// but it will be valid in a few render cycles
expect(button).toBeVisible()

// even if element is in the dom, it might not be visible yet
// vitest will continue checking the validity
await expect.element(page.getByRole('button')).toBeVisible()
```

Another example is with user-event. Vitest provides a similar API to `testing-library`, but uses [CDP](https://chromedevtools.github.io/devtools-protocol/) instead of faking events which is closer to how browsers work:

```ts
await page.getByRole('button').click()
// or
await userEvent.click(page.getByRole('button'))
```

You can write the same with testing-library:

```ts
const button = await screen.findByRole('button')
await userEvent.click(button)
```

In short, this library integrates well with Vitest Browser Locators API, and that is why it's recommended for the Browser Mode, although you can continue using testing-library if you prefer.

One of the reasons why the Vitest team decided to add our own wrapper was because it became confusing to document all the differences with how testing-library works in Vitest: the dom/render libraries work the same, but user-event is not (except sometimes, such as with the preview provider). Streamlining the API makes it easier to explain and is more approachable for newcomers.

## Special thanks

- Inspired by [`@testing-library/react`](https://github.com/testing-library/react-testing-library)
