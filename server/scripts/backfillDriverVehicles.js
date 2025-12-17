import mongoose from "mongoose";
import dotenv from "dotenv";
import Driver from "../src/models/Driver.js";
import Vehicle from "../src/models/Vehicle.js";

dotenv.config({ path: "server/.env" });


const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ DB connected");

  const drivers = await Driver.find({
    "verification.status": "verified",
    "vehicle.plateNumber": { $exists: true, $ne: "" },
  });

  console.log(`🔍 Found ${drivers.length} verified drivers`);

  let created = 0;

  for (const driver of drivers) {
    const exists = await Vehicle.findOne({ driverId: driver._id });
    if (exists) continue;

    await Vehicle.create({
      companyId: driver.companyId,
      managerId: driver.managerId,
      driverId: driver._id,

      plateNumber: driver.vehicle.plateNumber,
      brand: "Unknown",
      model: "Unknown",
      image: driver.vehicle.image || "",

      status: "active", // 🔥 IMPORTANT
      createdAt: new Date(),
    });

    created++;
    console.log(`🚗 Vehicle created for: ${driver.name}`);
  }

  console.log(`✅ Vehicles created: ${created}`);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});