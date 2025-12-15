import User from "../../models/User.js";
import { resolveCompanyId } from "../../utils/resolveCompanyId.js";

export const listManagersForCompanyChat = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "company") {
      return res.status(403).json({ error: "Only company allowed" });
    }

    const companyId = resolveCompanyId(user);

    const managers = await User.find({
      role: "manager",
      companyId,
      isActive: true,
      managerVerificationStatus: "verified",
      managerOnboardingStage: "account_created",
    })
      .select("name phone shopId profileImage")
      .populate("shopId", "name")
      .sort({ name: 1 });

    res.json({
      ok: true,
      data: managers.map((m) => ({
        _id: m._id,
        fullName: m.name,
        phone: m.phone,
        branchName: m.shopId?.name || null,
        profileImage: m.profileImage,
      })),
    });
  } catch (err) {
    console.error("listManagersForCompanyChat error:", err);
    res.status(500).json({ error: "Failed to load managers" });
  }
};
