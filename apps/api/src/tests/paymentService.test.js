import test, {
  mock,
} from "node:test";
import assert from "node:assert/strict";


const paymentIntentCreate = mock.fn(
  async ({
    amount,
    currency,
  }) => ({
    id: "pi_123456789",
    client_secret:
      "pi_123456789_secret_abcdef",
    amount,
    currency,
    status:
      "requires_payment_method",
  })
);


const constructedWithKeys = [];


class StripeMock {
  constructor(secretKey) {
    constructedWithKeys.push(
      secretKey
    );

    this.paymentIntents = {
      create:
        paymentIntentCreate,
    };
  }
}


mock.module(
  "stripe",
  {
    defaultExport:
      StripeMock,
  }
);


process.env.STRIPE_SECRET_KEY =
  "sk_test_sz_worker_unit";


const {
  createPaymentIntent,
} = await import(
  "../services/paymentService.js"
);


function resetMockState() {
  paymentIntentCreate.mock.resetCalls();

  paymentIntentCreate.mock
    .mockImplementation(
      async ({
        amount,
        currency,
      }) => ({
        id:
          "pi_123456789",
        client_secret:
          "pi_123456789_secret_abcdef",
        amount,
        currency,
        status:
          "requires_payment_method",
      })
    );
}


test(
  "createPaymentIntent initialises Stripe with STRIPE_SECRET_KEY",
  async () => {
    resetMockState();

    await createPaymentIntent({
      amount: 2000,
      currency: "usd",
    });

    assert.equal(
      constructedWithKeys[0],
      "sk_test_sz_worker_unit"
    );
  }
);


test(
  "createPaymentIntent calls Stripe with validated amount and currency",
  async () => {
    resetMockState();

    await createPaymentIntent({
      amount: 2000,
      currency: "usd",
    });

    assert.equal(
      paymentIntentCreate.mock.callCount(),
      1
    );

    assert.deepEqual(
      paymentIntentCreate.mock
        .calls[0]
        .arguments[0],
      {
        amount: 2000,
        currency: "usd",
      }
    );
  }
);


test(
  "createPaymentIntent returns Stripe clientSecret and paymentId",
  async () => {
    resetMockState();

    const result =
      await createPaymentIntent({
        amount: 2000,
        currency: "usd",
      });

    assert.equal(
      result.paymentId,
      "pi_123456789"
    );

    assert.equal(
      result.clientSecret,
      "pi_123456789_secret_abcdef"
    );

    assert.equal(
      result.amount,
      2000
    );

    assert.equal(
      result.currency,
      "usd"
    );

    assert.equal(
      result.provider,
      "stripe"
    );
  }
);


test(
  "createPaymentIntent defaults currency to usd",
  async () => {
    resetMockState();

    const result =
      await createPaymentIntent({
        amount: 1500,
      });

    assert.equal(
      result.currency,
      "usd"
    );

    assert.deepEqual(
      paymentIntentCreate.mock
        .calls[0]
        .arguments[0],
      {
        amount: 1500,
        currency: "usd",
      }
    );
  }
);


test(
  "createPaymentIntent normalizes currency",
  async () => {
    resetMockState();

    await createPaymentIntent({
      amount: 1500,
      currency: "EUR",
    });

    assert.deepEqual(
      paymentIntentCreate.mock
        .calls[0]
        .arguments[0],
      {
        amount: 1500,
        currency: "eur",
      }
    );
  }
);


test(
  "createPaymentIntent rejects missing payload",
  async () => {
    resetMockState();

    await assert.rejects(
      () =>
        createPaymentIntent(),
      {
        message:
          "payload is required.",
      }
    );

    assert.equal(
      paymentIntentCreate.mock
        .callCount(),
      0
    );
  }
);


test(
  "createPaymentIntent rejects missing amount",
  async () => {
    resetMockState();

    await assert.rejects(
      () =>
        createPaymentIntent({
          currency: "usd",
        }),
      {
        message:
          "amount is required.",
      }
    );

    assert.equal(
      paymentIntentCreate.mock
        .callCount(),
      0
    );
  }
);


test(
  "createPaymentIntent rejects non-number amount",
  async () => {
    resetMockState();

    await assert.rejects(
      () =>
        createPaymentIntent({
          amount: "2000",
        }),
      {
        message:
          "amount must be a number.",
      }
    );

    assert.equal(
      paymentIntentCreate.mock
        .callCount(),
      0
    );
  }
);


test(
  "createPaymentIntent rejects non-integer amount",
  async () => {
    resetMockState();

    await assert.rejects(
      () =>
        createPaymentIntent({
          amount: 20.5,
        }),
      {
        message:
          "amount must be an integer.",
      }
    );

    assert.equal(
      paymentIntentCreate.mock
        .callCount(),
      0
    );
  }
);


test(
  "createPaymentIntent rejects zero amount",
  async () => {
    resetMockState();

    await assert.rejects(
      () =>
        createPaymentIntent({
          amount: 0,
        }),
      {
        message:
          "amount must be greater than zero.",
      }
    );

    assert.equal(
      paymentIntentCreate.mock
        .callCount(),
      0
    );
  }
);


test(
  "createPaymentIntent rejects negative amount",
  async () => {
    resetMockState();

    await assert.rejects(
      () =>
        createPaymentIntent({
          amount: -100,
        }),
      {
        message:
          "amount must be greater than zero.",
      }
    );

    assert.equal(
      paymentIntentCreate.mock
        .callCount(),
      0
    );
  }
);


test(
  "createPaymentIntent rejects invalid currency",
  async () => {
    resetMockState();

    await assert.rejects(
      () =>
        createPaymentIntent({
          amount: 1000,
          currency: "",
        }),
      {
        message:
          "currency must be a non-empty string.",
      }
    );

    assert.equal(
      paymentIntentCreate.mock
        .callCount(),
      0
    );
  }
);


test(
  "createPaymentIntent preserves Stripe error message and metadata",
  async () => {
    resetMockState();

    const stripeError =
      new Error(
        "Your card was declined."
      );

    stripeError.code =
      "card_declined";

    stripeError.type =
      "StripeCardError";

    paymentIntentCreate.mock
      .mockImplementationOnce(
        async () => {
          throw stripeError;
        }
      );

    let thrown;

    try {
      await createPaymentIntent({
        amount: 2000,
      });

      assert.fail(
        "Expected Stripe error."
      );
    } catch (error) {
      thrown = error;
    }

    assert.equal(
      thrown,
      stripeError
    );

    assert.equal(
      thrown.message,
      "Your card was declined."
    );

    assert.equal(
      thrown.code,
      "card_declined"
    );

    assert.equal(
      thrown.type,
      "StripeCardError"
    );
  }
);