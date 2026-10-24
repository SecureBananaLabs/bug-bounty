import test from 'node:test';
import assert from 'node:assert/strict';
import { pipe, compose, pipeAsync, composeAsync } from '../utils/pipeline.js';

test('pipe executes functions synchronously left-to-right', () => {
  const add2 = (x) => x + 2;
  const square = (x) => x * x;
  const double = (x) => x * 2;

  // (3 + 2) = 5 -> 5^2 = 25 -> 25 * 2 = 50
  const pipeline = pipe(add2, square, double);
  assert.equal(pipeline(3), 50);
});

test('pipe supports multiple arguments in the initial function', () => {
  const multiply = (a, b, c) => a * b * c;
  const toString = (x) => `Total: ${x}`;

  const pipeline = pipe(multiply, toString);
  assert.equal(pipeline(2, 3, 4), 'Total: 24');
});

test('pipe with zero functions acts as an identity function', () => {
  const identity = pipe();
  assert.equal(identity('pass-through'), 'pass-through');
  assert.deepEqual(identity({ a: 1 }), { a: 1 });
});

test('pipe strictly rejects non-function arguments with TypeError', () => {
  assert.throws(() => pipe(x => x, null), {
    name: 'TypeError',
    message: '[pipe] Expected a callable function at index 1, received object',
  });

  assert.throws(() => pipe('not-a-func'), {
    name: 'TypeError',
    message: '[pipe] Expected a callable function at index 0, received string',
  });
});

test('compose executes functions synchronously right-to-left', () => {
  const add2 = (x) => x + 2;
  const square = (x) => x * x;
  const double = (x) => x * 2;

  // double(3) = 6 -> square(6) = 36 -> add2(36) = 38
  const composed = compose(add2, square, double);
  assert.equal(composed(3), 38);
});

test('compose supports multiple arguments in the rightmost function', () => {
  const sum = (a, b) => a + b;
  const halve = (x) => x / 2;

  const composed = compose(halve, sum);
  assert.equal(composed(10, 20), 15);
});

test('compose with zero functions acts as an identity function', () => {
  const identity = compose();
  assert.equal(identity(999), 999);
});

test('compose rejects non-function arguments with TypeError', () => {
  assert.throws(() => compose(undefined), {
    name: 'TypeError',
    message: '[compose] Expected a callable function at index 0, received undefined',
  });
});

test('pipeAsync executes async and sync functions sequentially left-to-right', async () => {
  const fetchUser = async (id) => ({ id, name: 'Alice' });
  const attachRole = async (user) => ({ ...user, role: 'admin' });
  const formatUser = (user) => `${user.name} is ${user.role}`;

  const pipeline = pipeAsync(fetchUser, attachRole, formatUser);
  const result = await pipeline(42);

  assert.equal(result, 'Alice is admin');
});

test('pipeAsync supports multiple arguments in the initial function', async () => {
  const joinAsync = async (prefix, suffix) => `${prefix}_${suffix}`;
  const upper = (str) => str.toUpperCase();

  const pipeline = pipeAsync(joinAsync, upper);
  const result = await pipeline('hello', 'world');

  assert.equal(result, 'HELLO_WORLD');
});

test('pipeAsync acts as an async identity function when empty', async () => {
  const identity = pipeAsync();
  const result = await identity('async-data');
  assert.equal(result, 'async-data');
});

test('pipeAsync rejects immediately when an intermediate step fails', async () => {
  const step1 = async (x) => x + 1;
  const step2 = async () => {
    throw new Error('Pipeline stage failed');
  };
  const step3 = async (x) => x * 10;

  const pipeline = pipeAsync(step1, step2, step3);

  await assert.rejects(
    async () => pipeline(5),
    { message: 'Pipeline stage failed' }
  );
});

test('composeAsync executes functions sequentially right-to-left', async () => {
  const addAsync = async (x) => x + 10;
  const multAsync = async (x) => x * 3;

  // mult(5) = 15 -> add(15) = 25
  const pipeline = composeAsync(addAsync, multAsync);
  const result = await pipeline(5);

  assert.equal(result, 25);
});

test('pipeAsync and composeAsync reject non-callable arguments', () => {
  assert.throws(() => pipeAsync(async x => x, 42), {
    name: 'TypeError',
    message: '[pipeAsync] Expected a callable function at index 1, received number',
  });

  assert.throws(() => composeAsync({}, async x => x), {
    name: 'TypeError',
    message: '[composeAsync] Expected a callable function at index 0, received object',
  });
});
