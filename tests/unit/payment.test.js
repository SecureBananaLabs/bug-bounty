import { createPaymentIntent } from '../../src/payment';
import Stripe from 'stripe'; // Import Stripe to mock it

// Mock the entire stripe module
jest.mock('stripe', () => {
  // Mock the constructor
  const mockStripe = jest.fn(() => ({
    paymentIntents: {
      create: jest.fn(),
    },
  }));
  // Add static properties if needed, e.g., Stripe.errors
  mockStripe.errors = {
    StripeCardError: class extends Error {
      constructor(message) {
        super(message);
        this.type = 'StripeCardError';
        this.raw = { message };
      }
    },
    StripeInvalidRequestError: class extends Error {
      constructor(message) {
        super(message);
        this.type = 'StripeInvalidRequestError';
        this.raw = { message };
      }
    },
    // Add other Stripe error types if necessary for specific tests
  };
  return mockStripe;
});

// Get the mocked Stripe instance and its methods
const mockStripeInstance = new Stripe('sk_test_mock_key');
const mockPaymentIntentsCreate = mockStripeInstance.paymentIntents.create;

describe('createPaymentIntent (Unit Tests)', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Set a default mock implementation for successful calls
    mockPaymentIntentsCreate.mockResolvedValue({
      id: 'pi_mock_123',
      client_secret: 'pi_mock_123_secret_mock',
      amount: 1000,
      currency: 'usd',
    });
  });

  // Acceptance Criteria: `payload.amount` is required and must be a positive integer
  test('should throw an error if amount is missing', async () => {
    await expect(createPaymentIntent({ currency: 'usd' })).rejects.toThrow(
      'Invalid amount: amount must be a positive integer representing the smallest currency unit.'
    );
  });

  test('should throw an error if amount is not a number', async () => {
    await expect(createPaymentIntent({ amount: '1000', currency: 'usd' })).rejects.toThrow(
      'Invalid amount: amount must be a positive integer representing the smallest currency unit.'
    );
  });

  test('should throw an error if amount is not an integer', async () => {
    await expect(createPaymentIntent({ amount: 1000.50, currency: 'usd' })).rejects.toThrow(
      'Invalid amount: amount must be a positive integer representing the smallest currency unit.'
    );
  });

  test('should throw an error if amount is zero', async () => {
    await expect(createPaymentIntent({ amount: 0, currency: 'usd' })).rejects.toThrow(
      'Invalid amount: amount must be a positive integer representing the smallest currency unit.'
    );
  });

  test('should throw an error if amount is negative', async () => {
    await expect(createPaymentIntent({ amount: -100, currency: 'usd' })).rejects.toThrow(
      'Invalid amount: amount must be a positive integer representing the smallest currency unit.'
    );
  });

  // Acceptance Criteria: `payload.currency` defaults to `"usd"`
  test('should use "usd" as default currency if not provided', async () => {
    const payload = { amount: 1000 };
    const result = await createPaymentIntent(payload);

    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith({
      amount: 1000,
      currency: 'usd',
    });
    expect(result).toEqual({
      paymentId: 'pi_mock_123',
      clientSecret: 'pi_mock_123_secret_mock',
    });
  });

  // Acceptance Criteria: A real `stripe.paymentIntents.create()` call is made
  // and The resolved value includes `clientSecret` and `paymentId`
  test('should call Stripe API with correct arguments and return mapped values', async () => {
    const payload = { amount: 2500, currency: 'eur' };
    const result = await createPaymentIntent(payload);

    expect(mockPaymentIntentsCreate).toHaveBeenCalledTimes(1);
    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith({
      amount: 2500,
      currency: 'eur',
    });
    expect(result).toEqual({
      paymentId: 'pi_mock_123',
      clientSecret: 'pi_mock_123_secret_mock',
    });
  });

  // Acceptance Criteria: Stripe errors are caught and re-thrown with original message
  test('should re-throw StripeCardError with original message', async () => {
    const stripeError = new Stripe.errors.StripeCardError('Your card was declined.');
    mockPaymentIntentsCreate.mockRejectedValue(stripeError);

    await expect(createPaymentIntent({ amount: 1000 })).rejects.toThrow(
      'Stripe Error: Your card was declined.'
    );
  });

  test('should re-throw StripeInvalidRequestError with original message', async () => {
    const stripeError = new Stripe.errors.StripeInvalidRequestError('Invalid API key provided.');
    mockPaymentIntentsCreate.mockRejectedValue(stripeError);

    await expect(createPaymentIntent({ amount: 1000 })).rejects.toThrow(
      'Stripe Error: Invalid API key provided.'
    );
  });

  test('should re-throw generic errors during Stripe API call', async () => {
    const genericError = new Error('Network error');
    mockPaymentIntentsCreate.mockRejectedValue(genericError);

    await expect(createPaymentIntent({ amount: 1000 })).rejects.toThrow(
      'Failed to create Payment Intent: Network error'
    );
  });
});
