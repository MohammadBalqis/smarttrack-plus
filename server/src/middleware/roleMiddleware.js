export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ error: "Not authorized" });

    const role = req.user.role;

    // System owner is treated as superadmin everywhere
    if (req.user.isSystemOwner && allowedRoles.includes("superadmin")) {
      return next();
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }

    next();
  };
};
