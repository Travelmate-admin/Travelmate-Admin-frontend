import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { IconLoader, IconAlert } from "../components/Icons";
import "./Login.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(form.username.trim(), form.password);
      navigate("/", { replace: true });
    } catch (e2) {
      const api = import.meta.env.VITE_API_URL || "http://localhost:5000";
      let msg;
      if (e2.response) {
        // Server responded
        if (e2.response.status === 401) msg = "Invalid username or password.";
        else if (e2.response.status === 404)
          msg = `Login route not found at ${api}. Restart the backend server so it loads the new /api/admin routes.`;
        else msg = e2.response.data?.message || `Server error (${e2.response.status}).`;
      } else {
        // No response = couldn't reach the backend at all
        msg = `Can't reach the backend at ${api}. Make sure the server is running (cd server && npm run dev) and that VITE_API_URL is correct.`;
      }
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-art">
        <div className="login-art-inner">
          <img className="login-logo" src="/favicon.png" alt="TravelMate" />
          <h1>TravelMate</h1>
          <p>Admin Control Center</p>
          <ul>
            <li>Track coupon usage &amp; manage offers</li>
            <li>Monitor rides, bookings &amp; riders</li>
            <li>Review reports &amp; moderate users</li>
          </ul>
        </div>
      </div>

      <div className="login-form-wrap">
        <form className="login-form" onSubmit={submit}>
          <h2>Welcome back</h2>
          <p className="login-sub">Sign in to the admin panel</p>

          {err && (
            <div className="login-error">
              <IconAlert size={17} /> {err}
            </div>
          )}

          <div className="field">
            <label>Username</label>
            <input
              autoFocus
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="admin"
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>

          <button className="btn btn-primary login-btn" disabled={loading}>
            {loading ? <IconLoader size={18} /> : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
