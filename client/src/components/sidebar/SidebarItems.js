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
];

// 🚀 CUSTOMER MENU (GLOBAL CUSTOMER)
export const customerMenu = [
  { label: "Dashboard", icon: "🏠", path: "/customer" },
  { label: "New Order", icon: "🛒", path: "/customer/create-trip" }, // ⬅ NEW
  { label: "My Trips", icon: "📦", path: "/customer/trips" },      // active + history tabs later
  { label: "Payments", icon: "💳", path: "/customer/payments" },
  { label: "Profile", icon: "👤", path: "/customer/profile" },
  { label: "Sessions & Devices", icon: "💻", path: "/customer/sessions" }, // NEW
];
