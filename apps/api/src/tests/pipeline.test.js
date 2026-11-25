import test from "node:test";
import assert from "node:assert/strict";
import { pipe, compose, pipeAsync, composeAsync } from "../utils/pipeline.js";

test("pipe: executes stages left to right", () => {
  const addOne = (n) => n + 1;
  const double = (n) => n * 2;
  const toString = (n) => `value:${n}`;

  const fn = pipe(addOne, double, toString);
  assert.equal(fn(1), "value:4");
});

test("pipe: supports multi-argument entry stage", () => {
  const add = (a, b) => a + b;
  const double = (n) => n * 2;

  const fn = pipe(add, double);
  assert.equal(fn(2, 3), 10);
});

test("pipe: zero-argument pipeline behaves as identity", () => {
  const fn = pipe();
  assert.equal(fn(42), 42);
  assert.deepEqual(fn({ a: 1 }), { a: 1 });
});

test("pipe: throws descriptive TypeError on non-function argument", () => {
  assert.throws(() => pipe((x) => x, 123), {
    name: "TypeError",
    message: /pipe:.*index 1.*number/,
  });
});

test("pipe: propagates thrown errors from intermediate stages", () => {
  const explode = () => {
    throw new Error("boom");
  };
  const fn = pipe((x) => x, explode, (x) => x);
  assert.throws(() => fn(1), { message: "boom" });
});

test("compose: executes stages right to left", () => {
  const addOne = (n) => n + 1;
  const double = (n) => n * 2;

  const fn = compose(double, addOne);
  assert.equal(fn(3), 8);
});

test("compose: supports multi-argument rightmost stage", () => {
  const add = (a, b) => a + b;
  const double = (n) => n * 2;

  const fn = compose(double, add);
  assert.equal(fn(2, 3), 10);
});

test("compose: zero-argument pipeline behaves as identity", () => {
  const fn = compose();
  assert.equal(fn("hello"), "hello");
});

test("compose: throws descriptive TypeError on non-function argument", () => {
  assert.throws(() => compose(null, (x) => x), {
    name: "TypeError",
    message: /compose:.*index 0.*null/,
  });
});

test("pipeAsync: resolves async and sync stages sequentially", async () => {
  const addOneAsync = async (n) => n + 1;
  const double = (n) => n * 2;
  const toStringAsync = async (n) => `value:${n}`;

  const fn = pipeAsync(addOneAsync, double, toStringAsync);
  assert.equal(await fn(1), "value:4");
});

test("pipeAsync: supports multi-argument entry stage", async () => {
  const addAsync = async (a, b) => a + b;
  const double = (n) => n * 2;

  const fn = pipeAsync(addAsync, double);
  assert.equal(await fn(2, 3), 10);
});

test("pipeAsync: zero-argument pipeline behaves as identity", async () => {
  const fn = pipeAsync();
  assert.equal(await fn(42), 42);
});

test("pipeAsync: throws descriptive TypeError on non-function argument", () => {
  assert.throws(() => pipeAsync((x) => x, "nope"), {
    name: "TypeError",
    message: /pipeAsync:.*index 1.*string/,
  });
});

test("pipeAsync: halts and rejects immediately on thrown error in a stage", async () => {
  const explode = async () => {
    throw new Error("async boom");
  };
  const neverCalled = () => {
    throw new Error("should not be reached");
  };

  const fn = pipeAsync((x) => x, explode, neverCalled);
  await assert.rejects(fn(1), { message: "async boom" });
});

test("pipeAsync: halts and rejects immediately on promise rejection in a stage", async () => {
  const rejects = () => Promise.reject(new Error("rejected"));
  const neverCalled = () => {
    throw new Error("should not be reached");
  };

  const fn = pipeAsync((x) => x, rejects, neverCalled);
  await assert.rejects(fn(1), { message: "rejected" });
});

test("composeAsync: resolves async and sync stages right to left", async () => {
  const addOneAsync = async (n) => n + 1;
  const double = (n) => n * 2;

  const fn = composeAsync(double, addOneAsync);
  assert.equal(await fn(3), 8);
});

test("composeAsync: supports multi-argument rightmost stage", async () => {
  const addAsync = async (a, b) => a + b;
  const double = (n) => n * 2;

  const fn = composeAsync(double, addAsync);
  assert.equal(await fn(2, 3), 10);
});

test("composeAsync: zero-argument pipeline behaves as identity", async () => {
  const fn = composeAsync();
  assert.equal(await fn("hello"), "hello");
});

test("composeAsync: throws descriptive TypeError on non-function argument", () => {
  assert.throws(() => composeAsync(undefined, (x) => x), {
    name: "TypeError",
    message: /composeAsync:.*index 0.*undefined/,
  });
});

test("composeAsync: halts and rejects immediately on rejection in a stage", async () => {
  const rejects = () => Promise.reject(new Error("composed rejection"));
  const neverCalled = () => {
    throw new Error("should not be reached");
  };

  const fn = composeAsync(neverCalled, rejects);
  await assert.rejects(fn(1), { message: "composed rejection" });
});
