'use strict';

const paymentService = require('../services/paymentService');

describe('paymentService payment ID generation', () => {
  const FIXED_NOW = 1700000000000;
  let originalDateNow;

  beforeEach(() => {
    originalDateNow = Date.now;
    // Freeze the clock so every call lands in the "same millisecond".
    Date.now = () => FIXED_NOW;
  });

  afterEach(() => {
    Date.now = originalDateNow;
  });

  it('keeps the pay_ prefix', () => {
    expect(paymentService.generatePaymentId().startsWith('pay_')).toBe(true);
  });

  it('generates unique IDs even when Date.now is frozen (same-millisecond regression)', () => {
    const total = 1000;
    const ids = new Set();
    for (let i = 0; i < total; i += 1) {
      ids.add(paymentService.generatePaymentId());
    }
    expect(ids.size).toBe(total);
  });

  it('creates payment intents with unique IDs in the same millisecond', async () => {
    const first = await paymentService.createPaymentIntent({ amount: 1000, currency: 'usd' });
    const second = await paymentService.createPaymentIntent({ amount: 2500, currency: 'usd' });

    expect(first.paymentId).toMatch(/^pay_/);
    expect(second.paymentId).toMatch(/^pay_/);
    expect(first.paymentId).not.toBe(second.paymentId);
  });
});
