import rateLimit from "express-rate-limit";

export const registerLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,     // 10 minutes
  max: 5,                       // max 5 registrations per IP
  message: {
    ok: false,
    error: "Too many registration attempts.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
