# Operations Guide - Payment Gateway Integration

This document describes the design, configuration, and testing procedures for the Stripe payment gateway integration.

## Stripe Payment Integration

The application integrates with the Stripe Node.js SDK to securely create `PaymentIntents` for processing customer payments.

### Configuration

The payment service requires the following environment variables:

- `STRIPE_SECRET_KEY`: Your Stripe secret key (e.g. `sk_test_...` or `sk_live_...`). This variable must be set in the running environment; hardcoding keys is strictly prohibited.

### Service Behavior

The `createPaymentIntent(payload)` function in `apps/api/src/services/paymentService.js` exhibits the following behavior:

1. **Amount Validation**: The `payload.amount` parameter is required. It must be a positive integer representing the smallest currency unit (e.g., cents for USD/EUR). If missing, zero, negative, or not an integer, the service throws an error.
2. **Currency Defaulting**: If `payload.currency` is omitted, it defaults to `"usd"`.
3. **Stripe API Call**: A real `stripe.paymentIntents.create` API call is initiated.
4. **Response Mapping**: Returns an object containing the Stripe `clientSecret` and the `paymentId`.
5. **Error Propagation**: Any errors returned by Stripe (such as declined cards or invalid keys) are caught and re-thrown preserving the original error message.

### Testing

The integration is fully covered by a robust test suite in `apps/api/src/tests/payment.test.js` using the native Node.js test runner.

#### Unit Tests

Unit tests verify the business logic, parameter validation, and SDK argument passing by mocking the Stripe constructor:
- Ensures correct arguments are passed to Stripe's create function.
- Confirms defaulting of currency.
- Asserts that appropriate errors are thrown for invalid amounts or missing environment configuration.
- Asserts correct propagation of Stripe API errors.

Run the unit tests:
```bash
npm run test
```

#### Integration Tests

An integration test is provided to verify end-to-end functionality against the real Stripe sandbox. It is skipped by default to prevent dependency on internet connectivity and active credentials in standard test runs.

To run the integration tests, set `RUN_STRIPE_INTEGRATION_TESTS=true` and provide a valid test key:
```bash
RUN_STRIPE_INTEGRATION_TESTS=true STRIPE_SECRET_KEY=sk_test_yourkeyhere npm run test
```
