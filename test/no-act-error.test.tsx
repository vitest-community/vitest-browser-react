import { beforeEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { render } from 'vitest-browser-react'

const fetchData = vi.fn()

const AsyncComponent: FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [data, setData] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const result = await fetchData()
        setData(result)
        setStatus('success')
      }
      catch {
        setStatus('error')
      }
    }
    void load()
  }, [])

  if (status === 'loading') {
    return <div data-testid="status">loading</div>
  }

  return (
    <div>
      <div data-testid="status">{status}</div>
      {data && <div data-testid="data">{data}</div>}
    </div>
  )
}

beforeEach(() => {
  const spy = vi.spyOn(console, 'error')
  return () => {
    const calls = spy.mock.calls.flat()
    spy.mockRestore()
    expect(calls).not.toContainEqual(expect.stringContaining('act'))
  }
})

describe('act() warning reproduction', () => {
  it('produces act() warning when async operation resolves', async () => {
    fetchData.mockResolvedValue('Hello World')

    await render(<AsyncComponent />)

    await expect.element(page.getByTestId('status')).toHaveTextContent('success')
    await expect.element(page.getByTestId('data')).toHaveTextContent('Hello World')
  })

  it('produces act() warning when async operation rejects', async () => {
    fetchData.mockRejectedValue(new Error('Failed'))

    await render(<AsyncComponent />)

    await expect.element(page.getByTestId('status')).toHaveTextContent('error')
  })
})
