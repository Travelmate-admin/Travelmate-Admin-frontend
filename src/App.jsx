import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Income from "./pages/Income";
import Plans from "./pages/Plans";
import Coupons from "./pages/Coupons";
import Rides from "./pages/Rides";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import { IconLoader } from "./components/Icons";

export default function App() {
  const { booting } = useAuth();

  if (booting) {
    return (
      <div style={{ height: "100vh", display: "grid", placeItems: "center", color: "#9ca0b8" }}>
        <IconLoader size={32} />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/income" element={<Income />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/coupons" element={<Coupons />} />
        <Route path="/rides" element={<Rides />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/users" element={<Users />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
