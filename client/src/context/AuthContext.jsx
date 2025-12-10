import React, { createContext, useContext, useEffect, useState } from "react";
import { useBranding } from "./BrandingContext";  // ✅ FIX

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Use branding from BrandingContext
  const { branding } = useBranding();

  useEffect(() => {
    const storedToken = localStorage.getItem("st_token");
    const storedUser = localStorage.getItem("st_user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = (tokenValue, userData) => {
    setToken(tokenValue);
    setUser(userData);
    localStorage.setItem("st_token", tokenValue);
    localStorage.setItem("st_user", JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("st_token");
    localStorage.removeItem("st_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        branding,                          // now defined!
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
