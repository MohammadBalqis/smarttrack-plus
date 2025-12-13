import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function RoleRoute({ role, children }) {
  const { auth } = useContext(AuthContext);

  if (!auth.user) return <Navigate to="/login" />;

  if (role && auth.user.role !== role) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}
