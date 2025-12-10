import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import {
  getDriverNotificationsApi,
  markDriverNotificationReadApi,
} from "../api/driverApi";

const DriverNotificationContext = createContext();
export const useDriverNotifications = () => useContext(DriverNotificationContext);

export const DriverNotificationProvider = ({ children, user }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  /* ---------------------------------------------------------
     LOAD NOTIFICATIONS ON LOGIN
  --------------------------------------------------------- */
  useEffect(() => {
    if (!user?._id) return;

    getDriverNotificationsApi().then((res) => {
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    });
  }, [user?._id]);

  /* ---------------------------------------------------------
     SOCKET REAL-TIME LISTENER
  --------------------------------------------------------- */
  useEffect(() => {
    if (!user?._id) return;

    const socket = io(import.meta.env.VITE_API_URL, {
      transports: ["websocket"],
    });

    // Register driver
    socket.emit("register", { userId: user._id, role: "driver", companyId: user.companyId });

    // NEW NOTIFICATION ARRIVED
    socket.on("driver:new_notification", (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => socket.disconnect();
  }, [user?._id]);

  /* ---------------------------------------------------------
     MARK ALL AS READ
  --------------------------------------------------------- */
  const markAllAsRead = async () => {
    await markDriverNotificationReadApi();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <DriverNotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAllAsRead,
      }}
    >
      {children}
    </DriverNotificationContext.Provider>
  );
};
