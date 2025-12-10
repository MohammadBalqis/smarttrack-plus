// server/src/utils/subscriptionUtils.js

/**
 * Compute subscription tier based on the current number of drivers.
 *
 * Tiers (month, USD):
 *  0–10  drivers → $50
 *  11–30 drivers → $80
 *  31–50 drivers → $100
 *  >50   drivers → $150
 */
export const getSubscriptionTierFromDrivers = (driverCount = 0) => {
  let tierKey = "tier_0_10";
  let label = "0 - 10 drivers";
  let maxDrivers = 10;
  let priceUsd = 50;

  if (driverCount <= 10) {
    tierKey = "tier_0_10";
    label = "0 - 10 drivers";
    maxDrivers = 10;
    priceUsd = 50;
  } else if (driverCount <= 30) {
    tierKey = "tier_11_30";
    label = "11 - 30 drivers";
    maxDrivers = 30;
    priceUsd = 80;
  } else if (driverCount <= 50) {
    tierKey = "tier_31_50";
    label = "31 - 50 drivers";
    maxDrivers = 50;
    priceUsd = 100;
  } else {
    tierKey = "tier_51_plus";
    label = "51+ drivers";
    maxDrivers = 9999; // effectively unlimited for now
    priceUsd = 150;
  }

  return {
    tierKey,     // e.g. "tier_11_30"
    label,       // e.g. "11 - 30 drivers"
    maxDrivers,  // e.g. 30
    priceUsd,    // e.g. 80
  };
};
