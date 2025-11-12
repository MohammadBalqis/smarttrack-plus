import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // attach user to request (no password)
      req.user = await User.findById(decoded.uid).select("-password");
      if (!req.user) {
        return res.status(401).json({ error: "User not found" });
      }

      next();
    } catch (err) {
      console.error("Token error:", err.message);
      res.status(401).json({ error: "Not authorized, invalid token" });
    }
  } else {
    res.status(401).json({ error: "Not authorized, token missing" });
  }
};
