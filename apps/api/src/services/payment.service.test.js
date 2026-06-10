import { jest } from '@jest/globals';
import { createPaymentIntent } from './payment.service.js';

// Mock the stripe module
const mockPaymentIntentsCreate = jest.fn();

jest.unstable_mockModule('stripe', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      paymentIntents: {
        create: mockPaymentIntentsCreate,
      },
    })),
  };
});

describe('createPaymentIntent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when amount is missing', async () => {
    await expect(createPaymentIntent({})).rejects.toThrow(
      'amount is required and must be a positive integer'
    );
  });

  it('should throw error when amount is not an integer', async () => {
    await expect(createPaymentIntent({ amount: 10.5 })).rejects.toThrow(
      'amount is required and must be a positive integer'
    );
  });

  it('should throw error when amount is not positive', async () => {
    await expect(createPaymentIntent({ amount: 0 })).rejects.toThrow(
      'amount is required and must be a positive integer'
    );
    await expect(createPaymentIntent({ amount: -10 })).rejects.toThrow(
      'amount is required and must be a positive integer'
    );
  });

  it('should default currency to "usd" when not provided', async () => {
    mockPaymentIntentsCreate.mockResolvedValue({
      id: 'pi_123',
      client_secret: 'secret_123',
    });

    const result = await createPaymentIntent({ amount: 1000 });

    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith({
      amount: 1000,
      currency: 'usd',
    });
    expect(result).toEqual({
      paymentId: 'pi_123',
      amount: 1000,
      currency: 'usd',
      provider: 'stripe',
      clientSecret: 'secret_123',
    });
  });

  it('should use provided currency', async () => {
    mockPaymentIntentsCreate.mockResolvedValue({
      id: 'pi_456',
      client_secret: 'secret_456',
    });

    const result = await createPaymentIntent({ amount: 2000, currency: 'eur' });

    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith({
      amount: 2000,
      currency: 'eur',
    });
    expect(result).toEqual({
      paymentId: 'pi_456',
      amount: 2000,
      currency: 'eur',
      provider: 'stripe',
      clientSecret: 'secret_456',
    });
  });

  it('should catch and re-throw Stripe errors with original message', async () => {
    const stripeError = new Error('Your card was declined.');
    stripeError.type = 'StripeCardError';
    mockPaymentIntentsCreate.mockRejectedValue(stripeError);

    await expect(createPaymentIntent({ amount: 1000 })).rejects.toThrow(
      'Your card was declined.'
    );
  });

  it('should catch and re-throw StripeInvalidRequestError with original message', async () => {
    const stripeError = new Error('Invalid request');
    stripeError.type = 'StripeInvalidRequestError';
    mockPaymentIntentsCreate.mockRejectedValue(stripeError);

    await expect(createPaymentIntent({ amount: 1000 })).rejects.toThrow(
      'Invalid request'
    );
  });
});

describe('integration test', () => {
  it('should create a real PaymentIntent in test mode when env flag is set', async () => {
    if (!process.env.RUN_STRIPE_INTEGRATION_TEST) {
      return;
    }

    // For integration test, we need to import the actual module without mocking
    const { createPaymentIntent: realCreatePaymentIntent } = await import('./payment.service.js');
    
    const result = await realCreatePaymentIntent({ amount: 1000, currency: 'usd' });
    
    expect(result.paymentId).toBeDefined();
    expect(result.paymentId).not.toMatch(/^pay_\d+$/);
    expect(result.clientSecret).toBeDefined();
    expect(result.amount).toBe(1000);
    expect(result.currency).toBe('usd');
    expect(result.provider).toBe('stripe');
  });
});