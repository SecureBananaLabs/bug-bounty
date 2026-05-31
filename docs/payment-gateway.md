# Payment Gateway

The payments API creates Stripe PaymentIntents through the Stripe Node.js SDK.
The service validates request data before any provider call, returns the Stripe
client secret needed by the frontend, and preserves Stripe error messages for
callers that need to resolve payment issues.

## Configuration

Set `STRIPE_SECRET_KEY` in the API environment before creating live payment
intents:

```bash
STRIPE_SECRET_KEY=<stripe test-mode secret key>
```

Use a Stripe test-mode key for local development and smoke tests. The service
does not provide a fallback key and does not create PaymentIntents when
`STRIPE_SECRET_KEY` is missing.

## API

`POST /api/payments`

Request body:

```json
{
  "amount": 2599,
  "currency": "usd",
  "metadata": {
    "jobId": "job_123",
    "milestone": "2"
  }
}
```

Rules:

- `amount` is required and must be a positive integer in the smallest currency
  unit, such as cents.
- `currency` defaults to `usd` and must be a three-letter ISO currency code
  when provided.
- `metadata` is optional. When present, it must be a flat object whose values
  are strings, numbers, or booleans. Values are converted to strings before the
  Stripe call.

Successful response:

```json
{
  "success": true,
  "data": {
    "paymentId": "pi_...",
    "clientSecret": "pi_..._secret_...",
    "amount": 2599,
    "currency": "usd",
    "provider": "stripe"
  }
}
```

Validation errors return `400` with a descriptive message. Stripe provider
errors return the original Stripe message and the provider status code when
Stripe supplies one.

## Local Demo

Start the API with a Stripe test-mode key:

```bash
STRIPE_SECRET_KEY=<stripe test-mode secret key> npm run dev -w apps/api
```

Create a PaymentIntent:

```bash
curl -X POST http://127.0.0.1:4000/api/payments \
  -H "content-type: application/json" \
  -d '{"amount":100,"currency":"usd","metadata":{"source":"local_demo"}}'
```

PowerShell equivalent:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:4000/api/payments" `
  -ContentType "application/json" `
  -Body '{"amount":100,"currency":"usd","metadata":{"source":"local_demo"}}'
```

## Tests

Run the API unit and route tests:

```bash
npm run test -w apps/api
```

The default API test suite verifies that the smoke test is guarded and does not
call Stripe unless explicitly enabled.

Run the live Stripe smoke test only when a test-mode secret key is available:

```bash
RUN_STRIPE_SMOKE_TEST=1 STRIPE_SECRET_KEY=<stripe test-mode secret key> \
  node --test apps/api/src/tests/paymentStripeSmoke.test.js
```

The smoke test creates a real Stripe test-mode PaymentIntent and verifies the
`paymentId`, `clientSecret`, amount, currency, and provider fields.
