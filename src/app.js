<content>
const express = require('express');
const bodyParser = require('body-parser');
const usersRouter = require('./routes/users');

const app = express();

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/api/users', usersRouter);

module.exports = app;
</content>