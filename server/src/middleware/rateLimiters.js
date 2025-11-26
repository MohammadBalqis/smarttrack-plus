// server/src/middleware/rateLimiters.js
import rateLimit from "express-rate-limit";

/* ==========================================================
   🌍 GLOBAL API RATE LIMITER
   - Protects from spam, bots, and basic DDoS attacks
   ========================================================== */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 req / 15 min per IP
  message: { error: "Too many requests, please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ==========================================================
   🔐 LOGIN LIMITER — Prevent brute force attacks
   ========================================================== */
export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // max 10 attempts
  message: { error: "Too many login attempts, try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ==========================================================
   📝 REGISTER LIMITER — Prevent spam accounts
   ========================================================== */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // only 5 registrations per IP / hour
  message: { error: "Too many accounts created, try later." },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ==========================================================
   ⚠️ SENSITIVE ROUTES (Trips, Payments, Superadmin)
   ========================================================== */
export const sensitiveLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 requests max
  message: { error: "Rate limit reached for sensitive operations." },
  standardHeaders: true,
  legacyHeaders: false,
});
