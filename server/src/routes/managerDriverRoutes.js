import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";

import {
  getManagerDrivers,
  getManagerDriversByShop,
  createDriverProfile,
  updateDriverProfile,
  submitDriverVerification,
  verifyDriver,
  rejectDriver,
  createDriverAccount,
  toggleDriverSuspend,
  deleteDriverPermanently,
} from "../controllers/managerDriversController.js";

const router = Router();

/* ================= MULTER ================= */
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dir = "uploads/drivers/misc";
    if (file.fieldname === "profileImage") dir = "uploads/drivers/profile";
    if (file.fieldname === "idImage") dir = "uploads/drivers/id";
    if (file.fieldname === "vehicleImage") dir = "uploads/drivers/vehicle";
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

/* ================= AUTH ================= */
router.use(protect, authorizeRoles("manager"));

/* ================= ROUTES ================= */
/**
 * NOTE:
 * server.js already uses:
 * app.use("/api/manager/drivers", router)
 * so DO NOT repeat /drivers here
 */

router.get("/", getManagerDrivers);
router.get("/shop/:shopId", getManagerDriversByShop);

router.post("/", createDriverProfile);
router.patch("/:driverId/profile", updateDriverProfile);

router.patch(
  "/:driverId/verification",
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "idImage", maxCount: 1 },
    { name: "vehicleImage", maxCount: 1 },
  ]),
  submitDriverVerification
);

router.patch("/:driverId/verify", verifyDriver);
router.patch("/:driverId/reject", rejectDriver);
router.post("/:driverId/create-account", createDriverAccount);
router.patch("/:driverId/toggle-suspend", toggleDriverSuspend);
router.delete("/:driverId", deleteDriverPermanently);

export default router;
