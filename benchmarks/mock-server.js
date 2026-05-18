import express from 'express';

const app = express();
app.use(express.json());

// Mock endpoints matching the benchmark suite
app.get('/health', (req, res) => {
  res.status(200).json({ ok: true, service: "api-mock" });
});

app.get('/api/jobs', (req, res) => {
  // Simulate some latency
  setTimeout(() => {
    res.status(200).json([{ id: 1, title: "Mock Job" }]);
  }, Math.random() * 50);
});

app.get('/api/search', (req, res) => {
  res.status(200).json({ results: [] });
});

app.post('/api/auth/login', (req, res) => {
  // Simulate a slightly slower login
  setTimeout(() => {
    res.status(200).json({ token: "mock-token" });
  }, 100 + Math.random() * 100);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Mock API running at http://localhost:${PORT}`);
});
