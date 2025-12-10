// client/src/socket.js
import { io } from "socket.io-client";

// Only use Vite environment variables (browser-safe)
const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const socket = io(API_URL, {
  withCredentials: true,
  transports: ["websocket"], // (optional) improves performance
});

export default socket;
