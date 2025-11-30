import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { getManagerProfile } from "../controllers/managerProfileController.js";

const router = Router();

router.get(
  "/",
  protect,
  authorizeRoles("manager"),
  getManagerProfile
);

export default router;
