// server/src/models/Branding.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const brandingSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "User", // your company is stored in User with role: "company"
      required: true,
      unique: true,
      index: true,
    },

    // Basic identity
    companyDisplayName: { type: String, trim: true }, // e.g. "FastDrop Delivery"
    shortTagline: { type: String, trim: true },       // e.g. "We deliver. Fast."

    // Visual
    logoUrl: { type: String, default: "" },           // logo image URL
    coverUrl: { type: String, default: "" },          // cover/header image URL

    // Theme colors
    primaryColor: { type: String, default: "#1F2933" },   // dark blue/gray
    secondaryColor: { type: String, default: "#F5F5F5" }, // light bg
    accentColor: { type: String, default: "#2563EB" },    // blue accent

    // About & description
    about: { type: String, default: "" },

    // Contact info
    contactEmail: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    website: { type: String, trim: true },

    // Location
    addressLine: { type: String, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true },

    // Social links
    facebookUrl: { type: String, trim: true },
    instagramUrl: { type: String, trim: true },
    tiktokUrl: { type: String, trim: true },
    whatsappNumber: { type: String, trim: true },

    // Public / visibility
    isPublic: { type: Boolean, default: true },

    // Extra flexible data (if we need custom stuff later)
    meta: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

const Branding = mongoose.model("Branding", brandingSchema);
export default Branding;
