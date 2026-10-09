const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// Other middleware and routes...
app.use(express.json());

app.get('/api/status', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/data', (req, res) => {
  res.json({ received: true });
});

app.put('/api/data/:id', (req, res) => {
  res.json({ updated: true });
});

app.delete('/api/data/:id', (req, res) => {
  res.json({ deleted: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
