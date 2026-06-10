const axios = require("axios");
const jwt = require("jsonwebtoken");

const PORT = 4000;
const URL = `http://localhost:${PORT}/api/auth/register`;
const SECRET = "development-secret";

async function runTest() {
  console.log("🚀 Starting Registration ID Mismatch PoC...");

  try {
    const res = await axios.post(URL, {
      email: "test@example.com",
      password: "password123",
      role: "client"
    });

    const { id, token } = res.data.data;
    const decoded = jwt.verify(token, SECRET);
    const tokenId = decoded.sub;

    console.log(`User ID: ${id}`);
    console.log(`Token sub: ${tokenId}`);

    if (id === tokenId) {
      console.log("✅ Passed: User ID matches Token sub!");
    } else {
      console.log("❌ Failed: ID mismatch detected!");
      process.exit(1);
    }
  } catch (err) {
    console.error("❌ Request failed:", err.response?.data || err.message);
    process.exit(1);
  }
}

runTest();
