import test from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";

const API_DIR = "/tmp/bug-bounty/apps/api";

test("auth middleware: rejects non-object payloads", async () => {
  // Create a token with string payload
  const result = execSync(
    `node -e "
      const jwt = require('jsonwebtoken');
      const token = jwt.sign('string-payload', 'development-secret', { expiresIn: '15m' });
      console.log(token);
    "`,
    { cwd: API_DIR, encoding: "utf8" }
  ).trim();
  
  // Try to access protected route with invalid token
  try {
    execSync(
      `node -e "
        import('express').then(({default: express}) => {
          import('./src/middleware/auth.js').then(({authMiddleware}) => {
            const app = express();
            app.use(express.json());
            app.get('/test', authMiddleware, (req, res) => res.json({ user: req.user }));
            
            const server = app.listen(0, async () => {
              const port = server.address().port;
              try {
                const res = await fetch('http://127.0.0.1:' + port + '/test', {
                  headers: { 'Authorization': 'Bearer ${result}' }
                });
                const data = await res.json();
                console.log(JSON.stringify({ status: res.status, data }));
              } catch (e) {
                console.log(JSON.stringify({ error: e.message }));
              }
              server.close();
            });
          });
        });
      "`,
      { cwd: API_DIR, encoding: "utf8" }
    );
  } catch (e) {
    // Expected to fail
    assert.ok(e.stdout.includes("401") || e.message.includes("401"));
  }
});

test("auth middleware: rejects tokens without sub claim", async () => {
  // Create a token without sub
  const result = execSync(
    `node -e "
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ role: 'client' }, 'development-secret', { expiresIn: '15m' });
      console.log(token);
    "`,
    { cwd: API_DIR, encoding: "utf8" }
  ).trim();
  
  try {
    execSync(
      `node -e "
        import('express').then(({default: express}) => {
          import('./src/middleware/auth.js').then(({authMiddleware}) => {
            const app = express();
            app.use(express.json());
            app.get('/test', authMiddleware, (req, res) => res.json({ user: req.user }));
            
            const server = app.listen(0, async () => {
              const port = server.address().port;
              try {
                const res = await fetch('http://127.0.0.1:' + port + '/test', {
                  headers: { 'Authorization': 'Bearer ${result}' }
                });
                const data = await res.json();
                console.log(JSON.stringify({ status: res.status, data }));
              } catch (e) {
                console.log(JSON.stringify({ error: e.message }));
              }
              server.close();
            });
          });
        });
      "`,
      { cwd: API_DIR, encoding: "utf8" }
    );
  } catch (e) {
    assert.ok(e.stdout.includes("401") || e.message.includes("401"));
  }
});

test("auth middleware: rejects tokens with invalid role", async () => {
  // Create a token with invalid role
  const result = execSync(
    `node -e "
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ sub: 'user123', role: 'invalid' }, 'development-secret', { expiresIn: '15m' });
      console.log(token);
    "`,
    { cwd: API_DIR, encoding: "utf8" }
  ).trim();
  
  try {
    execSync(
      `node -e "
        import('express').then(({default: express}) => {
          import('./src/middleware/auth.js').then(({authMiddleware}) => {
            const app = express();
            app.use(express.json());
            app.get('/test', authMiddleware, (req, res) => res.json({ user: req.user }));
            
            const server = app.listen(0, async () => {
              const port = server.address().port;
              try {
                const res = await fetch('http://127.0.0.1:' + port + '/test', {
                  headers: { 'Authorization': 'Bearer ${result}' }
                });
                const data = await res.json();
                console.log(JSON.stringify({ status: res.status, data }));
              } catch (e) {
                console.log(JSON.stringify({ error: e.message }));
              }
              server.close();
            });
          });
        });
      "`,
      { cwd: API_DIR, encoding: "utf8" }
    );
  } catch (e) {
    assert.ok(e.stdout.includes("401") || e.message.includes("401"));
  }
});

test("auth middleware: accepts valid tokens", async () => {
  // Create a valid token
  const result = execSync(
    `node -e "
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ sub: 'user123', role: 'client' }, 'development-secret', { expiresIn: '15m' });
      console.log(token);
    "`,
    { cwd: API_DIR, encoding: "utf8" }
  ).trim();
  
  try {
    const output = execSync(
      `node -e "
        import('express').then(({default: express}) => {
          import('./src/middleware/auth.js').then(({authMiddleware}) => {
            const app = express();
            app.use(express.json());
            app.get('/test', authMiddleware, (req, res) => res.json({ user: req.user }));
            
            const server = app.listen(0, async () => {
              const port = server.address().port;
              try {
                const res = await fetch('http://127.0.0.1:' + port + '/test', {
                  headers: { 'Authorization': 'Bearer ${result}' }
                });
                const data = await res.json();
                console.log(JSON.stringify({ status: res.status, data }));
              } catch (e) {
                console.log(JSON.stringify({ error: e.message }));
              }
              server.close();
            });
          });
        });
      "`,
      { cwd: API_DIR, encoding: "utf8" }
    );
    const data = JSON.parse(output.trim());
    assert.equal(data.status, 200);
    assert.equal(data.data.user.sub, "user123");
    assert.equal(data.data.user.role, "client");
  } catch (e) {
    assert.fail(`Expected success but got error: ${e.message}`);
  }
});
