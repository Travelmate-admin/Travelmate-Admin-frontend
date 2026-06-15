import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  IconDashboard, IconTicket, IconCar, IconFlag, IconUsers, IconLogout, IconMenu, IconX, IconRupee,
} from "./Icons";
import "./Layout.css";

const NAV = [
  { to: "/", label: "Dashboard", icon: IconDashboard, end: true },
  { to: "/income", label: "Income", icon: IconRupee },
  { to: "/coupons", label: "Coupons", icon: IconTicket },
  { to: "/rides", label: "Rides & Bookings", icon: IconCar },
  { to: "/reports", label: "Reports", icon: IconFlag },
  { to: "/users", label: "Users", icon: IconUsers },
];

const TITLES = {
  "/": "Dashboard",
  "/income": "Income & Revenue",
  "/coupons": "Coupon Management",
  "/rides": "Rides & Bookings",
  "/reports": "User Reports",
  "/users": "Users",
};

export default function Layout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <div className="layout">
      {open && <div className="scrim" onClick={() => setOpen(false)} />}

      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">TM</div>
          <div>
            <div className="brand-name">TravelMate</div>
            <div className="brand-sub">Admin Panel</div>
          </div>
          <button className="sidebar-close" onClick={() => setOpen(false)} aria-label="Close menu">
            <IconX size={20} />
          </button>
        </div>

        <nav className="nav">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              onClick={() => setOpen(false)}
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="who">
            <div className="who-avatar">{(user || "A")[0].toUpperCase()}</div>
            <div className="who-meta">
              <div className="who-name">{user || "Admin"}</div>
              <div className="who-role">Administrator</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm logout" onClick={logout}>
            <IconLogout size={16} /> Sign out
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">
            <IconMenu size={22} />
          </button>
          <h1 className="page-title">{TITLES[pathname] || "Admin"}</h1>
          <div className="topbar-right">
            <span className="env-pill">Live</span>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
