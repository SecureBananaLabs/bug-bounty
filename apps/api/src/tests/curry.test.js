import test from 'node:test';
import assert from 'node:assert/strict';
import { curry } from '../utils/curry.js';
import defaultCurry from '../utils/curry.js';

test('curry: default and named export are identical', () => {
  assert.equal(curry, defaultCurry);
  assert.equal(typeof curry._, 'symbol');
  assert.equal(curry._, curry.placeholder);
});

test('curry: curries function one argument at a time', () => {
  const sum = (a, b, c) => a + b + c;
  const curried = curry(sum);

  assert.equal(curried.arity, 3);
  assert.equal(curried.length, 3);

  const step1 = curried(1);
  assert.equal(typeof step1, 'function');
  assert.equal(step1.length, 2);

  const step2 = step1(2);
  assert.equal(typeof step2, 'function');
  assert.equal(step2.length, 1);

  const result = step2(3);
  assert.equal(result, 6);
});

test('curry: curries function with multiple arguments in chunks', () => {
  const join = (a, b, c, d) => `${a}-${b}-${c}-${d}`;
  const curried = curry(join);

  assert.equal(curried(1, 2)(3, 4), '1-2-3-4');
  assert.equal(curried(1)(2, 3, 4), '1-2-3-4');
  assert.equal(curried(1, 2, 3)(4), '1-2-3-4');
  assert.equal(curried(1, 2, 3, 4), '1-2-3-4');
});

test('curry: passes extra arguments through to the underlying function', () => {
  const collect = (a, b, ...rest) => [a, b, ...rest];
  const curried = curry(collect, 2);

  assert.deepEqual(curried('x', 'y', 'z', 'w'), ['x', 'y', 'z', 'w']);
  assert.deepEqual(curried('x')('y', 'z', 'w'), ['x', 'y', 'z', 'w']);
});

test('curry: respects explicit arity override for variadic functions', () => {
  const variadicSum = (...args) => args.reduce((acc, v) => acc + v, 0);
  const curried = curry(variadicSum, 4);

  assert.equal(curried.arity, 4);
  assert.equal(curried(1)(2)(3)(4), 10);
  assert.equal(curried(1, 2)(3, 4), 10);
});

test('curry: zero arity immediately executes on call', () => {
  let counter = 0;
  const noop = () => ++counter;
  const curried = curry(noop, 0);

  assert.equal(curried.arity, 0);
  assert.equal(curried.length, 0);
  assert.equal(curried(), 1);
  assert.equal(curried(10, 20), 2);
});

test('curry: handles placeholders in arbitrary positions', () => {
  const fn = (a, b, c) => [a, b, c];
  const curried = curry(fn);

  // Middle placeholder
  assert.deepEqual(curried(1, curry._, 3)(2), [1, 2, 3]);

  // First placeholder
  assert.deepEqual(curried(curry._, 2, 3)(1), [1, 2, 3]);

  // Multiple placeholders in initial invocation
  assert.deepEqual(curried(curry._, curry._, 3)(1)(2), [1, 2, 3]);
  assert.deepEqual(curried(curry._, curry._, 3)(1, 2), [1, 2, 3]);
});

test('curry: supports placeholder replacement with subsequent placeholder', () => {
  const fn = (a, b, c) => [a, b, c];
  const curried = curry(fn);

  // Replace placeholder at index 0 with another placeholder, fill index 2 with 3
  const intermediate = curried(curry._, 2)(curry._, 3);
  assert.equal(typeof intermediate, 'function');

  // Fill remaining index 0
  assert.deepEqual(intermediate(1), [1, 2, 3]);
});

test('curry: branches are immutable and do not interfere with each other', () => {
  const subtract = (a, b, c) => a - b - c;
  const curried = curry(subtract);

  const base = curried(100);
  assert.equal(base(20, 10), 70);
  assert.equal(base(30, 5), 65);
  assert.equal(base(10)(5), 85);

  const withPlaceholder = curried(curry._, 50);
  assert.equal(withPlaceholder(200, 10), 140);
  assert.equal(withPlaceholder(100, 20), 30);
});

test('curry: propagates target function exceptions transparently', () => {
  const failing = (a, b) => {
    if (b === 0) throw new RangeError('Division by zero');
    return a / b;
  };
  const curried = curry(failing);

  assert.equal(curried(10)(2), 5);
  assert.throws(() => curried(10)(0), {
    name: 'RangeError',
    message: 'Division by zero'
  });
});

test('curry: preserves dynamic this context across invocations', () => {
  const calculator = {
    factor: 5,
    multiply(a, b) {
      return (a + b) * this.factor;
    }
  };

  calculator.curriedMultiply = curry(calculator.multiply);

  assert.equal(calculator.curriedMultiply(2, 3), 25);
  assert.equal(calculator.curriedMultiply(2)(3), 25);

  // Explicit .call context binding
  const altContext = { factor: 10 };
  assert.equal(calculator.curriedMultiply.call(altContext, 2)(3), 50);
});

test('curry: validates function argument and throws TypeError on invalid input', () => {
  assert.throws(() => curry(null), TypeError);
  assert.throws(() => curry(undefined), TypeError);
  assert.throws(() => curry(42), TypeError);
  assert.throws(() => curry('not-a-func'), TypeError);
  assert.throws(() => curry({}), TypeError);
});

test('curry: validates arity parameter boundaries', () => {
  const fn = (a, b) => a + b;

  assert.throws(() => curry(fn, -1), TypeError);
  assert.throws(() => curry(fn, 1.5), TypeError);
  assert.throws(() => curry(fn, NaN), TypeError);
  assert.throws(() => curry(fn, 'two'), TypeError);
  assert.throws(() => curry(fn, 1001), RangeError);

  // Non-negative integer succeeds
  const valid = curry(fn, 2);
  assert.equal(valid.arity, 2);
});

test('curry: curried function length decreases as actual arguments are provided', () => {
  const fn = (a, b, c, d) => [a, b, c, d];
  const curried = curry(fn);

  assert.equal(curried.length, 4);
  const step1 = curried(1);
  assert.equal(step1.length, 3);

  const step2 = step1(curry._, 3);
  // Still needs 2 arguments (the placeholder and the 4th argument)
  assert.equal(step2.length, 2);

  const step3 = step2(2);
  // Still needs 1 argument (the 4th argument)
  assert.equal(step3.length, 1);

  const finalRes = step3(4);
  assert.deepEqual(finalRes, [1, 2, 3, 4]);
});
