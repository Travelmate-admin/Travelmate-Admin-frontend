import { useEffect, useMemo, useState } from "react";
import {
  getBusRoutes, createBusRoute, updateBusRoute, deleteBusRoute,
} from "../services/api";
import Modal from "../components/Modal";
import { useToast } from "../components/Toast";
import { IconPlus, IconTrash, IconSearch, IconLoader } from "../components/Icons";
import BusRouteImport from "./BusRouteImport";
import { chennaiRouteError } from "../utils/chennai";
import "../styles/pages.css";

const blankForm = {
  busNumber: "", operator: "", from: "", to: "",
  stopsText: "", notes: "", active: true,
};

// stops array <-> one-per-line text
const stopsToText = (stops) =>
  (stops || []).map((s) => (typeof s === "string" ? s : s.name)).join("\n");
const textToStops = (text) =>
  String(text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((name) => ({ name }));

export default function BusRoutes() {
  const { showToast, Toast } = useToast();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null); // route being edited, or null = new
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [confirm, setConfirm] = useState(null);

  const load = () => {
    setLoading(true);
    getBusRoutes()
      .then((r) => setRoutes(r.data))
      .catch((e) => showToast(e.response?.data?.message || "Failed to load bus routes", "error"))
      .finally(() => setLoading(false));
  };
  useEffect(load, []); // eslint-disable-line

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return routes;
    return routes.filter(
      (r) =>
        (r.busNumber || "").toLowerCase().includes(t) ||
        (r.from || "").toLowerCase().includes(t) ||
        (r.to || "").toLowerCase().includes(t)
    );
  }, [routes, q]);

  const openNew = () => {
    setEditing(null);
    setForm(blankForm);
    setFormErr("");
    setOpen(true);
  };
  const openEdit = (r) => {
    setEditing(r);
    setForm({
      busNumber: r.busNumber || "",
      operator: r.operator || "",
      from: r.from || "",
      to: r.to || "",
      stopsText: stopsToText(r.stops),
      notes: r.notes || "",
      active: r.active !== false,
    });
    setFormErr("");
    setOpen(true);
  };

  const submit = async (e) => {
    e && e.preventDefault();
    setFormErr("");
    if (!form.busNumber.trim() || !form.from.trim() || !form.to.trim()) {
      setFormErr("Bus number, starting location and destination are required.");
      return;
    }
    // Chennai-only restriction: start, end and every stop must be within Chennai.
    const cErr = chennaiRouteError({
      from: form.from.trim(),
      to: form.to.trim(),
      stops: textToStops(form.stopsText),
    });
    if (cErr) {
      setFormErr(cErr + ". Only routes within Chennai city are allowed.");
      return;
    }
    const payload = {
      busNumber: form.busNumber.trim(),
      operator: form.operator.trim(),
      from: form.from.trim(),
      to: form.to.trim(),
      stops: textToStops(form.stopsText),
      notes: form.notes.trim(),
      active: !!form.active,
    };
    setSaving(true);
    try {
      if (editing) {
        await updateBusRoute(editing._id, payload);
        showToast("Bus route updated");
      } else {
        await createBusRoute(payload);
        showToast("Bus route added");
      }
      setOpen(false);
      setForm(blankForm);
      setEditing(null);
      load();
    } catch (e2) {
      setFormErr(e2.response?.data?.message || "Failed to save bus route.");
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    const r = confirm;
    setConfirm(null);
    try {
      await deleteBusRoute(r._id);
      showToast("Bus route deleted");
      setRoutes((list) => list.filter((x) => x._id !== r._id));
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to delete", "error");
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Bus Routes</h2>
          <div className="lead">
            Verified bus routes users can look up by bus number. Enter the real route — number, start, end and stops in travel order.
          </div>
        </div>
        <div className="flex gap-2" style={{ alignItems: "center" }}>
          <BusRouteImport existing={routes} onImported={load} />
          <button className="btn btn-primary" onClick={openNew}>
            <IconPlus size={18} /> Add bus route
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <span className="muted"><IconSearch size={17} /></span>
          <input placeholder="Search by bus number, from or to…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="panel table-wrap">
        {loading ? (
          <div className="loading-wrap"><IconLoader size={28} /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><strong>No bus routes yet</strong>Add your first verified bus route.</div>
        ) : (
          <table className="tm-table">
            <thead>
              <tr>
                <th>Bus No.</th>
                <th>Operator</th>
                <th>From → To</th>
                <th>Stops</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r._id}>
                  <td><span className="code-chip">{r.busNumber}</span></td>
                  <td className="mono" style={{ fontSize: "0.82rem" }}>{r.operator || "—"}</td>
                  <td style={{ fontSize: "0.86rem" }}>
                    <b>{r.from}</b> <span className="muted">→</span> <b>{r.to}</b>
                  </td>
                  <td className="mono">{(r.stops || []).length}</td>
                  <td>
                    {r.active !== false
                      ? <span className="badge badge-green">Active</span>
                      : <span className="badge badge-amber">Hidden</span>}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirm(r)} title="Delete route">
                        <IconTrash size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ---- Add / Edit modal ---- */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit bus route" : "Add bus route"}
        width={560}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={saving}>
              {saving ? <IconLoader size={17} /> : (editing ? "Save changes" : "Add route")}
            </button>
          </>
        }
      >
        <form onSubmit={submit}>
          {formErr && <div className="login-error" style={{ marginBottom: 16 }}>{formErr}</div>}
          <div className="field-row">
            <div className="field">
              <label>Bus number *</label>
              <input value={form.busNumber} onChange={(e) => setForm({ ...form, busNumber: e.target.value })} placeholder="e.g. 138 or TN 47 N" />
            </div>
            <div className="field">
              <label>Operator</label>
              <input value={form.operator} onChange={(e) => setForm({ ...form, operator: e.target.value })} placeholder="TNSTC / SETC / MTC" />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>From (starting stop) *</label>
              <input value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} placeholder="e.g. Chennai (CMBT)" />
            </div>
            <div className="field">
              <label>To (final stop) *</label>
              <input value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} placeholder="e.g. Madurai" />
            </div>
          </div>

          <div className="field">
            <label>Intermediate stops — one per line, in travel order</label>
            <textarea
              rows={6}
              value={form.stopsText}
              onChange={(e) => setForm({ ...form, stopsText: e.target.value })}
              placeholder={"Tambaram\nChengalpattu\nVillupuram\nTrichy"}
              style={{ width: "100%", resize: "vertical", fontFamily: "inherit", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border, #e5e7eb)" }}
            />
            <div className="muted" style={{ fontSize: "0.76rem", marginTop: 4 }}>
              List the stops between From and To, in the correct sequence. Leave blank if unknown.
            </div>
          </div>

          <div className="field">
            <label>Notes (optional)</label>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Express service, runs every 30 min" />
          </div>

          <div className="field">
            <label className="flex gap-2" style={{ alignItems: "center", cursor: "pointer" }}>
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              <span>Active (visible to users)</span>
            </label>
          </div>
        </form>
      </Modal>

      {/* ---- Delete confirm ---- */}
      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Delete bus route?"
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
            Permanently delete bus <span className="code-chip">{confirm.busNumber}</span> ({confirm.from} → {confirm.to})? This can’t be undone.
          </p>
        )}
      </Modal>

      <Toast />
    </div>
  );
}
