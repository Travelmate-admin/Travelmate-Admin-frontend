import { useEffect, useMemo, useState } from "react";
import {
  getCoupons, createCoupon, deleteCoupon, toggleCoupon,
} from "../services/api";
import Modal from "../components/Modal";
import { useToast } from "../components/Toast";
import {
  IconPlus, IconTrash, IconSearch, IconLoader, IconTicket,
} from "../components/Icons";
import "../styles/pages.css";

const blankForm = {
  code: "", description: "", type: "flat", value: "", maxCashback: "",
  appliesTo: [], usageLimit: "", expiresAt: "",
};

export default function Coupons() {
  const { showToast, Toast } = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [confirm, setConfirm] = useState(null); // coupon pending delete

  const load = () => {
    setLoading(true);
    getCoupons()
      .then((r) => setCoupons(r.data))
      .catch((e) => showToast(e.response?.data?.message || "Failed to load coupons", "error"))
      .finally(() => setLoading(false));
  };
  useEffect(load, []); // eslint-disable-line

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return coupons;
    return coupons.filter(
      (c) => c.code.toLowerCase().includes(t) || (c.description || "").toLowerCase().includes(t)
    );
  }, [coupons, q]);

  const totalRedemptions = coupons.reduce((s, c) => s + c.usedCount, 0);
  const totalPeople = coupons.reduce((s, c) => s + c.uniquePeople, 0);

  const togglePlan = (plan) =>
    setForm((f) => ({
      ...f,
      appliesTo: f.appliesTo.includes(plan)
        ? f.appliesTo.filter((p) => p !== plan)
        : [...f.appliesTo, plan],
    }));

  const submit = async (e) => {
    e.preventDefault();
    setFormErr("");
    if (!form.code.trim() || form.value === "" || !form.expiresAt) {
      setFormErr("Code, value and expiry date are required.");
      return;
    }
    setSaving(true);
    try {
      await createCoupon({
        code: form.code,
        description: form.description,
        type: form.type,
        value: Number(form.value),
        maxCashback: form.maxCashback ? Number(form.maxCashback) : 0,
        appliesTo: form.appliesTo,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : 0,
        expiresAt: form.expiresAt,
      });
      showToast("Coupon created");
      setAddOpen(false);
      setForm(blankForm);
      load();
    } catch (e2) {
      setFormErr(e2.response?.data?.message || "Failed to create coupon.");
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    const c = confirm;
    setConfirm(null);
    try {
      await deleteCoupon(c._id);
      showToast("Coupon deleted");
      setCoupons((list) => list.filter((x) => x._id !== c._id));
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to delete", "error");
    }
  };

  const onToggle = async (c) => {
    try {
      await toggleCoupon(c._id, !c.isActive);
      setCoupons((list) => list.map((x) => (x._id === c._id ? { ...x, isActive: !c.isActive } : x)));
      showToast(c.isActive ? "Coupon deactivated" : "Coupon activated");
    } catch {
      showToast("Failed to update", "error");
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Coupon Management</h2>
          <div className="lead">See how often each coupon is used, by how many people, and add or remove offers.</div>
        </div>
        <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
          <IconPlus size={18} /> New coupon
        </button>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-top"><span className="stat-label">Total coupons</span>
            <span className="stat-icon" style={{ background: "#f59e0b" }}><IconTicket size={20} /></span></div>
          <div className="stat-value mono">{coupons.length}</div>
          <div className="stat-sub">{coupons.filter((c) => c.isActive && !c.expired).length} active</div>
        </div>
        <div className="stat-card">
          <div className="stat-top"><span className="stat-label">Total times used</span></div>
          <div className="stat-value mono">{totalRedemptions}</div>
          <div className="stat-sub">across all coupons</div>
        </div>
        <div className="stat-card">
          <div className="stat-top"><span className="stat-label">People who used</span></div>
          <div className="stat-value mono">{totalPeople}</div>
          <div className="stat-sub">unique redemptions</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <span className="muted"><IconSearch size={17} /></span>
          <input placeholder="Search by code or description…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="panel table-wrap">
        {loading ? (
          <div className="loading-wrap"><IconLoader size={28} /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><strong>No coupons found</strong>Create your first coupon to get started.</div>
        ) : (
          <table className="tm-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Used (times)</th>
                <th>People</th>
                <th>Usage</th>
                <th>Expiry</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const limit = c.usageLimit > 0 ? c.usageLimit : null;
                const pct = limit ? Math.min(100, Math.round((c.usedCount / limit) * 100)) : null;
                return (
                  <tr key={c._id}>
                    <td>
                      <span className="code-chip">{c.code}</span>
                      {c.description && <div className="muted" style={{ fontSize: "0.76rem", marginTop: 4 }}>{c.description}</div>}
                    </td>
                    <td className="mono">
                      {c.type === "flat" ? `₹${c.value} off` : `${c.value}% off`}
                      {c.type === "percent" && c.maxCashback > 0 && (
                        <div className="muted" style={{ fontSize: "0.74rem" }}>max ₹{c.maxCashback}</div>
                      )}
                    </td>
                    <td><b className="mono" style={{ fontSize: "1.05rem" }}>{c.usedCount}</b></td>
                    <td><b className="mono" style={{ fontSize: "1.05rem" }}>{c.uniquePeople}</b></td>
                    <td>
                      <div className="usage">
                        <div className="usage-top">
                          <span>{c.usedCount}{limit ? ` / ${limit}` : ""}</span>
                          <b>{limit ? `${pct}%` : "∞"}</b>
                        </div>
                        <div className="usage-bar">
                          <div className="usage-fill" style={{ width: limit ? `${pct}%` : "100%", opacity: limit ? 1 : 0.35 }} />
                        </div>
                      </div>
                    </td>
                    <td className="mono" style={{ fontSize: "0.84rem" }}>
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}
                    </td>
                    <td>
                      {c.expired ? <span className="badge badge-gray">Expired</span>
                        : c.isActive ? <span className="badge badge-green">Active</span>
                        : <span className="badge badge-amber">Inactive</span>}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost btn-sm" onClick={() => onToggle(c)} disabled={c.expired}>
                          {c.isActive ? "Disable" : "Enable"}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirm(c)} title="Delete coupon">
                          <IconTrash size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ---- Add coupon modal ---- */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Create new coupon"
        width={520}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setAddOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={saving}>
              {saving ? <IconLoader size={17} /> : "Create coupon"}
            </button>
          </>
        }
      >
        <form onSubmit={submit}>
          {formErr && <div className="login-error" style={{ marginBottom: 16 }}>{formErr}</div>}
          <div className="field-row">
            <div className="field">
              <label>Coupon code *</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="WELCOME10" />
            </div>
            <div className="field">
              <label>Expiry date *</label>
              <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
            </div>
          </div>

          <div className="field">
            <label>Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="₹10 off on your first plan" />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Type *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="flat">Flat (₹ off)</option>
                <option value="percent">Percent (% off)</option>
              </select>
            </div>
            <div className="field">
              <label>{form.type === "flat" ? "Amount (₹) *" : "Percent (%) *"}</label>
              <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder={form.type === "flat" ? "50" : "10"} />
            </div>
          </div>

          <div className="field-row">
            {form.type === "percent" && (
              <div className="field">
                <label>Max cashback (₹)</label>
                <input type="number" value={form.maxCashback} onChange={(e) => setForm({ ...form, maxCashback: e.target.value })} placeholder="100" />
              </div>
            )}
            <div className="field">
              <label>Usage limit (0 = unlimited)</label>
              <input type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} placeholder="0" />
            </div>
          </div>

          <div className="field">
            <label>Applies to plans (none = all)</label>
            <div className="chip-row">
              {["daily", "monthly", "yearly"].map((p) => (
                <button type="button" key={p} className={`plan-chip ${form.appliesTo.includes(p) ? "on" : ""}`} onClick={() => togglePlan(p)}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* ---- Delete confirm ---- */}
      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Delete coupon?"
        width={420}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={doDelete}><IconTrash size={16} /> Delete</button>
          </>
        }
      >
        {confirm && (
          <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)" }}>
            Permanently delete <span className="code-chip">{confirm.code}</span>? This can’t be undone.
            {confirm.usedCount > 0 && <><br /><br />This coupon has been used <b>{confirm.usedCount}</b> time(s).</>}
          </p>
        )}
      </Modal>

      <Toast />
    </div>
  );
}
