// client/src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axiosConfig";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [branding, setBranding] = useState(null);
  const [loading, setLoading] = useState(true);

  // ============================================
  // Load Branding for company/manager/driver
  // ============================================
  const loadBranding = async () => {
    try {
      const res = await api.get("/company/branding/get");
      setBranding(res.data.branding || null);
    } catch (err) {
      setBranding(null); // fallback
    }
  };

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    setUser(res.data.user);

    // load branding only for company, manager, driver
    if (["company", "manager", "driver"].includes(res.data.user.role)) {
      await loadBranding();
    }
  };

  const logout = () => {
    setUser(null);
    setBranding(null);
    localStorage.removeItem("token");
  };

  // ============================================
  // Load user from localStorage on refresh
  // ============================================
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get("/auth/me")
      .then(async (res) => {
        setUser(res.data.user);

        if (["company", "manager", "driver"].includes(res.data.user.role)) {
          await loadBranding();
        }
      })
      .catch(() => {
        logout();
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        branding,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
