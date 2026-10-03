const express = require('express');
const authRoutes = require('./api/auth/routes');

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Auth routes
app.use('/api/auth', authRoutes);

module.exports = app;