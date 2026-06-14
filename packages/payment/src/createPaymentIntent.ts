import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
export interface CreatePaymentPayload { amount: number; currency?: string }
export interface PaymentResult { clientSecret: string; paymentId: string }
export async function createPaymentIntent(p: CreatePaymentPayload): Promise<PaymentResult> {
  if (!p.amount || !Number.isInteger(p.amount) || p.amount <= 0) throw new Error('amount must be positive integer')
  try {
    const pi = await stripe.paymentIntents.create({ amount: p.amount, currency: p.currency || 'usd', automatic_payment_methods: { enabled: true } })
    return { clientSecret: pi.client_secret!, paymentId: pi.id }
  } catch(e) {
    if (e instanceof Stripe.errors.StripeError) throw new Error('Stripe: ' + e.message)
    throw e
  }
}
