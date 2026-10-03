<content>
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { apiLimiter } = require('./middleware/rateLimiter');
// ... other imports

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting middleware - MOVED BEFORE express.json()
app.use(apiLimiter);

// Body parsing middleware
app.use(express.json());
// ... rest of the app configuration
</content>