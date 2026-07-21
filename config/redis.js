const Redis = require('ioredis');

let redis;

const connectRedis = () => {
  if (!process.env.REDIS_URL) {
    console.warn('Redis not configured, skipping Redis connection');
    return null;
  }

  redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 10) return null;
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
    connectTimeout: 5000,
    lazyConnect: true
  });

  redis.on('connect', () => console.log('Redis Connected'));
  redis.on('error', (err) => console.error('Redis Error:', err.message));

  redis.connect().catch(() => console.warn('Redis connection failed, continuing without Redis'));

  return redis;
};

const getRedis = () => {
  if (!redis) connectRedis();
  return redis;
};

module.exports = { connectRedis, getRedis };
