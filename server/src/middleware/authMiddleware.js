import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Session from "../models/Session.js";
import { getClientInfo } from "../utils/clientInfo.js";

/**
 * 🔐 protect()
 * - Validates JWT
 * - Checks session (SID)
 * - Loads user from DB
 * - Attaches req.user, req.sessionId, req.companyId, req.shopId
 */
export const protect = async (req, res, next) => {
  try {
    let token = null;

    // Extract token from Authorization header
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ error: "Not authorized, token missing" });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const userId = decoded.uid;
    const sessionId = decoded.sid;

    // Load user
    const user = await User.findById(userId).select("-passwordHash");
    if (!user) {
      return res.status(401).json({ error: "User does not exist" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account suspended" });
    }

    // Validate session
    const session = await Session.findById(sessionId);
    if (!session || !session.isActive || session.isRevoked) {
      return res.status(401).json({
        error: "Session expired. Please log in again.",
      });
    }

    // Update last activity
    try {
      const client = getClientInfo(req);
      session.lastActivityAt = new Date();
      session.lastIpAddress = client.ipAddress;
      session.lastUserAgent = client.userAgent;
      await session.save();
    } catch (e) {}

    // Attach to request
    req.user = user;
    req.sessionId = sessionId;
    req.companyId =
      user.companyId || (user.role === "company" ? user._id : null);
    req.shopId = user.shopId || null;

    next();
  } catch (err) {
    console.error("protect() error:", err);
    return res.status(401).json({ error: "Not authorized" });
  }
};
