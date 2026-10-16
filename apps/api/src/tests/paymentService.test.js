import test, { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import Stripe from 'stripe';

describe('paymentService', () => {
    let originalCreate;
    let paymentService;

    beforeEach(async () => {
        process.env.STRIPE_SECRET_KEY = 'sk_test_123';
        originalCreate = Stripe.resources.PaymentIntents.prototype.create;
        paymentService = await import('../services/paymentService.js');
    });

    afterEach(() => {
        Stripe.resources.PaymentIntents.prototype.create = originalCreate;
    });

    it('should create payment intent and return correctly', async () => {
        let passedArgs = null;
        Stripe.resources.PaymentIntents.prototype.create = async function(args) {
            passedArgs = args;
            return {
                id: 'pi_mock_123',
                client_secret: 'secret_123'
            };
        };

        const res = await paymentService.createPaymentIntent({ amount: 500, currency: 'eur' });

        assert.deepStrictEqual(res, {
            paymentId: 'pi_mock_123',
            amount: 500,
            currency: 'eur',
            provider: 'stripe',
            clientSecret: 'secret_123'
        });

        assert.deepStrictEqual(passedArgs, { amount: 500, currency: 'eur' });
    });

    it('should throw if amount is missing', async () => {
        await assert.rejects(
            async () => { await paymentService.createPaymentIntent({ currency: 'usd' }); },
            /payload.amount is required and must be a positive integer/
        );
    });

    it('should throw if amount is negative', async () => {
        await assert.rejects(
            async () => { await paymentService.createPaymentIntent({ amount: -50 }); },
            /payload.amount is required and must be a positive integer/
        );
    });

    it('should default to usd if currency is missing', async () => {
        let passedArgs = null;
        Stripe.resources.PaymentIntents.prototype.create = async function(args) {
            passedArgs = args;
            return {
                id: 'pi_mock_123',
                client_secret: 'secret_123'
            };
        };
        
        await paymentService.createPaymentIntent({ amount: 1000 });
        assert.deepStrictEqual(passedArgs, { amount: 1000, currency: 'usd' });
    });

    it('should re-throw Stripe errors', async () => {
        Stripe.resources.PaymentIntents.prototype.create = async function(args) {
            const err = new Error('Stripe API Error');
            err.type = 'StripeCardError';
            throw err;
        };
        
        await assert.rejects(
            async () => { await paymentService.createPaymentIntent({ amount: 100 }); },
            /Stripe API Error/
        );
    });

    it('should run integration test against Stripe API if env flag is set', async () => {
        if (!process.env.RUN_STRIPE_INTEGRATION_TEST) {
            // Skip if flag not set
            return;
        }

        // Must provide real process.env.STRIPE_SECRET_KEY for this to work
        Stripe.resources.PaymentIntents.prototype.create = originalCreate;

        const res = await paymentService.createPaymentIntent({ amount: 100 });
        assert.ok(res.paymentId.startsWith('pi_'));
        assert.ok(res.clientSecret.includes('_secret_'));
        assert.strictEqual(res.amount, 100);
        assert.strictEqual(res.currency, 'usd');
    });
});
