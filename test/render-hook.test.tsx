import { expect, test } from 'vitest'
import type { PropsWithChildren } from 'react'
import React from 'react'
import { renderHook } from '../src/index'
import { useCounter } from './fixtures/useCounter'

test('should increment counter', () => {
  const { result, act } = renderHook(() => useCounter())

  act(() => {
    result.current.increment()
  })

  expect(result.current.count).toBe(1)
})

test('allows rerendering', () => {
  const { result, rerender } = renderHook(
    (initialProps) => {
      const [left, setLeft] = React.useState('left')
      const [right, setRight] = React.useState('right')

      switch (initialProps?.branch) {
        case 'left':
          return [left, setLeft]
        case 'right':
          return [right, setRight]

        default:
          throw new Error(
            'No Props passed. This is a bug in the implementation',
          )
      }
    },
    { initialProps: { branch: 'left' } },
  )

  expect(result.current).toEqual(['left', expect.any(Function)])

  rerender({ branch: 'right' })

  expect(result.current).toEqual(['right', expect.any(Function)])
})

test('allows wrapper components', async () => {
  const Context = React.createContext('default')
  function Wrapper({ children }: PropsWithChildren) {
    return <Context.Provider value="provided">{children}</Context.Provider>
  }
  const { result } = renderHook(
    () => {
      return React.useContext(Context)
    },
    {
      wrapper: Wrapper,
    },
  )

  expect(result.current).toEqual('provided')
})
