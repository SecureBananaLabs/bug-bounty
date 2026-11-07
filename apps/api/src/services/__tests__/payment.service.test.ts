import { createPaymentIntent } from '../payment.service';

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn(),
    },
  }));
});

describe('createPaymentIntent', () => {
  let mockCreate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const Stripe = require('stripe');
    const stripeInstance = new Stripe('test_key');
    mockCreate = stripeInstance.paymentIntents.create;
  });

  it('should throw if amount is missing', async () => {
    await expect(createPaymentIntent({ amount: undefined as any })).rejects.toThrow(
      'amount is required'
    );
  });

  it('should throw if amount is not a positive integer', async () => {
    await expect(createPaymentIntent({ amount: -100 })).rejects.toThrow(
      'amount must be a positive integer'
    );
    await expect(createPaymentIntent({ amount: 0 })).rejects.toThrow(
      'amount must be a positive integer'
    );
    await expect(createPaymentIntent({ amount: 10.5 })).rejects.toThrow(
      'amount must be a positive integer'
    );
  });

  it('should default currency to usd', async () => {
    mockCreate.mockResolvedValue({
      id: 'pi_test_123',
      client_secret: 'cs_test_abc',
    });

    const result = await createPaymentIntent({ amount: 1000 });

    expect(mockCreate).toHaveBeenCalledWith({
      amount: 1000,
      currency: 'usd',
      metadata: undefined,
    });
    expect(result).toEqual({
      clientSecret: 'cs_test_abc',
      paymentId: 'pi_test_123',
    });
  });

  it('should pass currency and metadata to Stripe', async () => {
    mockCreate.mockResolvedValue({
      id: 'pi_test_456',
      client_secret: 'cs_test_def',
    });

    const result = await createPaymentIntent({
      amount: 2000,
      currency: 'eur',
      metadata: { orderId: '123' },
    });

    expect(mockCreate).toHaveBeenCalledWith({
      amount: 2000,
      currency: 'eur',
      metadata: { orderId: '123' },
    });
    expect(result).toEqual({
      clientSecret: 'cs_test_def',
      paymentId: 'pi_test_456',
    });
  });

  it('should re-throw Stripe errors with message preserved', async () => {
    const stripeError = new Error('Card declined');
    stripeError.name = 'StripeCardError';
    mockCreate.mockRejectedValue(stripeError);

    await expect(createPaymentIntent({ amount: 1000 })).rejects.toThrow('Stripe error: Card declined');
  });
});