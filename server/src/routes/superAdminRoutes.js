// server/src/routes/superAdminRoutes.js

import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeSuperAdmin } from "../middleware/superAdminMiddleware.js";
import { listActivityLogs } from "../controllers/superAdminController.js";
// CONTROLLERS (Option A)
import {
  getSuperAdminDashboard,
  listAllCompanies,
  toggleCompanyStatus,
  createCompany,
  updateCompany,
  resetCompanyPassword,
  deleteCompany,
  listAllTrips
} from "../controllers/superAdminController.js";

const router = Router();

// 🔐 Only logged-in superadmin can access these
const superAdminOnly = [protect, authorizeSuperAdmin];

/* ==========================================================
   📊 1. SUPERADMIN DASHBOARD
   GET /api/superadmin/dashboard
========================================================== */
router.get("/dashboard", superAdminOnly, getSuperAdminDashboard);

/* ==========================================================
   🏢 2. LIST ALL COMPANIES
   GET /api/superadmin/companies
========================================================== */
router.get("/companies", superAdminOnly, listAllCompanies);

/* ==========================================================
   🧊 3. TOGGLE COMPANY STATUS (activate / suspend)
   PATCH /api/superadmin/company/:id/toggle
========================================================== */
router.patch("/company/:id/toggle", superAdminOnly, toggleCompanyStatus);

/* ==========================================================
   🏗️ 4. CREATE COMPANY
   POST /api/superadmin/companies/create
========================================================== */
router.post("/companies/create", superAdminOnly, createCompany);

/* ==========================================================
   ✏️ 5. UPDATE COMPANY
   PATCH /api/superadmin/companies/:id/update
========================================================== */
router.patch("/companies/:id/update", superAdminOnly, updateCompany);

/* ==========================================================
   🔑 6. RESET COMPANY PASSWORD
   PATCH /api/superadmin/companies/:id/reset-password
========================================================== */
router.patch(
  "/companies/:id/reset-password",
  superAdminOnly,
  resetCompanyPassword
);

/* ==========================================================
   ❌ 7. DELETE COMPANY + ALL RELATED DATA
   DELETE /api/superadmin/companies/:id/delete
========================================================== */
router.delete("/companies/:id/delete", superAdminOnly, deleteCompany);

/* ==========================================================
   🚚 8. LIST ALL TRIPS (GLOBAL — read only)
   GET /api/superadmin/trips
========================================================== */
router.get("/trips", superAdminOnly, listAllTrips);



router.get("/logs", superAdminOnly, listActivityLogs);

export default router;
