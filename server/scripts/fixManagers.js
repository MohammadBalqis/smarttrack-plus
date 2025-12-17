import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/User.js";

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const res = await User.updateMany(
    {
      role: "manager",
      passwordHash: { $exists: true },
      managerOnboardingStage: { $ne: "account_created" },
    },
    {
      $set: {
        managerOnboardingStage: "account_created",
        managerVerificationStatus: "verified",
      },
    }
  );

  console.log("✅ Managers fixed:", res.modifiedCount);

  await mongoose.disconnect();
};

run().catch(console.error);
