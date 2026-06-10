const jwt = require("jsonwebtoken");
const axios = require("axios");

const SECRET = "development-secret";
const PORT = 4000;
const URL = `http://localhost:${PORT}/api/payments`;

async function runTest() {
  console.log("🚀 Starting Payment Auth PoC...");

  // 1. Test WITHOUT token
  try {
    await axios.post(URL, { amount: 100 }, { headers: {} });
    console.log("❌ Failed: Request without token should have been rejected");
  } catch (err) {
    if (err.response?.status === 401) {
      console.log("✅ Passed: Request without token rejected with 401");
    } else {
      console.log(`❌ Failed: Unexpected status ${err.response?.status}`);
    }
  }

  // 2. Test WITH invalid token
  try {
    await axios.post(URL, { amount: 100 }, { 
      headers: { Authorization: "Bearer invalid-token-123" } 
    });
    console.log("❌ Failed: Request with invalid token should have been rejected");
  } catch (err) {
    if (err.response?.status === 401) {
      console.log("✅ Passed: Request with invalid token rejected with 401");
    } else {
      console.log(`❌ Failed: Unexpected status ${err.response?.status}`);
    }
  }

  // 3. Test WITH valid token
  try {
    const token = jwt.sign({ id: "user123" }, SECRET, { expiresIn: "1h" });
    const res = await axios.post(URL, { amount: 100 }, { 
      headers: { Authorization: `Bearer ${token}` } 
    });
    console.log("✅ Passed: Request with valid token accepted (Status: " + res.status + ")");
  } catch (err) {
    if (err.response?.status === 401) {
      console.log("❌ Failed: Valid token was rejected with 401");
    } else {
      console.log(`ℹ️  Request went through auth but hit business logic: ${err.response?.status}`);
    }
  }
}

runTest().catch(console.error);
