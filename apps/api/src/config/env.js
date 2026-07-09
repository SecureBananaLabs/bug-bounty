const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const env = process.env.NODE_ENV || 'development';

const config = {
  development: {
    port: process.env.PORT || 5000,
    jwtSecret: process.env.JWT_SECRET || 'development-secret',
    db: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/dev_db',
    },
  },
  production: {
    port: process.env.PORT || 5000,
    jwtSecret: (() => {
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is required in production mode');
      }
      return process.env.JWT_SECRET;
    })(),
    db: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/prod_db',
    },
  },
  test: {
    port: process.env.PORT || 5000,
    jwtSecret: process.env.JWT_SECRET || 'test-secret',
    db: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/test_db',
    },
  },
};

module.exports = config[env];
