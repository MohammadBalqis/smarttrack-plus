// server/src/middleware/authMiddleware.js

import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Session from "../models/Session.js";
import { getClientInfo } from "../utils/clientInfo.js";

/**
 * 🔐 protect
 * - Verifies JWT
 * - Loads user from DB
 * - (If present) validates the session (sid) is still active & not revoked
 * - Attaches req.user and req.session
 */
export const protect = async (req, res, next) => {
  let token;

  try {
    // 1) Get token from Authorization header: "Bearer <token>"
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // (Optional) support cookie-based token if you ever add it
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res
        .status(401)
        .json({ error: "Not authorized, token missing" });
    }

    // 2) Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("⚠ JWT verify error:", err.message);

      if (err.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ error: "Token expired. Please log in again." });
      }

      return res.status(401).json({ error: "Invalid token" });
    }

    // 3) Resolve user id from payload (uid is your legacy key; id is fallback)
    const userId = decoded.uid || decoded.id;
    if (!userId) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    // 4) Load user
    const user = await User.findById(userId).select("-passwordHash");
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (user.isActive === false) {
      return res.status(403).json({ error: "Account suspended" });
    }

    req.user = user;

    // 5) If token has a session id (sid), validate session
    if (decoded.sid) {
      const session = await Session.findById(decoded.sid);

      if (!session || !session.isActive || session.isRevoked) {
        return res.status(401).json({
          error:
            "Session expired or revoked. Please log in again from this device.",
        });
      }

      // Update last activity info (non-critical, best-effort)
      try {
        const client = getClientInfo(req);
        session.lastActivityAt = new Date();
        if (client?.ipAddress) session.lastIpAddress = client.ipAddress;
        if (client?.userAgent) session.lastUserAgent = client.userAgent;
        await session.save();
      } catch (e) {
        console.warn("⚠ Session activity update failed:", e.message);
      }

      req.session = session;
    }

    return next();
  } catch (err) {
    console.error("⚠ protect middleware error:", err.message);
    return res.status(401).json({ error: "Not authorized" });
  }
};
