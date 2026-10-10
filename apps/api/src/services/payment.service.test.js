import { jest } from '@jest/globals';

const mockCreate = jest.fn();

jest.unstable_mockModule('stripe', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      paymentIntents: {
        create: mockCreate,
      },
    })),
  };
});

const { createPaymentIntent } = await import('./payment.service.js');

describe('createPaymentIntent', () => {
  beforeEach(() => {
    mockCreate.mockClear();
  });

  it('throws when payload is missing', async () => {
    await expect(createPaymentIntent()).rejects.toThrow('Payload is required');
  });

  it('throws when amount is missing', async () => {
    await expect(createPaymentIntent({ currency: 'usd' })).rejects.toThrow(
      'amount is required'
    );
  });

  it('throws when amount is not a positive integer', async () => {
    await expect(createPaymentIntent({ amount: -1 })).rejects.toThrow(
      'amount must be a positive integer'
    );
    await expect(createPaymentIntent({ amount: 0 })).rejects.toThrow(
      'amount must be a positive integer'
    );
    await expect(createPaymentIntent({ amount: 10.5 })).rejects.toThrow(
      'amount must be a positive integer'
    );
    await expect(createPaymentIntent({ amount: '100' })).rejects.toThrow(
      'amount must be a positiveantis a positive integer'
    );
  });

  it('calls stripe.paymentIntents.create with amount and currency', async () => {
    mockCreate.mockResolvedValue({
      id: 'pi_123',
      client_secret: 'secret_123',
      amount: 1000,
      currency: 'usd',
    });

    const result = await createPaymentIntent({ amount: 1000, currency: 'usd' });

    expect(mockCreate).toHaveBeenCalledWith({
      amount: 1000,
      currency: 'usd',
    });
    expect(result).toEqual({
      paymentId: 'pi_123',
      clientSecret: 'secret_123',
      amount: 1000,
      currency: 'usd',
      provider: 'stripe',
    });
  });

  it('defaults currency to usd', async () => {
    mockCreate.mockResolvedValue({
      id: 'pi_456',
      client_secret: 'secret_456',
      amount: 500,
      currency: 'usd',
    });

    await createPaymentIntent({ amount: 500 });

    expect(mockCreate).toHaveBeenCalledWith({
      amount: 500,
      currency: 'usd',
    });
  });

  it('re-throws Stripe errors with original message', async () => {
    const stripeError = new Error('Your card was declined.');
    stripeError.type = 'StripeCardError';
    mockCreate.mockRejectedValue(stripeError);

    await expect(createPaymentIntent({ amount: 100 })).rejects.toThrow(
      'Your card was declined.'
    );
  });

  it('re-throws other errors as-is', async () => {
    const genericError = new Error('Network failure');
    mockCreate.mockRejectedValue(genericError);

    await expect(createPaymentIntent({ amount: 100 })).rejects.toThrow(
      'Network failure'
    );
  });
});

describe('integration: createPaymentIntent', () => {
  it('creates a real PaymentIntent in test mode', async () => {
    if (!process.env.RUN_STRIPE_INTEGRATION_TEST) {
      return;
    }

    const { createPaymentIntent: realCreatePaymentIntent } = await import(
      './payment.service.js'
    );

    const result = await realCreatePaymentIntent({
      amount: 2000,
      currency: 'usd',
    });

    expect(result.paymentId).toMatch(/^pi_/);
    expect(result.clientSecret).toMatch(/^pi_/);
    expect(result.amount).toBe(2000);
    expect(result.currency).toBe('usd');
    expect(result.provider).toBe('stripe');
  });
});