import { expect, test } from 'vitest'
import { useState } from 'react'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'

/*
Test it by:
pnpm test --browser.trace=on --browser.headless trace-demo
pnpm playwright show-trace test/__traces__/trace-demo.test.tsx/react--chromium--adds-items-to-cart-0-0.trace.zip
*/

interface CartItem {
  name: string
  price: number
}

function ProductPage() {
  const [cart, setCart] = useState<CartItem[]>([])

  function addToCart(item: CartItem) {
    setCart(prev => [...prev, item])
  }

  const total = cart.reduce((sum, item) => sum + item.price, 0)

  return (
    <div style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>Shop</h1>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16 }}>
          <h2>Wireless Headphones</h2>
          <p>$79.99</p>
          <button onClick={() => addToCart({ name: 'Wireless Headphones', price: 79.99 })}>
            Add to Cart
          </button>
        </div>
        <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16 }}>
          <h2>Phone Case</h2>
          <p>$12.99</p>
          <button onClick={() => addToCart({ name: 'Phone Case', price: 12.99 })}>
            Add to Cart
          </button>
        </div>
      </div>
      {cart.length > 0 && (
        <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
          <h2>Cart ({cart.length} items)</h2>
          <ul>
            {cart.map((item, i) => (
              <li key={i}>{item.name} - ${item.price}</li>
            ))}
          </ul>
          <p aria-label="cart total"><strong>Total: ${total.toFixed(2)}</strong></p>
        </div>
      )}
    </div>
  )
}

test('adds items to cart', async () => {
  const screen = await render(<ProductPage />)

  await screen.getByRole('button', { name: 'Add to Cart' }).first().click()
  await expect.element(screen.getByText('Cart (1 items)')).toBeVisible()

  await screen.getByRole('button', { name: 'Add to Cart' }).nth(1).click()
  await expect.element(screen.getByText('Cart (2 items)')).toBeVisible()

  await expect.element(screen.getByLabelText('cart total')).toHaveTextContent('Total: $192.98')
})
