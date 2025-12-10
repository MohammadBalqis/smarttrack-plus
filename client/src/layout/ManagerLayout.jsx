// client/src/layout/ManagerLayout.jsx
import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import ManagerSidebar from "../components/manager/ManagerSidebar";
import ManagerTopbar from "../components/manager/ManagerTopbar";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";

import styles from "../styles/manager/managerLayout.module.css";

const ManagerLayout = () => {
  const { user } = useAuth();

  /* ==========================================================
     SOCKET.IO → Register manager
  ========================================================== */
  useEffect(() => {
    if (!user?._id) return;

    const socket = io(import.meta.env.VITE_API_URL, {
      query: {
        userId: user._id,
        role: user.role,
        companyId: user.companyId,
      },
    });

    return () => socket.disconnect();
  }, [user]);

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <ManagerSidebar />
      </aside>

      {/* Main Content Area */}
      <main className={styles.main}>
        <ManagerTopbar />
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default ManagerLayout;
