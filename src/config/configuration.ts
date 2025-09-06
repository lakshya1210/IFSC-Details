export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ifsc-service',
    name: process.env.DATABASE_NAME || 'ifsc-service',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL, 10) || 300, // 5 minutes default
  },
  dataFreshnessDays: parseInt(process.env.DATA_FRESHNESS_DAYS, 10) || 30,
  externalApis: {
    razorpay: {
      baseUrl: process.env.RAZORPAY_IFSC_BASE_URL || 'https://ifsc.razorpay.com',
    },
  },
});
