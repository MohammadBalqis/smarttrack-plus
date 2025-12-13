import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  getOwnerProfile,
  updateOwnerProfile,
  updateOwnerPassword,
} from "../controllers/systemOwner/systemOwnerProfileController.js";

const router = Router();
const ownerAuth = [protect, authorizeRoles("owner", "superadmin")];

router.get("/profile", ownerAuth, getOwnerProfile);
router.put("/profile", ownerAuth, updateOwnerProfile);
router.put("/profile/password", ownerAuth, updateOwnerPassword);

export default router;
