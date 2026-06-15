import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const token = localStorage.getItem("admin_token");
  if (!user || !token) return <Navigate to="/login" replace />;
  return children;
}
