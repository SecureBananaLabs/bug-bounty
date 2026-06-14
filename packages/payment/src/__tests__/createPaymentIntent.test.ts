import { createPaymentIntent } from '../createPaymentIntent'
import Stripe from 'stripe'
jest.mock('stripe')
const mockCreate = jest.fn()
;(Stripe as jest.Mock).mockImplementation(() => ({ paymentIntents: { create: mockCreate } }))
describe('createPaymentIntent', () => {
  beforeEach(() => { mockCreate.mockReset() })
  it('throws if amount missing', async () => { await expect(createPaymentIntent({} as any)).rejects.toThrow('positive integer') })
  it('throws if amount negative', async () => { await expect(createPaymentIntent({ amount: -100 })).rejects.toThrow('positive integer') })
  it('defaults currency to usd', async () => {
    mockCreate.mockResolvedValue({ id: 'pi_test', client_secret: 'secret_test' })
    const r = await createPaymentIntent({ amount: 2000 })
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ currency: 'usd' }))
    expect(r.paymentId).toBe('pi_test'); expect(r.clientSecret).toBe('secret_test')
  })
  it('passes custom currency', async () => {
    mockCreate.mockResolvedValue({ id: 'pi_test', client_secret: 'secret_test' })
    await createPaymentIntent({ amount: 1000, currency: 'eur' })
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ currency: 'eur' }))
  })
  it('wraps Stripe errors', async () => {
    mockCreate.mockRejectedValue(new Stripe.errors.StripeCardError('card declined'))
    await expect(createPaymentIntent({ amount: 1000 })).rejects.toThrow('Stripe: card declined')
  })
})
