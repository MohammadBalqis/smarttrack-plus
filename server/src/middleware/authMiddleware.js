import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Session from "../models/Session.js";
import { getClientInfo } from "../utils/clientInfo.js";

export const protect = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ error: "Not authorized, token missing" });
    }

    // ✅ verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.uid;   // ✅ RESTORED
    const sessionId =
      req.headers["x-session-id"] ||
      decoded.sid;

    // ✅ load user
    const user = await User.findById(userId).select("-passwordHash");
    if (!user) {
      return res.status(401).json({ error: "User does not exist" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account suspended" });
    }

    // ✅ validate session
    const session = await Session.findById(sessionId);
    if (!session || !session.isActive || session.isRevoked) {
      return res.status(401).json({ error: "Session expired" });
    }

    // update session activity
    try {
      const client = getClientInfo(req);
      session.lastActivityAt = new Date();
      session.lastIpAddress = client.ipAddress;
      session.lastUserAgent = client.userAgent;
      await session.save();
    } catch {}

    // attach
    req.user = user;
    req.sessionId = sessionId;
    req.companyId =
      user.companyId || (user.role === "company" ? user._id : null);
    req.shopId = user.shopId || null;

    next();
  } catch (err) {
    console.error("protect() error:", err);
    res.status(401).json({ error: "Not authorized" });
  }
};
