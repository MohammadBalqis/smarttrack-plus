// server/src/middleware/superAdminMiddleware.js

export const authorizeSuperAdmin = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "superadmin") {
      return res.status(403).json({
        error: "Access denied. Superadmin only."
      });
    }
    next();
  } catch (err) {
    console.error("Superadmin middleware error:", err.message);
    res.status(500).json({ error: "Server error (middleware)" });
  }
};
