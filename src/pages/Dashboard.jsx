import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStats } from "../services/api";
import {
  IconUsers, IconCar, IconTicket, IconFlag, IconLoader, IconBan, IconTrend, IconCheck,
} from "../components/Icons";
import "../styles/pages.css";

const inr = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN");

function StatCard({ icon: Icon, color, label, value, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <span className="stat-icon" style={{ background: color }}>
          <Icon size={20} />
        </span>
      </div>
      <div className="stat-value mono">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getStats()
      .then((r) => setStats(r.data))
      .catch((e) => setError(e.response?.data?.message || "Failed to load dashboard. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-wrap"><IconLoader size={30} /></div>;
  if (error) return <div className="empty-state panel"><strong>Couldn’t load data</strong>{error}</div>;

  const s = stats;
  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Overview</h2>
          <div className="lead">Live snapshot of coupons, rides, bookings and moderation.</div>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard icon={IconTrend} color="#15803d" label="Overall income"
          value={inr(s.income?.total)} sub={`${s.income?.payments || 0} payments · ${inr(s.income?.thisMonth)} this month`} />
        <StatCard icon={IconUsers} color="#3b82f6" label="Total users"
          value={s.users.total} sub={`${s.users.blocked} blocked`} />
        <StatCard icon={IconCar} color="#22c55e" label="Rides posted"
          value={s.rides.total} sub={`${s.rides.upcoming} upcoming`} />
        <StatCard icon={IconCheck} color="#6c2bd9" label="Bookings"
          value={s.bookings.total} sub={`${s.bookings.completed} completed (rode)`} />
        <StatCard icon={IconTicket} color="#f59e0b" label="Coupon redemptions"
          value={s.coupons.redemptions} sub={`${s.coupons.uniqueRedeemers} unique people`} />
        <StatCard icon={IconFlag} color="#ec4899" label="Pending reports"
          value={s.reports.pending} sub={`${s.reports.total} total filed`} />
        <StatCard icon={IconBan} color="#ef4444" label="Blocked users"
          value={s.users.blocked} sub="Permanently blocked" />
      </div>

      <div className="dash-cols">
        <div className="panel dash-panel">
          <div className="dash-panel-head">
            <h3>Income <IconTrend size={16} style={{ verticalAlign: "-2px", color: "#15803d" }} /></h3>
          </div>
          <div className="income-hero">
            <div className="income-big mono">{inr(s.income?.total)}</div>
            <div className="muted" style={{ fontSize: "0.8rem" }}>total revenue · {inr(s.income?.thisMonth)} this month</div>
          </div>
          <div className="mini-rows">
            <div className="mini-row"><span>Daily plan</span><b className="mono">{inr(s.income?.byPlan?.daily)}</b></div>
            <div className="mini-row"><span>Monthly plan</span><b className="mono">{inr(s.income?.byPlan?.monthly)}</b></div>
            <div className="mini-row"><span>Yearly plan</span><b className="mono">{inr(s.income?.byPlan?.yearly)}</b></div>
            <div className="mini-row"><span>Avg / payment</span><b className="mono">{inr(s.income?.avgOrder)}</b></div>
            <div className="mini-row"><span>Cashback given</span><b className="mono" style={{ color: "#b45309" }}>−{inr(s.income?.cashbackGiven)}</b></div>
          </div>
        </div>

        <div className="panel dash-panel">
          <div className="dash-panel-head">
            <h3>Coupons</h3>
            <Link to="/coupons" className="link-btn">Manage →</Link>
          </div>
          <div className="mini-rows">
            <div className="mini-row"><span>Active coupons</span><b className="mono">{s.coupons.active}</b></div>
            <div className="mini-row"><span>Total coupons</span><b className="mono">{s.coupons.total}</b></div>
            <div className="mini-row"><span>Times redeemed</span><b className="mono">{s.coupons.redemptions}</b></div>
            <div className="mini-row"><span>Unique people</span><b className="mono">{s.coupons.uniqueRedeemers}</b></div>
          </div>
        </div>

        <div className="panel dash-panel">
          <div className="dash-panel-head">
            <h3>Moderation</h3>
            <Link to="/reports" className="link-btn">Review →</Link>
          </div>
          <div className="mini-rows">
            <div className="mini-row"><span>Pending reports</span><b className="mono" style={{ color: s.reports.pending ? "#b45309" : undefined }}>{s.reports.pending}</b></div>
            <div className="mini-row"><span>Total reports</span><b className="mono">{s.reports.total}</b></div>
            <div className="mini-row"><span>Blocked users</span><b className="mono">{s.users.blocked}</b></div>
          </div>
        </div>

        <div className="panel dash-panel">
          <div className="dash-panel-head">
            <h3>Rides <IconTrend size={16} style={{ verticalAlign: "-2px", color: "#22c55e" }} /></h3>
            <Link to="/rides" className="link-btn">View →</Link>
          </div>
          <div className="mini-rows">
            <div className="mini-row"><span>Total posted</span><b className="mono">{s.rides.total}</b></div>
            <div className="mini-row"><span>Upcoming</span><b className="mono">{s.rides.upcoming}</b></div>
            <div className="mini-row"><span>Total bookings</span><b className="mono">{s.bookings.total}</b></div>
            <div className="mini-row"><span>Completed (rode)</span><b className="mono">{s.bookings.completed}</b></div>
          </div>
        </div>
      </div>
    </div>
  );
}
