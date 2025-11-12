import multer from "multer";
import path from "path";
import fs from "fs";

const dir = path.join(process.cwd(), "uploads", "drivers");
fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, dir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const base = path.basename(file.originalname || "photo", ext).replace(/\s+/g, "_");
    cb(null, `${base}-${Date.now()}${ext || ".jpg"}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const ok = /image\/(jpeg|png|webp)/.test(file.mimetype);
  cb(ok ? null : new Error("Only JPG/PNG/WEBP images allowed"), ok);
};

export const uploadDriverPhoto = multer({ storage, fileFilter }).single("image");
