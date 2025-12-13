// client/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "leaflet/dist/leaflet.css";

import { BrandingProvider } from "./context/BrandingContext";
import { io } from "socket.io-client";

// 🔵 GLOBAL SOCKET.IO CONNECTION
export const socket = io(import.meta.env.VITE_API_BASE_URL, {
  transports: ["websocket"],
  withCredentials: true,
});

socket.on("connect", () => {
  console.log("🟢 Connected to Socket.IO:", socket.id);
});

socket.on("connect_error", (err) => {
  console.log("🔴 Socket connection error:", err.message);
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrandingProvider>
      <App />
    </BrandingProvider>
  </React.StrictMode>
);
