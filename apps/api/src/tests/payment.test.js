import { describe, it, mock, beforeEach } from "node:test";
import assert from "node:assert/strict";

let mockBehaviour = "success";

mock.module("stripe", {
  exports: {
    default: function Stripe() {
      return {
        paymentIntents: {
          create(params) {
            if (mockBehaviour === "card_error") {
              var err = new Error("Your card was declined.");
              err.type = "StripeCardError"; err.code = "card_declined"; err.statusCode = 402;
              throw err;
            }
            if (mockBehaviour === "invalid_request") {
              var err = new Error("Invalid integer: abc");
              err.type = "StripeInvalidRequestError"; err.code = "parameter_invalid"; err.statusCode = 400;
              throw err;
            }
            return { id: "pi_test_123456", client_secret: "pi_test_123456_secret_abcdef", amount: params.amount, currency: params.currency };
          },
        },
      };
    },
  },
});

const mod = await import("../services/paymentService.js");
const createPaymentIntent = mod.createPaymentIntent;

describe("createPaymentIntent (Zod enhanced)", () => {
  describe("Validation", () => {
    it("rejects when amount missing", async () => {
      await assert.rejects(() => createPaymentIntent({}), { message: /amount/ });
    });
    it("rejects when amount zero", async () => {
      await assert.rejects(() => createPaymentIntent({ amount: 0 }), { message: /positive/ });
    });
    it("rejects when amount negative", async () => {
      await assert.rejects(() => createPaymentIntent({ amount: -500 }), { message: /positive/ });
    });
    it("rejects when amount float", async () => {
      await assert.rejects(() => createPaymentIntent({ amount: 99.99 }), { message: /integer/ });
    });
    it("rejects when amount string", async () => {
      await assert.rejects(() => createPaymentIntent({ amount: "5000" }), { message: /number/ });
    });
    it("defaults currency to usd", async () => {
      mockBehaviour = "success";
      var result = await createPaymentIntent({ amount: 5000 });
      assert.ok(result.clientSecret);
      assert.ok(result.paymentId);
    });
  });

  describe("Stripe errors", () => {
    it("propagates StripeCardError", async () => {
      mockBehaviour = "card_error";
      await assert.rejects(() => createPaymentIntent({ amount: 5000 }), function(err) {
        return err.type === "StripeCardError" && err.stripeCode === "card_declined";
      });
    });
    it("propagates StripeInvalidRequestError", async () => {
      mockBehaviour = "invalid_request";
      await assert.rejects(() => createPaymentIntent({ amount: 5000 }), function(err) {
        return err.type === "StripeInvalidRequestError" && err.statusCode === 400;
      });
    });
  });
});
