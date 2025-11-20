// server/src/routes/superAdminRoutes.js
import { Router } from "express";

// AUTH & ACCESS
import { protect } from "../middleware/authMiddleware.js";
import { authorizeSuperAdmin } from "../middleware/superAdminMiddleware.js";

// CONTROLLERS
import {
  getSuperAdminDashboard,
  listAllCompanies,
  toggleCompanyStatus,
  createCompany,
  updateCompany,
  resetCompanyPassword,
  deleteCompany,
  listAllTrips,
  listActivityLogs,
  generateApiKeyForCompany,
  toggleMaintenanceMode,
  getGlobalSettings,
  updateGlobalSettings
} from "../controllers/superAdminController.js";

const router = Router();

// 🔐 Only logged-in superadmin can access these
const superAdminOnly = [protect, authorizeSuperAdmin];

/* ==========================================================
   📊 1. SUPERADMIN DASHBOARD
========================================================== */
router.get("/dashboard", superAdminOnly, getSuperAdminDashboard);

/* ==========================================================
   🏢 2. LIST ALL COMPANIES
========================================================== */
router.get("/companies", superAdminOnly, listAllCompanies);

/* ==========================================================
   🧊 3. ACTIVATE / SUSPEND COMPANY
========================================================== */
router.patch("/company/:id/toggle", superAdminOnly, toggleCompanyStatus);

/* ==========================================================
   🏗️ 4. CREATE COMPANY
========================================================== */
router.post("/companies/create", superAdminOnly, createCompany);

/* ==========================================================
   ✏️ 5. UPDATE COMPANY
========================================================== */
router.patch("/companies/:id/update", superAdminOnly, updateCompany);

/* ==========================================================
   🔑 6. RESET COMPANY OWNER PASSWORD
========================================================== */
router.patch(
  "/companies/:id/reset-password",
  superAdminOnly,
  resetCompanyPassword
);

/* ==========================================================
   ❌ 7. DELETE COMPANY + ALL RELATED DATA
========================================================== */
router.delete("/companies/:id/delete", superAdminOnly, deleteCompany);

/* ==========================================================
   🚚 8. GLOBAL TRIPS LIST
========================================================== */
router.get("/trips", superAdminOnly, listAllTrips);

/* ==========================================================
   📜 9. ACTIVITY LOGS
========================================================== */
router.get("/logs", superAdminOnly, listActivityLogs);

/* ==========================================================
   🔐 10. GENERATE API KEY FOR COMPANY (10I-C)
========================================================== */
router.post(
  "/company/:companyId/generate-api-key",
  superAdminOnly,
  generateApiKeyForCompany
);

/* ==========================================================
   🛠️ 11. GET GLOBAL SETTINGS (maintenance, commission, etc.)
========================================================== */
router.get("/settings", superAdminOnly, getGlobalSettings);

/* ==========================================================
   🛠️ 12. UPDATE GLOBAL SETTINGS
========================================================== */
router.patch("/settings/update", superAdminOnly, updateGlobalSettings);

/* ==========================================================
   🛠️ 13. TOGGLE MAINTENANCE MODE
========================================================== */
router.patch("/settings/maintenance/toggle", superAdminOnly, toggleMaintenanceMode);

export default router;
