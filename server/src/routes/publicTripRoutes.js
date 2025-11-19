// server/src/routes/publicTripRoutes.js
import { Router } from "express";
import Trip from "../models/Trip.js";
import { requireApiKey } from "../middleware/apiKeyMiddleware.js";

const router = Router();

// e.g. GET /api/public/trips
router.get("/trips", requireApiKey, async (req, res) => {
  try {
    const companyId = req.apiCompanyId;

    const trips = await Trip.find({ companyId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      ok: true,
      count: trips.length,
      trips,
    });
  } catch (err) {
    console.error("❌ public trips error:", err.message);
    res.status(500).json({ error: "Server error loading trips" });
  }
});

export default router;
