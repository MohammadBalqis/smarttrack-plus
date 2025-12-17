import User from "../../models/User.js";
import { resolveCompanyId } from "../../utils/resolveCompanyId.js";

export const listManagersForCompanyChat = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);

    const managers = await User.find({
      role: "manager",
      companyId,
      isActive: true,
      managerVerificationStatus: "verified",
      managerOnboardingStage: "account_created",
    })
      .select("name phone shopId profileImage")
      .populate("shopId", "name city")
      .sort({ name: 1 });

    // 🚫 Disable caching → prevents 304
    res.set("Cache-Control", "no-store");

    res.status(200).json({
      ok: true,
      data: managers.map((m) => ({
        _id: m._id,
        fullName: m.name,
        phone: m.phone,
        branchName: m.shopId
          ? `${m.shopId.city} • ${m.shopId.name}`
          : "—",
        profileImage: m.profileImage,
      })),
    });
  } catch (err) {
    console.error("listManagersForCompanyChat error:", err);
    res.status(500).json({ error: "Failed to load managers" });
  }
};
