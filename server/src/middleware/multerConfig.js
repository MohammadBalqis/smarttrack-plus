// server/src/middleware/multerConfig.js
import multer from "multer";
import path from "path";
import fs from "fs";

/* ==========================================================
   🛡 SECURITY — Allowed extensions
========================================================== */
const ALLOWED_IMAGES = ["image/jpeg", "image/png", "image/jpg"];
const ALLOWED_DOCS = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
];

/* ==========================================================
   🛡 File Filter (Image Only)
========================================================== */
const imageFileFilter = (req, file, cb) => {
  if (!ALLOWED_IMAGES.includes(file.mimetype)) {
    return cb(new Error("Only PNG, JPG, JPEG images are allowed"));
  }
  cb(null, true);
};

/* ==========================================================
   🛡 File Filter (Documents for customers)
========================================================== */
const documentFileFilter = (req, file, cb) => {
  if (!ALLOWED_DOCS.includes(file.mimetype)) {
    return cb(new Error("Only PDF or images are allowed"));
  }
  cb(null, true);
};

/* ==========================================================
   🗂 Helper — Create folder if not exists
========================================================== */
const ensureFolder = (folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
};

/* ==========================================================
   📸 1) DRIVER IMAGE UPLOAD
========================================================== */
const driverStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join("uploads", "drivers");
    ensureFolder(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

export const uploadDriverImage = multer({
  storage: driverStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: imageFileFilter,
});

/* ==========================================================
   👤 2) CUSTOMER PROFILE IMAGE
========================================================== */
const customerImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join("uploads", "customers", "profiles");
    ensureFolder(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

export const uploadCustomerImage = multer({
  storage: customerImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
});

/* ==========================================================
   📄 3) CUSTOMER DOCUMENT UPLOAD (PDF or images)
========================================================== */
const customerDocsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join("uploads", "customers", "documents");
    ensureFolder(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

export const uploadCustomerDocument = multer({
  storage: customerDocsStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: documentFileFilter,
});

/* ==========================================================
   🏢 4) COMPANY LOGO UPLOAD
========================================================== */
const companyLogoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join("uploads", "companies", "logos");
    ensureFolder(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const name = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, name + path.extname(file.originalname));
  },
});

export const uploadCompanyLogo = multer({
  storage: companyLogoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
});

/* ==========================================================
   🛒 5) PRODUCT IMAGE UPLOAD
========================================================== */
const productImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join("uploads", "products");
    ensureFolder(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

export const uploadProductImage = multer({
  storage: productImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
});
