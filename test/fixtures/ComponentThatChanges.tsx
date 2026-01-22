import React from 'react'
import type { JSX } from 'react/jsx-runtime'

export function ComponentThatChanges({
  timeout = 10,
}: {
  timeout?: number
}): JSX.Element {
  const [show, setShow] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => setShow(true), timeout)
    return () => clearTimeout(timer)
  }, [timeout])

  return <div>{show ? 'Hello Vitest!' : 'Loading...'}</div>
}
