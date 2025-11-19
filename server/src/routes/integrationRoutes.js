// server/src/routes/integrationRoutes.js
import { Router } from "express";
import ApiKey from "../models/ApiKey.js";
import Webhook from "../models/Webhook.js";
import GlobalSettings from "../models/GlobalSettings.js";
import Company from "../models/Company.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { logActivity } from "../utils/activityLogger.js";
import crypto from "crypto";

const router = Router();

/* ==========================================================
   🧠 Helper — Resolve company scope from user role
   ========================================================== */
const resolveCompanyScope = async (req, queryCompanyId) => {
  if (req.user.role === "company") {
    return req.user.companyId || req.user._id;
  }

  if (req.user.role === "manager") {
    return req.user.companyId;
  }

  // Owner / Superadmin can pass companyId
  if (["owner", "superadmin"].includes(req.user.role)) {
    if (queryCompanyId) return queryCompanyId;

    // Optional: you can auto-link owner to a company if you want
    const company = await Company.findOne({ ownerId: req.user._id });
    return company ? company._id : null;
  }

  return null;
};

/* ==========================================================
   🛑 Maintenance Guard (reuse pattern from other routes)
   ========================================================== */
const checkMaintenance = async (req) => {
  const settings = await GlobalSettings.findOne();
  if (settings?.maintenanceMode && req.user.role !== "superadmin") {
    const error = new Error("System is under maintenance.");
    error.statusCode = 503;
    throw error;
  }
};

/* ==========================================================
   🔑 1. Create API Key (Company / Manager / Owner / Superadmin)
   ========================================================== */
/*
POST /api/integrations/api-keys
Body: { label, scopes?: string[], companyId?: string }
*/
router.post(
  "/api-keys",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  async (req, res) => {
    try {
      await checkMaintenance(req);

      const { label, scopes = [], companyId: bodyCompanyId } = req.body;
      if (!label) {
        return res.status(400).json({ error: "Label is required" });
      }

      const companyId = await resolveCompanyScope(req, bodyCompanyId);
      if (!companyId) {
        return res
          .status(400)
          .json({ error: "No company scope available for this user" });
      }

      const apiKeyValue = crypto.randomBytes(32).toString("hex");

      const apiKey = await ApiKey.create({
        companyId,
        label,
        scopes,
        apiKey: apiKeyValue,
        createdBy: req.user._id,
        createdFromIp: req.ip,
      });

      await logActivity({
        userId: req.user._id,
        action: "API_KEY_CREATE",
        description: `Created API key '${label}'`,
        ipAddress: req.ip,
        deviceInfo: req.headers["user-agent"],
        meta: { apiKeyId: apiKey._id, companyId },
      });

      // ⚠️ IMPORTANT:
      // We return the apiKey only here. If lost, a new one must be created.
      res.status(201).json({
        ok: true,
        message: "API key created",
        apiKey: {
          id: apiKey._id,
          label: apiKey.label,
          scopes: apiKey.scopes,
          isActive: apiKey.isActive,
          createdAt: apiKey.createdAt,
          apiKey: apiKeyValue,
        },
      });
    } catch (err) {
      console.error("❌ API key create error:", err.message);
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({ error: "Server error creating API key" });
    }
  }
);

/* ==========================================================
   📋 2. List API Keys for a Company
   ========================================================== */
/*
GET /api/integrations/api-keys?companyId=...
*/
router.get(
  "/api-keys",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  async (req, res) => {
    try {
      await checkMaintenance(req);

      const { companyId: queryCompanyId } = req.query;
      const companyId = await resolveCompanyScope(req, queryCompanyId);
      if (!companyId) {
        return res
          .status(400)
          .json({ error: "No company scope available for this user" });
      }

      const apiKeys = await ApiKey.find({ companyId }).sort({ createdAt: -1 });

      res.json({
        ok: true,
        count: apiKeys.length,
        apiKeys: apiKeys.map((k) => ({
          id: k._id,
          label: k.label,
          scopes: k.scopes,
          isActive: k.isActive,
          lastUsedAt: k.lastUsedAt,
          createdAt: k.createdAt,
        })),
      });
    } catch (err) {
      console.error("❌ API key list error:", err.message);
      res.status(500).json({ error: "Server error listing API keys" });
    }
  }
);

/* ==========================================================
   🚫 3. Toggle / Revoke API Key
   ========================================================== */
/*
PATCH /api/integrations/api-keys/:id/toggle
Body: { isActive: boolean }
*/
router.patch(
  "/api-keys/:id/toggle",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  async (req, res) => {
    try {
      await checkMaintenance(req);

      const { isActive } = req.body;
      if (typeof isActive !== "boolean") {
        return res.status(400).json({ error: "isActive must be boolean" });
      }

      const { id } = req.params;
      const { companyId: queryCompanyId } = req.query;
      const companyId = await resolveCompanyScope(req, queryCompanyId);

      const apiKey = await ApiKey.findOneAndUpdate(
        { _id: id, companyId },
        { isActive },
        { new: true }
      );

      if (!apiKey) {
        return res
          .status(404)
          .json({ error: "API key not found for this company" });
      }

      await logActivity({
        userId: req.user._id,
        action: "API_KEY_TOGGLE",
        description: `Set API key '${apiKey.label}' active=${isActive}`,
        ipAddress: req.ip,
        deviceInfo: req.headers["user-agent"],
        meta: { apiKeyId: apiKey._id, companyId },
      });

      res.json({
        ok: true,
        message: "API key updated",
        apiKey: {
          id: apiKey._id,
          label: apiKey.label,
          isActive: apiKey.isActive,
        },
      });
    } catch (err) {
      console.error("❌ API key toggle error:", err.message);
      res.status(500).json({ error: "Server error updating API key" });
    }
  }
);

