// server/src/utils/resolveCompanyId.js

export const resolveCompanyId = (user) => {
  if (!user) return null;

  // ✅ COMPANY: prefer companyId if exists, fallback to _id
  if (user.role === "company") {
    return user.companyId || user._id;
  }

  // ✅ MANAGER / DRIVER / CUSTOMER
  if (["manager", "driver", "customer"].includes(user.role)) {
    return user.companyId || null;
  }

  return null;
};
