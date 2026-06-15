import axios from "axios";

// Base URL of the TravelMate backend. The admin app appends /api.
const BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

const API = axios.create({
  baseURL: BASE + "/api",
  headers: { "Content-Type": "application/json" },
});

// Attach the admin JWT to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401 (expired/invalid token)
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      if (!location.pathname.includes("/login")) location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ---------- AUTH ----------
export const adminLogin = (username, password) =>
  API.post("/admin/login", { username, password }).then((r) => r.data);
export const adminVerify = () => API.get("/admin/me").then((r) => r.data);

// ---------- DASHBOARD ----------
export const getStats = () => API.get("/admin/stats").then((r) => r.data);

// ---------- INCOME ----------
export const getIncome = () => API.get("/admin/income").then((r) => r.data);

// ---------- COUPONS ----------
export const getCoupons = () => API.get("/admin/coupons").then((r) => r.data);
export const createCoupon = (payload) => API.post("/admin/coupons", payload).then((r) => r.data);
export const deleteCoupon = (id) => API.delete(`/admin/coupons/${id}`).then((r) => r.data);
export const toggleCoupon = (id, isActive) =>
  API.patch(`/admin/coupons/${id}`, { isActive }).then((r) => r.data);

// ---------- RIDES / BOOKINGS ----------
export const getRides = () => API.get("/admin/rides").then((r) => r.data);
export const getBookings = () => API.get("/admin/bookings").then((r) => r.data);

// ---------- REPORTS ----------
export const getReports = (status) =>
  API.get("/admin/reports", { params: status ? { status } : {} }).then((r) => r.data);
export const resolveReport = (id, adminNote) =>
  API.post(`/admin/reports/${id}/resolve`, { adminNote }).then((r) => r.data);
export const blockFromReport = (id, reason) =>
  API.post(`/admin/reports/${id}/block`, { reason }).then((r) => r.data);

// ---------- USERS ----------
export const getUsers = () => API.get("/admin/users").then((r) => r.data);
export const blockUser = (phone, reason) =>
  API.post("/admin/users/block", { phone, reason }).then((r) => r.data);
export const unblockUser = (phone) =>
  API.post("/admin/users/unblock", { phone }).then((r) => r.data);

export default API;
