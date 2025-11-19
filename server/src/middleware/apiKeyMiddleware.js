// server/src/middleware/apiKeyMiddleware.js
import ApiKey from "../models/ApiKey.js";

/**
 * Validate x-api-key header and attach company to request.
 * Use this on public/integration endpoints (NOT on normal web auth).
 */
export const requireApiKey = async (req, res, next) => {
  try {
    const apiKeyHeader = req.headers["x-api-key"];

    if (!apiKeyHeader) {
      return res.status(401).json({
        ok: false,
        error: "API key is required",
      });
    }

    const apiKey = await ApiKey.findOne({
      apiKey: apiKeyHeader,
      isActive: true,
    });

    if (!apiKey) {
      return res.status(401).json({
        ok: false,
        error: "Invalid or inactive API key",
      });
    }

    // Track usage
    apiKey.lastUsedAt = new Date();
    await apiKey.save();

    // Attach to request for later
    req.apiKey = apiKey;
    req.apiCompanyId = apiKey.companyId;

    next();
  } catch (err) {
    console.error("❌ API key validation error:", err.message);
    res.status(500).json({ error: "Server error validating API key" });
  }
};
