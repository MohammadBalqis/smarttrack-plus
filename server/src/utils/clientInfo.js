// server/src/utils/clientInfo.js

// Small helper to extract basic device info from the request
export const getClientInfo = (req) => {
  const ua = req.headers["user-agent"] || "Unknown";

  const ip =
    (req.headers["x-forwarded-for"] &&
      req.headers["x-forwarded-for"].split(",")[0].trim()) ||
    req.socket?.remoteAddress ||
    req.ip ||
    "Unknown";

  let deviceType = "desktop";
  if (/mobile/i.test(ua)) deviceType = "mobile";
  else if (/tablet|ipad/i.test(ua)) deviceType = "tablet";
  else if (!ua || ua === "Unknown") deviceType = "unknown";

  let os = "Unknown";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ios/i.test(ua)) os = "iOS";
  else if (/mac os/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";

  let browser = "Unknown";
  if (/chrome/i.test(ua)) browser = "Chrome";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
  else if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/edge/i.test(ua)) browser = "Edge";

  const deviceId =
    req.headers["x-device-id"] ||
    req.headers["x-client-id"] ||
    null; // later your apps can send a stable id

  return {
    ipAddress: ip,
    userAgent: ua,
    deviceType,
    os,
    browser,
    deviceId,
  };
};
