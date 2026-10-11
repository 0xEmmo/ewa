import { placeOrder, type CheckoutRequest } from '@/lib/orders'

/**
 * Mock payment endpoint. Everything is re-checked here: prices come from the
 * catalogue, stock and promo rules are applied again, and the card is
 * "charged" against the test numbers. Nothing is stored server-side; the
 * client keeps its own order history.
 */
export async function POST(request: Request) {
  let body: CheckoutRequest
  try {
    body = (await request.json()) as CheckoutRequest
  } catch {
    return Response.json({ ok: false, kind: 'invalid', message: 'Malformed request' }, { status: 400 })
  }
  await new Promise((r) => setTimeout(r, 650))
  const result = placeOrder(body)
  return Response.json(result, { status: result.ok ? 201 : result.kind === 'payment' ? 402 : 422 })
}
