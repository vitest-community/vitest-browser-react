import type { Locator, LocatorSelectors, PrettyDOMOptions } from 'vitest/browser'
import { page, server, utils } from 'vitest/browser'
import React from 'react'
import type { Container } from 'react-dom/client'
import ReactDOMClient from 'react-dom/client'

const { debug, getElementLocatorSelectors } = utils

let idx = 0
function ensureTestIdAttribute(element: HTMLElement) {
  const attributeId = server.config.browser.locators.testIdAttribute
  if (!element.hasAttribute(attributeId)) {
    element.setAttribute(attributeId, `__vitest_${idx++}__`)
  }
}

let activeActs = 0

function setActEnvironment(env: boolean | undefined): void {
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = env
}

function updateActEnvironment(): void {
  setActEnvironment(activeActs > 0)
}

// @ts-expect-error unstable_act is not typed, but exported
const _act = React.act || React.unstable_act

// we call act only when rendering to flush any possible effects
// usually the async nature of Vitest browser mode ensures consistency,
// but rendering is sync and controlled by React directly
const act: typeof React.act = typeof _act !== 'function'
  ? async (cb: () => unknown) => { await cb() }
  : async (cb: () => unknown) => {
    activeActs++
    updateActEnvironment()
    try {
      await _act(cb)
    }
    finally {
      activeActs--
      updateActEnvironment()
    }
  }

export interface RenderResult extends LocatorSelectors {
  container: HTMLElement
  baseElement: HTMLElement
  locator: Locator
  debug: (
    el?: HTMLElement | HTMLElement[] | Locator | Locator[],
    maxLength?: number,
    options?: PrettyDOMOptions
  ) => void
  unmount: () => Promise<void>
  rerender: (ui: React.ReactNode) => Promise<void>
  asFragment: () => DocumentFragment
}

export interface ComponentRenderOptions {
  container?: HTMLElement
  baseElement?: HTMLElement
  wrapper?: React.JSXElementConstructor<{ children: React.ReactNode }>
}

export interface RenderOptions extends ComponentRenderOptions {}

// Ideally we'd just use a WeakMap where containers are keys and roots are values.
// We use two variables so that we can bail out in constant time when we render with a new container (most common use case)
const mountedContainers = new Set<Container>()
const mountedRootEntries: {
  container: Container
  root: ReturnType<typeof createConcurrentRoot>
}[] = []

export async function render(
  ui: React.ReactNode,
  { container, baseElement, wrapper: WrapperComponent }: ComponentRenderOptions = {},
): Promise<RenderResult> {
  if (!baseElement) {
    // default to document.body instead of documentElement to avoid output of potentially-large
    // head elements (such as JSS style blocks) in debug output
    baseElement = document.body
  }

  if (!container) {
    container = baseElement.appendChild(document.createElement('div'))
  }

  // Ensuring testid attributes exists so that the generated locators will be stable
  // https://github.com/vitest-community/vitest-browser-react/issues/42
  ensureTestIdAttribute(baseElement)
  ensureTestIdAttribute(container)

  let root: ReactRoot

  if (!mountedContainers.has(container)) {
    root = createConcurrentRoot(container)

    mountedRootEntries.push({ container, root })
    // we'll add it to the mounted containers regardless of whether it's actually
    // added to document.body so the cleanup method works regardless of whether
    // they're passing us a custom container or not.
    mountedContainers.add(container)
  }
  else {
    mountedRootEntries.forEach((rootEntry) => {
      // Else is unreachable since `mountedContainers` has the `container`.
      // Only reachable if one would accidentally add the container to `mountedContainers` but not the root to `mountedRootEntries`
      /* istanbul ignore else */
      if (rootEntry.container === container) {
        root = rootEntry.root
      }
    })
  }

  await act(async () => {
    root!.render(
      strictModeIfNeeded(wrapUiIfNeeded(ui, WrapperComponent)),
    )
  })

  return {
    container,
    baseElement,
    locator: page.elementLocator(container),
    debug: (el, maxLength, options) => debug(el, maxLength, options),
    unmount: async () => {
      await act(async () => {
        root.unmount()
      })
    },
    rerender: async (newUi: React.ReactNode) => {
      await act(async () => {
        root.render(
          strictModeIfNeeded(wrapUiIfNeeded(newUi, WrapperComponent)),
        )
      })
    },
    asFragment: () => {
      return document.createRange().createContextualFragment(container.innerHTML)
    },
    ...getElementLocatorSelectors(baseElement),
  }
}

export interface RenderHookOptions<Props> extends ComponentRenderOptions {
  /**
   * The argument passed to the renderHook callback. Can be useful if you plan
   * to use the rerender utility to change the values passed to your hook.
   */
  initialProps?: Props | undefined
}

export interface RenderHookResult<Result, Props> {
  /**
   * Triggers a re-render. The props will be passed to your renderHook callback.
   */
  rerender: (props?: Props) => Promise<void>
  /**
   * This is a stable reference to the latest value returned by your renderHook
   * callback
   */
  result: {
    /**
     * The value returned by your renderHook callback
     */
    current: Result
  }
  /**
   * Unmounts the test component. This is useful for when you need to test
   * any cleanup your useEffects have.
   */
  unmount: () => Promise<void>
  /**
   * A test helper to apply pending React updates before making assertions.
   */
  act: (callback: () => unknown) => Promise<void>
}

export async function renderHook<Props, Result>(renderCallback: (initialProps?: Props) => Result, options: RenderHookOptions<Props> = {}): Promise<RenderHookResult<Result, Props>> {
  const { initialProps, ...renderOptions } = options

  const result = React.createRef<Result>() as unknown as { current: Result }

  function TestComponent({ renderCallbackProps }: { renderCallbackProps?: Props }) {
    const pendingResult = renderCallback(renderCallbackProps)

    React.useEffect(() => {
      result.current = pendingResult
    })

    return null
  }

  const { rerender: baseRerender, unmount } = await render(
    <TestComponent renderCallbackProps={initialProps} />,
    renderOptions,
  )

  function rerender(rerenderCallbackProps?: Props) {
    return baseRerender(
      <TestComponent renderCallbackProps={rerenderCallbackProps} />,
    )
  }

  return { result, rerender, unmount, act }
}

export async function cleanup(): Promise<void> {
  for (const { root, container } of mountedRootEntries) {
    await act(async () => {
      root.unmount()
    })
    if (container.parentNode === document.body) {
      document.body.removeChild(container)
    }
  }
  mountedRootEntries.length = 0
  mountedContainers.clear()
}

interface ReactRoot {
  render: (element: React.ReactNode) => void
  unmount: () => void
}

function createConcurrentRoot(container: HTMLElement): ReactRoot {
  const root = ReactDOMClient.createRoot(container)

  return {
    render(element: React.ReactNode) {
      root.render(element)
    },
    unmount() {
      root.unmount()
    },
  }
}

export interface RenderConfiguration {
  reactStrictMode: boolean
}

const config: RenderConfiguration = {
  reactStrictMode: false,
}

function strictModeIfNeeded(innerElement: React.ReactNode) {
  return config.reactStrictMode
    ? React.createElement(React.StrictMode, null, innerElement)
    : innerElement
}

function wrapUiIfNeeded(innerElement: React.ReactNode, wrapperComponent?: React.JSXElementConstructor<{
  children: React.ReactNode
}>) {
  return wrapperComponent
    ? React.createElement(wrapperComponent, null, innerElement)
    : innerElement
}

export function configure(customConfig: Partial<RenderConfiguration>): void {
  Object.assign(config, customConfig)
}
