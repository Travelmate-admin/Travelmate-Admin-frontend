import { useEffect, useMemo, useState } from "react";
import { getIncome } from "../services/api";
import { useToast } from "../components/Toast";
import { IconLoader, IconRupee, IconTrend, IconSearch } from "../components/Icons";
import "../styles/pages.css";

const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

const PLAN_BADGE = { daily: "badge-blue", monthly: "badge-amber", yearly: "badge-green" };

export default function Income() {
  const { showToast, Toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    getIncome()
      .then((r) => setData(r.data))
      .catch((e) => showToast(e.response?.data?.message || "Failed to load income", "error"))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const payments = data?.payments || [];
  const sum = data?.summary;

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return payments;
    return payments.filter(
      (p) => p.phone?.includes(t) || p.plan?.includes(t) || (p.couponCode || "").toLowerCase().includes(t)
    );
  }, [payments, q]);

  if (loading) return <div className="loading-wrap"><IconLoader size={30} /></div>;

  const maxPlan = sum ? Math.max(sum.byPlan.daily, sum.byPlan.monthly, sum.byPlan.yearly, 1) : 1;

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Income &amp; Revenue</h2>
          <div className="lead">Total earnings from paid plan subscriptions, with a full payment history.</div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-top"><span className="stat-label">Overall income</span>
            <span className="stat-icon" style={{ background: "#15803d" }}><IconRupee size={20} /></span></div>
          <div className="stat-value mono" style={{ color: "#15803d" }}>{inr(sum?.total)}</div>
          <div className="stat-sub">{sum?.payments || 0} payments</div>
        </div>
        <div className="stat-card">
          <div className="stat-top"><span className="stat-label">This month</span>
            <span className="stat-icon" style={{ background: "#3b82f6" }}><IconTrend size={20} /></span></div>
          <div className="stat-value mono">{inr(sum?.thisMonth)}</div>
          <div className="stat-sub">since the 1st</div>
        </div>
        <div className="stat-card">
          <div className="stat-top"><span className="stat-label">Avg / payment</span></div>
          <div className="stat-value mono">{inr(sum?.avgOrder)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-top"><span className="stat-label">Cashback given</span></div>
          <div className="stat-value mono" style={{ color: "#b45309" }}>−{inr(sum?.cashbackGiven)}</div>
          <div className="stat-sub">via coupons</div>
        </div>
      </div>

      {/* By-plan breakdown */}
      <div className="panel dash-panel" style={{ marginBottom: 24 }}>
        <div className="dash-panel-head"><h3>Revenue by plan</h3></div>
        {["daily", "monthly", "yearly"].map((plan) => {
          const val = sum?.byPlan?.[plan] || 0;
          const cnt = sum?.countByPlan?.[plan] || 0;
          return (
            <div className="plan-bar-row" key={plan}>
              <div className="plan-bar-label">
                <span className={`badge ${PLAN_BADGE[plan]}`} style={{ textTransform: "capitalize" }}>{plan}</span>
                <span className="muted" style={{ fontSize: "0.78rem" }}>{cnt} payment(s)</span>
              </div>
              <div className="plan-bar-track">
                <div className="plan-bar-fill" style={{ width: `${(val / maxPlan) * 100}%` }} />
              </div>
              <div className="plan-bar-val mono">{inr(val)}</div>
            </div>
          );
        })}
      </div>

      <div className="toolbar">
        <div className="search-box">
          <span className="muted"><IconSearch size={17} /></span>
          <input placeholder="Search by phone, plan or coupon…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="panel table-wrap">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <strong>No payments yet</strong>
            Income appears here once users buy a plan. Currently total earnings are {inr(sum?.total)}.
          </div>
        ) : (
          <table className="tm-table">
            <thead>
              <tr>
                <th>User</th><th>Plan</th><th>Original</th><th>Cashback</th><th>Paid</th><th>Coupon</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p._id}>
                  <td className="mono">{p.phone}</td>
                  <td><span className={`badge ${PLAN_BADGE[p.plan] || "badge-gray"}`} style={{ textTransform: "capitalize" }}>{p.plan}</span></td>
                  <td className="mono muted">{inr(p.originalAmount)}</td>
                  <td className="mono" style={{ color: p.cashback ? "#b45309" : undefined }}>{p.cashback ? "−" + inr(p.cashback) : "—"}</td>
                  <td className="mono"><b>{inr(p.amountPaid)}</b></td>
                  <td>{p.couponCode ? <span className="code-chip">{p.couponCode}</span> : <span className="muted">—</span>}</td>
                  <td className="mono" style={{ fontSize: "0.82rem" }}>{p.date ? new Date(p.date).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Toast />
    </div>
  );
}
