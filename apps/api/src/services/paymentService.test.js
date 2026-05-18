import { createPaymentIntent } from './paymentService.js';
import assert from 'assert';

async function runTests() {
  let passed = 0;
  
  // Test 1: Valid
  try {
    const mockStripe = {
      paymentIntents: {
        create: async (args) => {
          assert.strictEqual(args.amount, 1500);
          assert.strictEqual(args.currency, 'usd');
          return { id: 'pi_test123', client_secret: 'secret_test123' };
        }
      }
    };
    
    const result = await createPaymentIntent({ amount: 1500 }, mockStripe);
    assert.strictEqual(result.paymentId, 'pi_test123');
    assert.strictEqual(result.clientSecret, 'secret_test123');
    passed++;
  } catch (e) {
    console.error("Test 1 failed", e);
  }

  // Test 2: Invalid Amount
  try {
    const mockStripe = { paymentIntents: { create: async () => ({}) }};
    await createPaymentIntent({ amount: -50 }, mockStripe);
    console.error("Test 2 failed: Should have thrown");
  } catch (e) {
    assert.strictEqual(e.message, 'Invalid amount: amount must be a positive integer representing the smallest currency unit.');
    passed++;
  }

  console.log(`Payment tests completed: ${passed}/2 passed`);
}

if (process.env.NODE_ENV === 'test') {
  runTests();
}
