import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getCustomerTripQR,
  confirmDeliveryByQR,
} from "../controllers/qrController.js";

const router = express.Router();

/* Customer fetches QR */
router.get("/customer/trip/:tripId/qr", protect, getCustomerTripQR);

/* Driver confirms upon scanning QR */
router.post("/driver/confirm-qr", protect, confirmDeliveryByQR);

export default router;
