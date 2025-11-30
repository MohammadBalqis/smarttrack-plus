// client/src/socket.js
import { io } from "socket.io-client";

const API_URL =
  import.meta?.env?.VITE_API_BASE_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  "http://localhost:5000";

const socket = io(API_URL, {
  withCredentials: true,
});

export default socket;
