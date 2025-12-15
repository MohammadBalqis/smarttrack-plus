import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "uploads/driver-verification";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.fieldname}${path.extname(file.originalname)}`),
});

const uploadDriverVerification = multer({
  storage,
}).fields([
  { name: "profileImage", maxCount: 1 },
  { name: "idImage", maxCount: 1 },
  { name: "vehicleImage", maxCount: 1 },
]);

export default uploadDriverVerification;
