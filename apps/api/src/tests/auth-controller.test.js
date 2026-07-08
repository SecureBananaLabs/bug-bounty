import test from "node:test";
import assert from "node:assert/strict";
import {
  login,
  refresh,
  register,
  setAuthServiceForTest
} from "../controllers/authController.js";

function createResponseRecorder() {
  return {
    statusCode: 200,
    payload: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    }
  };
}

test("register returns the standard 500 payload when registerUser throws", async () => {
  setAuthServiceForTest({
    async registerUser() {
      throw new Error("database unavailable");
    },
    async loginUser() {
      throw new Error("unused");
    },
    async refreshToken() {
      throw new Error("unused");
    }
  });
  const res = createResponseRecorder();

  try {
    await register({
      body: {
        email: "test@example.com",
        password: "password123",
        role: "client"
      }
    }, res);
  } finally {
    setAuthServiceForTest();
  }

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.payload, {
    success: false,
    message: "Unexpected server error"
  });
});

test("login returns the standard 500 payload when loginUser throws", async () => {
  setAuthServiceForTest({
    async registerUser() {
      throw new Error("unused");
    },
    async loginUser() {
      throw new Error("database unavailable");
    },
    async refreshToken() {
      throw new Error("unused");
    }
  });
  const res = createResponseRecorder();

  try {
    await login({
      body: {
        email: "test@example.com",
        password: "password123"
      }
    }, res);
  } finally {
    setAuthServiceForTest();
  }

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.payload, {
    success: false,
    message: "Unexpected server error"
  });
});

test("refresh returns the standard 500 payload when refreshToken throws", async () => {
  setAuthServiceForTest({
    async registerUser() {
      throw new Error("unused");
    },
    async loginUser() {
      throw new Error("unused");
    },
    async refreshToken() {
      throw new Error("token service unavailable");
    }
  });
  const res = createResponseRecorder();

  try {
    await refresh({ body: {} }, res);
  } finally {
    setAuthServiceForTest();
  }

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.payload, {
    success: false,
    message: "Unexpected server error"
  });
});
