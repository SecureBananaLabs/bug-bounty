import { describe, it, expect, vi, beforeEach } from 'vitest';
import Stripe from 'stripe';

// Mock the Stripe module before importing the service
const mockCreate = vi.fn();

vi.mock('stripe', () => {
  return {
    default: vi.fn(() => ({
      paymentIntents: {
        create: mockCreate,
      },
    })),
  };
});

import { createPaymentIntent } from './payment.service';

describe('createPaymentIntent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a PaymentIntent with correct arguments', async () => {
    const mockClientSecret = 'pi_123_secret_456';
    mockCreate.mockResolvedValue({
      id: 'pi_123',
      client_secret: mockClientSecret,
    });

    const result = await createPaymentIntent({
      amount: 1000,
      currency: 'usd',
    });

    expect(mockCreate).toHaveBeenCalledWith({
      amount: 1000,
      currency: 'usd',
      metadata: undefined,
    });

    expect(result).toEqual({
      paymentId: 'pi_123',
      clientSecret: mockClientSecret,
      amount: 1000,
      currency: 'usd',
      provider: 'stripe',
    });
  });

  it('should default currency to usd', async () => {
    mockCreate.mockResolvedValue({
      id: 'pi_456',
      client_secret: 'pi_456_secret_789',
    });

    const result = await createPaymentIntent({ amount: 500 });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 500,
        currency: 'usd',
      })
    );

    expect(result.currency).toBe('usd');
  });

  it('should throw for invalid amount', async () => {
    await expect(createPaymentIntent({ amount: -1 })).rejects.toThrow(
      'amount is required and must be a positive integer'
    );
    await expect(createPaymentIntent({ amount: '100' as any })).rejects.toThrow(
      'amount is required and must be a positive integer'
    );
    await expect(createPaymentIntent({} as any)).rejects.toThrow(
      'amount is required and must be a positive integer'
    );
  });

  it('should re-throw Stripe errors with message', async () => {
    mockCreate.mockRejectedValue(new Error('Stripe error: Invalid API Key provided'));

    await expect(createPaymentIntent({ amount: 100 })).rejects.toThrow(
      'Stripe error: Invalid API Key provided'
    );
  });
});