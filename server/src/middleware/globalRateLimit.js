// server/src/middleware/globalRateLimit.js
import rateLimit from "express-rate-limit";

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,          // 1 minute
  max: 120,                     // allow 120 requests per minute per IP
  message: {
    ok: false,
    error: "Too many requests. Please slow down."
  },
  standardHeaders: true,
  legacyHeaders: false,
});
