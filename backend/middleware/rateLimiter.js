/**
 * Lightweight in-memory rate limiting middleware
 * Sliding window counter based on IP and/or User ID.
 * Emits standard rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)
 */

const buckets = new Map();

// Periodically clean expired rate-limiting windows every 3 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of buckets.entries()) {
    if (now > record.resetTime) {
      buckets.delete(key);
    }
  }
}, 180000).unref();

/**
 * Creates a rate limiter instance
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (default: 60000ms = 1m)
 * @param {number} options.max - Max permitted requests in window
 * @param {string} options.message - Error message when rate exceeded
 */
function createRateLimiter({ windowMs = 60000, max = 60, message = 'Too many requests, please try again later.' } = {}) {
  return (req, res, next) => {
    // Determine client identifier
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || '127.0.0.1';
    const identifier = req.user?.id ? `user:${req.user.id}` : `ip:${clientIp}`;
    const routeKey = `${identifier}:${req.baseUrl || ''}${req.path}`;

    const now = Date.now();
    let record = buckets.get(routeKey);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      buckets.set(routeKey, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (record.count > max) {
      return res.status(429).json({
        error: message,
        retryAfter: resetSeconds
      });
    }

    next();
  };
}

module.exports = {
  createRateLimiter,
  authRateLimiter: createRateLimiter({ windowMs: 60000, max: 60, message: 'Too many authentication attempts. Please wait 1 minute.' }),
  uploadRateLimiter: createRateLimiter({ windowMs: 60000, max: 40, message: 'Upload rate ceiling reached. Please wait a moment before uploading again.' }),
  reportRateLimiter: createRateLimiter({ windowMs: 60000, max: 20, message: 'Too many report submissions. Please wait a moment.' })
};

