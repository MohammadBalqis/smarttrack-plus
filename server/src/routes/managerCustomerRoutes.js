// server/src/routes/managerCustomerRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  getManagerCustomers,
  getManagerCustomerDetails,
} from "../controllers/managerCustomerController.js";

const router = Router();

/* 🔐 MANAGER / COMPANY ONLY */
router.use(protect, authorizeRoles("manager", "company"));

/* ==========================================================
   📋 LIST CUSTOMERS
   GET /api/manager/customers
========================================================== */
router.get("/", getManagerCustomers);

/* ==========================================================
   📌 SINGLE CUSTOMER (DRAWER)
   GET /api/manager/customers/:customerId
========================================================== */
router.get("/:customerId", getManagerCustomerDetails);

export default router;
