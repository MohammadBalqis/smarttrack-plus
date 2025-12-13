import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import User from "../models/User.js";


const router = Router();

/* ==========================================================
   GET SETTINGS
========================================================== */
router.get(
  "/",
  protect,
  authorizeRoles("customer"),
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select(
        "settings notifications"
      );
      res.json({ ok: true, settings: user.settings, notifications: user.notifications });
    } catch (err) {
      res.status(500).json({ error: "Failed to load settings" });
    }
  }
);

/* ==========================================================
   UPDATE SETTINGS
========================================================== */
router.put(
  "/update",
  protect,
  authorizeRoles("customer"),
  async (req, res) => {
    try {
      const { settings, notifications } = req.body;

      const user = await User.findByIdAndUpdate(
        req.user._id,
        {
          settings: settings || {},
          notifications: notifications || {},
        },
        { new: true }
      ).select("settings notifications");

      res.json({ ok: true, user });
    } catch (err) {
      res.status(500).json({ error: "Error saving settings" });
    }
  }
);


export default router;
