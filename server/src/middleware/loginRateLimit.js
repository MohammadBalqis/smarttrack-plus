// server/src/middleware/loginRateLimit.js
import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,     // 5 minutes
  max: 10,                     // 10 login attempts max
  message: {
    ok: false,
    error: "Too many login attempts. Please try again in a few minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
