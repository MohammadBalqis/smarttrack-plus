import { sanitizeValue } from "../utils/sanitizeInput.js";

/*
  This middleware sanitizes:
  - req.body
  - req.query
  - req.params
  BEFORE they reach the controller.
*/

export const sanitizeRequest = (req, res, next) => {
  try {
    if (req.body) req.body = sanitizeValue(req.body);
    if (req.query) req.query = sanitizeValue(req.query);
    if (req.params) req.params = sanitizeValue(req.params);
  } catch (err) {
    console.error("❌ Sanitize error:", err.message);
  }
  next();
};
