# Payment Gateway

The API creates Stripe PaymentIntents through the Stripe Node.js SDK. The service reads the secret key from `STRIPE_SECRET_KEY`; no Stripe keys are hardcoded in source.

## Endpoint

`POST /api/payments`

Required body:

```json
{
  "amount": 2500
}
```

Optional fields:

```json
{
  "currency": "eur",
  "metadata": {
    "jobId": "job_123",
    "clientId": "user_456"
  },
  "idempotencyKey": "job_123:user_456:2500"
}
```

- `amount` must be a positive integer in the smallest currency unit.
- `currency` defaults to `usd` and is normalized to lowercase.
- `metadata` is optional and must be a flat object. Keys and values are validated against Stripe metadata limits before the API call.
- `idempotencyKey` is optional and is passed to Stripe request options to make client retries safe.

Successful responses include both `paymentId` and `clientSecret`:

```json
{
  "success": true,
  "data": {
    "paymentId": "pi_...",
    "clientSecret": "pi_..._secret_...",
    "amount": 2500,
    "currency": "eur",
    "provider": "stripe"
  }
}
```

## Tests

```bash
npm test
```

The live Stripe smoke test is skipped by default. Run it only with a Stripe test key:

```bash
RUN_STRIPE_SMOKE_TEST=1 STRIPE_SECRET_KEY=sk_test_... npm run test -w apps/api
```
