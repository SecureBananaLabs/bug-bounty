'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_CURRENCY,
  normalizeCurrency,
  createPaymentIntent,
} = require('../services/paymentService');

test('normalizeCurrency trims whitespace and lowercases the code', () => {
  assert.equal(normalizeCurrency(' USD '), 'usd');
  assert.equal(normalizeCurrency('USD'), 'usd');
  assert.equal(normalizeCurrency('EuR'), 'eur');
  assert.equal(normalizeCurrency(' jpy\t'), 'jpy');
});

test('normalizeCurrency falls back to the default for blank values', () => {
  assert.equal(normalizeCurrency(''), DEFAULT_CURRENCY);
  assert.equal(normalizeCurrency('   '), DEFAULT_CURRENCY);
  assert.equal(normalizeCurrency(undefined), DEFAULT_CURRENCY);
  assert.equal(normalizeCurrency(null), DEFAULT_CURRENCY);
});

test('normalizeCurrency falls back to the default for non-string values', () => {
  assert.equal(normalizeCurrency(123), DEFAULT_CURRENCY);
  assert.equal(normalizeCurrency({}), DEFAULT_CURRENCY);
});

test('createPaymentIntent returns canonical lowercase currency', async () => {
  const intent = await createPaymentIntent({ amount: 125, currency: ' USD ' });

  assert.equal(intent.currency, 'usd');
  assert.equal(intent.amount, 125);
});

test('createPaymentIntent normalizes mixed-case currency values', async () => {
  const intent = await createPaymentIntent({ amount: 250, currency: 'UsD' });

  assert.equal(intent.currency, 'usd');
});

test('createPaymentIntent defaults blank currency to "usd"', async () => {
  const blank = await createPaymentIntent({ amount: 125, currency: '   ' });
  const missing = await createPaymentIntent({ amount: 125 });

  assert.equal(blank.currency, 'usd');
  assert.equal(missing.currency, 'usd');
});

test('createPaymentIntent leaves an already-canonical currency unchanged', async () => {
  const intent = await createPaymentIntent({ amount: 99, currency: 'eur' });

  assert.equal(intent.currency, 'eur');
});
