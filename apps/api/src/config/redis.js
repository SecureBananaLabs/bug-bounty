const { createClient } = require('redis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({ url: redisUrl });

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

let isConnected = false;

async function connect() {
  if (!isConnected) {
    await redisClient.connect();
    isConnected = true;
  }
  return redisClient;
}

// Export a proxy that auto-connects on first use
const redis = new Proxy({}, {
  get(target, prop) {
    return async (...args) => {
      await connect();
      return redisClient[prop](...args);
    };
  },
});

module.exports = redis;
