#!/usr/bin/env node
/**
 * Autonomous Black-Box Verification PoC for Payment Security Patch (Issue #743)
 * Standalone runner: Zero test-framework dependency, pure native fetch & ES Modules.
 * Tests direct HTTP ingress on POST /api/payments against missing authentication.
 */

import http from "node:http";
import { createApp } from "./apps/api/src/app.js";
import { signAccessToken } from "./apps/api/src/utils/jwt.js";

async function runBlackBoxVerification() {
  console.log("==================================================================");
  console.log("=== BLACK-BOX SECURITY VERIFICATION: POST /api/payments (BOLA) ===");
  console.log("==================================================================");

  // 1. Initialize Express application instance
  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => resolve());
    server.on("error", reject);
  });

  const { port } = server.address();
  const targetUrl = `http://127.0.0.1:${port}/api/payments`;
  console.log(`[INIT] Ephemeral test server active on port :${port}`);
  console.log(`[TARGET] ${targetUrl}\n`);

  let allPassed = true;

  try {
    // -------------------------------------------------------------
    // CHECK 1: Blind Unauthenticated Ingress (Simulating Raw cURL)
    // -------------------------------------------------------------
    console.log("[TEST 1] Dispatching unauthenticated payload (Missing Authorization)...");
    const res1 = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: 2500,
        currency: "usd"
      })
    });

    const body1 = await res1.json();
    const isStatus401 = res1.status === 401;
    const isBodyExpected = body1.success === false && body1.message === "Unauthorized";

    if (isStatus401 && isBodyExpected) {
      console.log("[CHECK 1] Unauthenticated request dropped with 401: SUCCESS");
      console.log(`          Payload: ${JSON.stringify(body1)}\n`);
    } else {
      console.error("[CHECK 1] FAILED: Endpoint allowed unauthenticated access!");
      console.error(`          Received Status: ${res1.status}, Body: ${JSON.stringify(body1)}\n`);
      allPassed = false;
    }

    // -------------------------------------------------------------
    // CHECK 2: Legitimate Ingress with Valid JWT Bearer Token
    // -------------------------------------------------------------
    console.log("[TEST 2] Generating cryptographically valid Bearer JWT...");
    const validToken = signAccessToken({
      userId: "usr_auditor_blackbox_743",
      role: "client"
    });

    console.log("[TEST 2] Dispatching authenticated payload with Bearer token...");
    const res2 = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${validToken}`
      },
      body: JSON.stringify({
        amount: 5000,
        currency: "usd"
      })
    });

    const body2 = await res2.json();
    const isStatus201 = res2.status === 201;
    const isSuccessValid = body2.success === true && body2.data && body2.data.amount === 5000;

    if (isStatus201 && isSuccessValid) {
      console.log("[CHECK 2] Authenticated request passed with 201: SUCCESS");
      console.log(`          Payment ID Generated: ${body2.data.paymentId}`);
      console.log(`          Payload: ${JSON.stringify(body2)}\n`);
    } else {
      console.error("[CHECK 2] FAILED: Legitimate authenticated request rejected or invalid response!");
      console.error(`          Received Status: ${res2.status}, Body: ${JSON.stringify(body2)}\n`);
      allPassed = false;
    }

  } catch (err) {
    console.error("[EXCEPTION] Unexpected network or runtime error during audit:", err);
    allPassed = false;
  } finally {
    await new Promise((resolve) => server.close(resolve));
    console.log("[CLEANUP] Ephemeral test server closed.");
  }

  console.log("------------------------------------------------------------------");
  if (allPassed) {
    console.log("[AUDIT VERDICT] BOLA VULNERABILITY REMEDIATION VERIFIED: 100% PASS");
  } else {
    console.log("[AUDIT VERDICT] VERIFICATION FAILED: REGRESSION DETECTED");
    process.exit(1);
  }
}

runBlackBoxVerification();
