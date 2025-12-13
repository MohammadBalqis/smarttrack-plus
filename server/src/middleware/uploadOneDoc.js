import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads", "company-docs");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const safeExt = ext && ext.length <= 8 ? ext : "";
    cb(null, `companydoc_${Date.now()}${safeExt}`);
  },
});

const fileFilter = (req, file, cb) => {
  // allow pdf + images only
  const ok = ["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(file.mimetype);
  cb(ok ? null : new Error("Only PDF/PNG/JPG/WEBP allowed"), ok);
};

export const uploadOneCompanyDoc = multer({
  storage,
  fileFilter,
  limits: { fileSize: 7 * 1024 * 1024 }, // 7MB
}).single("document");
