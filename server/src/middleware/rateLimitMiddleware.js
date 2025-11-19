// server/src/middleware/rateLimitMiddleware.js
import rateLimit from "express-rate-limit";

/* ------------------------------------------
   Login limiter – strong protection
------------------------------------------ */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  message: {
    ok: false,
    error: "Too many login attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ------------------------------------------
   QR / confirm-delivery limiter
------------------------------------------ */
export const qrLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 min
  max: 30,
  message: {
    ok: false,
    error: "Too many QR operations. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ------------------------------------------
   General API limiter (for /api/public)
------------------------------------------ */
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 200,
  message: {
    ok: false,
    error: "Too many requests. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ------------------------------------------
   Public Integration API limiter
   Used inside publicApiRoutes
------------------------------------------ */
export const publicApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 req/min per IP for partners
  message: {
    ok: false,
    error: "Too many public API requests. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
