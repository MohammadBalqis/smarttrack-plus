// server/src/utils/safeHandler.js
export const safeHandler = (controller) => async (req, res, next) => {
  try {
    await controller(req, res, next);
  } catch (err) {
    console.error("🔥 Controller Error:", err);
    next(err);
  }
};
