import multer from "multer";
import path from "path";
import fs from "fs";

/* =====================================================
   📂 BASE UPLOAD DIR
===================================================== */
const BASE_UPLOAD_DIR = "uploads";

/* =====================================================
   🏢 COMPANY DOCUMENTS
===================================================== */
const companyDocsDir = path.join(BASE_UPLOAD_DIR, "company-documents");

if (!fs.existsSync(companyDocsDir)) {
  fs.mkdirSync(companyDocsDir, { recursive: true });
}

const companyDocStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, companyDocsDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const uploadCompanyDoc = multer({ storage: companyDocStorage }).single(
  "document"
);

/* =====================================================
   👤 CUSTOMER PROFILE IMAGE
===================================================== */
const customerImagesDir = path.join(BASE_UPLOAD_DIR, "customers");

if (!fs.existsSync(customerImagesDir)) {
  fs.mkdirSync(customerImagesDir, { recursive: true });
}

const customerImageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, customerImagesDir),
  filename: (req, file, cb) =>
    cb(null, `customer-${Date.now()}${path.extname(file.originalname)}`),
});

export const uploadCustomerImage = multer({
  storage: customerImageStorage,
}).single("profileImage");

/* =====================================================
   📦 EXPORTS (BACKWARD COMPATIBLE)
===================================================== */
export default uploadCompanyDoc;
