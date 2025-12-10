// client/src/components/sidebar/sidebarItems.js

export const managerMenu = [
  { label: "Dashboard", icon: "📊", path: "/manager" },
  { label: "Trips", icon: "🛣️", path: "/manager/trips" },
  { label: "Orders", icon: "🧾", path: "/manager/orders" },
  { label: "Drivers", icon: "🚗", path: "/manager/drivers" },
  { label: "Customers", icon: "👥", path: "/manager/customers" },
  { label: "Vehicles", icon: "🚘", path: "/manager/vehicles" },
  { label: "Products", icon: "📦", path: "/manager/products" },
  { label: "Payments", icon: "💳", path: "/manager/payments" },
  // 💬 NEW: Chat with Company
  { label: "Chat with Company", icon: "💬", path: "/manager/chat" }
];

export const companyMenu = [
  { label: "Dashboard", icon: "📊", path: "/company" },
  { label: "Products", icon: "📦", path: "/company/products" },
  { label: "Orders", icon: "🧾", path: "/company/orders" },
  { label: "Drivers", icon: "🚗", path: "/company/drivers" },
  { label: "Customers", icon: "👥", path: "/company/customers" },
  { label: "Trips", icon: "🛣️", path: "/company/trips" },
  { label: "Vehicles", icon: "🚘", path: "/company/vehicles" },
  { label: "Payments", icon: "💳", path: "/company/payments" },
  { label: "Shops / Branches", icon: "🏬", path: "/company/shops" },
  // 📨 NEW: Support Inbox
  { label: "Support Inbox", icon: "📨", path: "/company/support" },
  { label: "Chat with Managers", icon: "💬", path: "/company/chat" }
];

// 🚀 CUSTOMER MENU (GLOBAL CUSTOMER)
export const customerMenu = [
  { label: "Dashboard", icon: "🏠", path: "/customer" },
  { label: "New Order", icon: "🛒", path: "/customer/create-trip" },
  { label: "My Trips", icon: "📦", path: "/customer/trips" },
  { label: "Payments", icon: "💳", path: "/customer/payments" },
  { label: "Profile", icon: "👤", path: "/customer/profile" },
  { label: "Sessions & Devices", icon: "💻", path: "/customer/sessions" },
  // 🆕 Customer Support
  { label: "Support", icon: "🆘", path: "/customer/support" },
];
// client/src/components/sidebar/sidebarItems.js
export const driverMenu = [
  { label: "Dashboard", icon: "📊", path: "/driver" },
  { label: "My Trips", icon: "🧾", path: "/driver/trips" },
  { label: "Scan QR", icon: "📷", path: "/driver/scan-qr" },
  { label: "Payments", icon: "💳", path: "/driver/payments" },
  {label: "Payments Summary", path: "/driver/payments-summary",icon: "📊"},
  { label: "Vehicle", icon: "🚘", path: "/driver/vehicle" },
  { label: "Profile", icon: "👤", path: "/driver/profile" },
  { label: "Live Trip", icon: "🛰️", path: "/driver/live-trip" },
 

];
