import test from "node:test";
import assert from "node:assert/strict";
import { deepFreeze } from "../utils/deepFreeze.js";

test("passes through primitives unchanged", () => {
  const sym = Symbol("s");
  assert.equal(deepFreeze(null), null);
  assert.equal(deepFreeze(undefined), undefined);
  assert.equal(deepFreeze(42), 42);
  assert.equal(deepFreeze("hello"), "hello");
  assert.equal(deepFreeze(true), true);
  assert.equal(deepFreeze(10n), 10n);
  assert.equal(deepFreeze(sym), sym);
});

test("deep freezes nested plain objects and arrays", () => {
  const obj = {
    a: 1,
    nested: { b: 2, list: [{ c: 3 }, { d: 4 }] },
  };

  const result = deepFreeze(obj);

  assert.equal(result, obj);
  assert.ok(Object.isFrozen(obj));
  assert.ok(Object.isFrozen(obj.nested));
  assert.ok(Object.isFrozen(obj.nested.list));
  assert.ok(Object.isFrozen(obj.nested.list[0]));
  assert.ok(Object.isFrozen(obj.nested.list[1]));

  assert.throws(() => {
    obj.nested.b = 99;
  }, TypeError);
  assert.throws(() => {
    obj.nested.list.push({ e: 5 });
  }, TypeError);
});

test("freezes own property descriptors including symbols and non-enumerable properties", () => {
  const sym = Symbol("hidden");
  const obj = {};
  Object.defineProperty(obj, "secret", {
    value: { inner: true },
    enumerable: false,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(obj, sym, {
    value: { fromSymbol: true },
    enumerable: true,
    writable: true,
    configurable: true,
  });

  deepFreeze(obj);

  assert.ok(Object.isFrozen(obj));
  assert.ok(Object.isFrozen(obj.secret));
  assert.ok(Object.isFrozen(obj[sym]));

  const secretDescriptor = Object.getOwnPropertyDescriptor(obj, "secret");
  assert.equal(secretDescriptor.writable, false);
  assert.equal(secretDescriptor.configurable, false);
});

test("guards against infinite recursion on circular references", () => {
  const obj = { name: "root" };
  obj.self = obj;
  obj.child = { parent: obj };

  assert.doesNotThrow(() => deepFreeze(obj));
  assert.ok(Object.isFrozen(obj));
  assert.ok(Object.isFrozen(obj.child));
  assert.equal(obj.self, obj);
});

test("defends embedded Map instances against mutation and freezes entries", () => {
  const valueObj = { count: 1 };
  const map = new Map([["key", valueObj]]);
  const obj = { data: map };

  deepFreeze(obj);

  assert.ok(Object.isFrozen(map));
  assert.ok(Object.isFrozen(valueObj));
  assert.throws(() => map.set("key2", {}), TypeError);
  assert.throws(() => map.delete("key"), TypeError);
  assert.throws(() => map.clear(), TypeError);
  assert.equal(map.get("key"), valueObj);
});

test("defends embedded Set instances against mutation and freezes items", () => {
  const itemObj = { flag: true };
  const set = new Set([itemObj]);
  const obj = { tags: set };

  deepFreeze(obj);

  assert.ok(Object.isFrozen(set));
  assert.ok(Object.isFrozen(itemObj));
  assert.throws(() => set.add({}), TypeError);
  assert.throws(() => set.delete(itemObj), TypeError);
  assert.throws(() => set.clear(), TypeError);
  assert.ok(set.has(itemObj));
});

test("handles accessor descriptors without invoking getters or setters", () => {
  let getterCalls = 0;
  let setterCalls = 0;
  const obj = {};
  Object.defineProperty(obj, "computed", {
    get() {
      getterCalls += 1;
      return 123;
    },
    set() {
      setterCalls += 1;
    },
    enumerable: true,
    configurable: true,
  });

  deepFreeze(obj);

  assert.equal(getterCalls, 0);
  assert.equal(setterCalls, 0);
  assert.ok(Object.isFrozen(obj));

  // The accessor itself still works after freezing; only its configurability is locked.
  assert.equal(obj.computed, 123);
  assert.equal(getterCalls, 1);

  const descriptor = Object.getOwnPropertyDescriptor(obj, "computed");
  assert.equal(descriptor.configurable, false);
});

test("handles circular references across mixed Map/Set/object graphs", () => {
  const set = new Set();
  const map = new Map();
  const obj = { map, set };
  set.add(obj);
  map.set("self", obj);

  assert.doesNotThrow(() => deepFreeze(obj));
  assert.ok(Object.isFrozen(obj));
  assert.ok(Object.isFrozen(map));
  assert.ok(Object.isFrozen(set));
});
