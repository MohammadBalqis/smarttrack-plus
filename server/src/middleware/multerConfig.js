// server/src/middleware/multerConfig.js
import multer from "multer";
import path from "path";
import fs from "fs";

/* ==========================================================
   🛡️ SECURE FILE FILTER
========================================================== */
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg"];

  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only JPG, JPEG, and PNG images are allowed"));
  }

  cb(null, true);
};

/* ==========================================================
   📸 DRIVER IMAGE UPLOAD CONFIG
========================================================== */
const driverStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join("uploads", "drivers");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

/* ==========================================================
   📦 EXPORT DRIVER UPLOADER
========================================================== */
export const uploadDriverImage = multer({
  storage: driverStorage,
  fileFilter,
});
