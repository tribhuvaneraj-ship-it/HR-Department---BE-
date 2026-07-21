const Redis = require('ioredis');

let redis;

const connectRedis = () => {
  redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    }
  });

  redis.on('connect', () => console.log('Redis Connected'));
  redis.on('error', (err) => console.error('Redis Error:', err.message));

  return redis;
};

const getRedis = () => {
  if (!redis) connectRedis();
  return redis;
};

module.exports = { connectRedis, getRedis };
