// client/src/context/AuthContext.jsx
import { createContext, useContext, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    user: JSON.parse(localStorage.getItem("st_user")) || null,
    token: localStorage.getItem("st_token") || null,
    sid: localStorage.getItem("st_sid") || null,
  });

  const login = (token, user, sessionId) => {
    localStorage.setItem("st_token", token);
    localStorage.setItem("st_sid", sessionId);
    localStorage.setItem("st_user", JSON.stringify(user));

    setAuth({ user, token, sid: sessionId });
  };

  const logout = () => {
    localStorage.removeItem("st_token");
    localStorage.removeItem("st_sid");
    localStorage.removeItem("st_user");
    setAuth({ user: null, token: null, sid: null });
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
