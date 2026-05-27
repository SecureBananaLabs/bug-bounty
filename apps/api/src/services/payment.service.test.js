import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPaymentIntent, stripe } from './payment.service.js';

// Mock the Stripe module
vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      paymentIntents: {
        create: vi.fn(),
      },
    })),
  };
});

describe('createPaymentIntent', () => {
  let mockCreate;

  beforeEach(() => {
    mockCreate = stripe.paymentIntents.create;
    mockCreate.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('throws when payload is missing', async () => {
    await expect(createPaymentIntent()).rejects.toThrow('Payload is required and must be an object');
  });

  it('throws when amount is missing', async () => {
    await expect(createPaymentIntent({ currency: 'usd' })).rejects.toThrow(
      'amount is required and must be a positive integer'
    );
  });

  it('throws when amount is not an integer', async () => {
    await expect(createPaymentIntent({ amount: 10.5, currency: 'usd' })).rejects.toThrow(
      'amount is required and must be a positive integer'
    );
  });

  it('throws when amount is zero or negative', async () => {
    await expect(createPaymentIntent({ amount: 0, currency: 'usd' })).rejects.toThrow(
      'amount is required and must be a positive integer'
    );
    await expect(createPaymentIntent({ amount: -100, currency: 'usd' })).rejects.toThrow(
      'amount is required and must be a positive integer'
    );
  });

  it('calls stripe.paymentIntents.create with correct arguments and returns mapped response', async () => {
    const mockPaymentIntent = {
      id: 'pi_1234567890',
      amount: 2000,
      currency: 'usd',
      client_secret: 'pi_1234567890_secret_xyz',
    };

    mockCreate.mockResolvedValue(mockPaymentIntent);

    const result = await createPaymentIntent({ amount: 2000, currency: 'usd' });

    expect(mockCreate).toHaveBeenCalledWith({
      amount: 2000,
      currency: 'usd',
    });
    expect(mockCreate).toHaveBeenCalledTimes(1);

    expect(result).toEqual({
      paymentId: 'pi_1234567890',
      amount: 2000,
      currency: 'usd',
      clientSecret: 'pi_1234567890_secret_xyz',
      provider: 'stripe',
    });
  });

  it('defaults currency to "usd" when not provided', async () => {
    const mockPaymentIntent = {
      id: 'pi_0987654321',
      amount: 500,
      currency: 'usd',
      client_secret: 'pi_0987654321_secret_abc',
    };

    mockCreate.mockResolvedValue(mockPaymentIntent);

    const result = await createPaymentIntent({ amount: 500 });

    expect(mockCreate).toHaveBeenCalledWith({
      amount: 500,
      currency: 'usd',
    });

    expect(result.currency).toBe('usd');
  });

  it('re-throws Stripe errors with original message', async () => {
    const stripeError = new Error('Your card was declined.');
    stripeError.type = 'StripeCardError';
    mockCreate.mockRejectedValue(stripeError);

    await expect(createPaymentIntent({ amount: 1000 })).rejects.toThrow('Your card was declined.');
  });
});