/* ==========================================================
   🧨 4. Delete API Key (hard revoke)
   ========================================================== */
/*
DELETE /api/integrations/api-keys/:id
*/
router.delete(
  "/api-keys/:id",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  async (req, res) => {
    try {
      await checkMaintenance(req);

      const { id } = req.params;
      const { companyId: queryCompanyId } = req.query;
      const companyId = await resolveCompanyScope(req, queryCompanyId);

      const apiKey = await ApiKey.findOneAndDelete({ _id: id, companyId });
      if (!apiKey) {
        return res
          .status(404)
          .json({ error: "API key not found for this company" });
      }

      await logActivity({
        userId: req.user._id,
        action: "API_KEY_DELETE",
        description: `Deleted API key '${apiKey.label}'`,
        ipAddress: req.ip,
        deviceInfo: req.headers["user-agent"],
        meta: { apiKeyId: apiKey._id, companyId },
      });

      res.json({
        ok: true,
        message: "API key deleted",
      });
    } catch (err) {
      console.error("❌ API key delete error:", err.message);
      res.status(500).json({ error: "Server error deleting API key" });
    }
  }
);

/* ==========================================================
   🌐 5. Create Webhook Endpoint
   ========================================================== */
/*
POST /api/integrations/webhooks
Body: { url, events: string[], description?, secretToken?, companyId? }
*/
router.post(
  "/webhooks",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  async (req, res) => {
    try {
      await checkMaintenance(req);

      const {
        url,
        events = [],
        description = "",
        secretToken,
        companyId: bodyCompanyId,
      } = req.body;

      if (!url) {
        return res.status(400).json({ error: "Webhook URL is required" });
      }

      const companyId = await resolveCompanyScope(req, bodyCompanyId);
      if (!companyId) {
        return res
          .status(400)
          .json({ error: "No company scope available for this user" });
      }

      const webhook = await Webhook.create({
        companyId,
        url,
        events,
        description,
        secretToken: secretToken || crypto.randomBytes(16).toString("hex"),
      });

      await logActivity({
        userId: req.user._id,
        action: "WEBHOOK_CREATE",
        description: `Created webhook for events: ${events.join(", ")}`,
        ipAddress: req.ip,
        deviceInfo: req.headers["user-agent"],
        meta: { webhookId: webhook._id, companyId },
      });

      res.status(201).json({
        ok: true,
        message: "Webhook created",
        webhook,
      });
    } catch (err) {
      console.error("❌ Webhook create error:", err.message);
      res.status(500).json({ error: "Server error creating webhook" });
    }
  }
);

/* ==========================================================
   📋 6. List Webhooks
   ========================================================== */
router.get(
  "/webhooks",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  async (req, res) => {
    try {
      await checkMaintenance(req);

      const { companyId: queryCompanyId } = req.query;
      const companyId = await resolveCompanyScope(req, queryCompanyId);
      if (!companyId) {
        return res
          .status(400)
          .json({ error: "No company scope available for this user" });
      }

      const webhooks = await Webhook.find({ companyId }).sort({
        createdAt: -1,
      });

      res.json({
        ok: true,
        count: webhooks.length,
        webhooks,
      });
    } catch (err) {
      console.error("❌ Webhook list error:", err.message);
      res.status(500).json({ error: "Server error listing webhooks" });
    }
  }
);

/* ==========================================================
   ✏️ 7. Update Webhook (URL / Events / Description)
   ========================================================== */
router.patch(
  "/webhooks/:id",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  async (req, res) => {
    try {
      await checkMaintenance(req);

      const { id } = req.params;
      const { url, events, description, isActive } = req.body;
      const { companyId: queryCompanyId } = req.query;
      const companyId = await resolveCompanyScope(req, queryCompanyId);

      const update = {};
      if (url) update.url = url;
      if (Array.isArray(events)) update.events = events;
      if (typeof description === "string") update.description = description;
      if (typeof isActive === "boolean") update.isActive = isActive;

      const webhook = await Webhook.findOneAndUpdate(
        { _id: id, companyId },
        update,
        { new: true }
      );

      if (!webhook) {
        return res
          .status(404)
          .json({ error: "Webhook not found for this company" });
      }

      await logActivity({
        userId: req.user._id,
        action: "WEBHOOK_UPDATE",
        description: `Updated webhook ${id}`,
        ipAddress: req.ip,
        deviceInfo: req.headers["user-agent"],
        meta: { webhookId: webhook._id, companyId },
      });

      res.json({
        ok: true,
        message: "Webhook updated",
        webhook,
      });
    } catch (err) {
      console.error("❌ Webhook update error:", err.message);
      res.status(500).json({ error: "Server error updating webhook" });
    }
  }
);

/* ==========================================================
   🧨 8. Delete Webhook
   ========================================================== */
router.delete(
  "/webhooks/:id",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  async (req, res) => {
    try {
      await checkMaintenance(req);

      const { id } = req.params;
      const { companyId: queryCompanyId } = req.query;
      const companyId = await resolveCompanyScope(req, queryCompanyId);

      const webhook = await Webhook.findOneAndDelete({ _id: id, companyId });
      if (!webhook) {
        return res
          .status(404)
          .json({ error: "Webhook not found for this company" });
      }

      await logActivity({
        userId: req.user._id,
        action: "WEBHOOK_DELETE",
        description: `Deleted webhook ${id}`,
        ipAddress: req.ip,
        deviceInfo: req.headers["user-agent"],
        meta: { webhookId: webhook._id, companyId },
      });

      res.json({
        ok: true,
        message: "Webhook deleted",
      });
    } catch (err) {
      console.error("❌ Webhook delete error:", err.message);
      res.status(500).json({ error: "Server error deleting webhook" });
    }
  }
);

export default router;
