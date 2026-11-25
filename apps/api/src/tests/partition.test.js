import test from "node:test";
import assert from "node:assert/strict";
import { partition, PartitionError } from "../utils/partition.js";

test("throws a descriptive TypeError for non-array input", () => {
  for (const invalid of [null, undefined, 42, "string", {}, true]) {
    assert.throws(() => partition(invalid), TypeError);
  }
});

test("defaults to Boolean truthiness when predicate is omitted", () => {
  const [truthy, falsy] = partition([0, 1, "", "a", null, undefined, false, true]);
  assert.deepEqual(truthy, [1, "a", true]);
  assert.deepEqual(falsy, [0, "", null, undefined, false]);
});

test("supports a predicate function receiving (value, index, array)", () => {
  const input = [1, 2, 3, 4, 5];
  const [even, odd] = partition(input, (value, index, array) => {
    assert.equal(array, input);
    assert.equal(array[index], value);
    return value % 2 === 0;
  });
  assert.deepEqual(even, [2, 4]);
  assert.deepEqual(odd, [1, 3, 5]);
});

test("preserves thisArg context binding for function predicates", () => {
  const context = { threshold: 3 };
  const [above, belowOrEqual] = partition(
    [1, 2, 3, 4, 5],
    function (value) {
      return value > this.threshold;
    },
    { thisArg: context }
  );
  assert.deepEqual(above, [4, 5]);
  assert.deepEqual(belowOrEqual, [1, 2, 3]);
});

test("supports a string property name as predicate", () => {
  const input = [{ active: true, id: 1 }, { active: false, id: 2 }, { active: true, id: 3 }];
  const [active, inactive] = partition(input, "active");
  assert.deepEqual(active.map((item) => item.id), [1, 3]);
  assert.deepEqual(inactive.map((item) => item.id), [2]);
});

test("supports a Symbol property key as predicate", () => {
  const flag = Symbol("flag");
  const a = { [flag]: true, id: 1 };
  const b = { [flag]: false, id: 2 };
  const [truthy, falsy] = partition([a, b], flag);
  assert.deepEqual(truthy, [a]);
  assert.deepEqual(falsy, [b]);
});

test("rejects predicate values that are not function, string, or symbol", () => {
  assert.throws(() => partition([1, 2, 3], 42), TypeError);
});

test("defends sparse array holes against Array.prototype pollution", () => {
  // eslint-disable-next-line no-extend-native
  Array.prototype[1] = "polluted";
  try {
    const sparse = [1, , 3]; // eslint-disable-line no-sparse-arrays
    const seen = [];
    partition(sparse, (value, index) => {
      seen.push(value);
      return Boolean(value);
    });
    assert.deepEqual(seen, [1, undefined, 3]);
  } finally {
    delete Array.prototype[1];
  }
});

test("skipHoles option omits holes entirely from both outputs", () => {
  const sparse = [1, , 3, , 5]; // eslint-disable-line no-sparse-arrays
  const [truthy, falsy] = partition(sparse, Boolean, { skipHoles: true });
  assert.deepEqual(truthy, [1, 3, 5]);
  assert.deepEqual(falsy, []);
});

test("without skipHoles, holes are evaluated as undefined", () => {
  const sparse = [1, , 3]; // eslint-disable-line no-sparse-arrays
  const [truthy, falsy] = partition(sparse);
  assert.deepEqual(truthy, [1, 3]);
  assert.deepEqual(falsy, [undefined]);
});

test("wraps unhandled predicate errors with index context and original cause", () => {
  const boom = new Error("boom");
  try {
    partition([1, 2, 3], (value, index) => {
      if (index === 1) throw boom;
      return true;
    });
    assert.fail("expected partition to throw");
  } catch (error) {
    assert.ok(error instanceof PartitionError);
    assert.equal(error.index, 1);
    assert.equal(error.cause, boom);
    assert.match(error.message, /index 1/);
  }
});

test("suppressErrors treats predicate failures as falsy instead of throwing", () => {
  const [truthy, falsy] = partition(
    [1, 2, 3],
    (value, index) => {
      if (index === 1) throw new Error("boom");
      return true;
    },
    { suppressErrors: true }
  );
  assert.deepEqual(truthy, [1, 3]);
  assert.deepEqual(falsy, [2]);
});

test("onError hook receives wrapped error and can customize classification", () => {
  const recovered = [];
  const [truthy, falsy] = partition(
    [1, 2, 3],
    (value, index) => {
      if (index === 1) throw new Error("boom");
      return false;
    },
    {
      onError(error, value, index) {
        recovered.push({ index, value, isPartitionError: error instanceof PartitionError });
        return true;
      },
    }
  );
  assert.deepEqual(truthy, [2]);
  assert.deepEqual(falsy, [1, 3]);
  assert.deepEqual(recovered, [{ index: 1, value: 2, isPartitionError: true }]);
});

test("onError takes precedence over suppressErrors", () => {
  const [truthy, falsy] = partition(
    [1, 2, 3],
    (value, index) => {
      if (index === 0) throw new Error("boom");
      return false;
    },
    {
      suppressErrors: true,
      onError: () => true,
    }
  );
  assert.deepEqual(truthy, [1]);
  assert.deepEqual(falsy, [2, 3]);
});

test("returns empty partitions for an empty array", () => {
  const [truthy, falsy] = partition([]);
  assert.deepEqual(truthy, []);
  assert.deepEqual(falsy, []);
});
