// pages/BusRouteImport.jsx
// Bulk Excel/CSV import for Bus Routes. Self-contained add-on: renders its own
// "Import Bus Routes" button + modal and reuses the existing bus-route APIs.
// Parsing happens in the browser via SheetJS (lazy-loaded from CDN); only clean
// JSON is sent to the backend. Nothing here changes the existing manual flow.

import { useState, useCallback } from "react";
import { importBusRoutes, getBusRouteImportHistory } from "../services/api";
import { loadSheetJS } from "../utils/sheetjs";
import { chennaiRouteError } from "../utils/chennai";
import Modal from "../components/Modal";
import { useToast } from "../components/Toast";
import { IconLoader } from "../components/Icons";

// Template columns, in order.
const COLUMNS = [
  "Bus Number", "Bus Name", "Starting Location", "Destination", "Via Locations",
  "Stop Name", "Stop Order", "Arrival Time", "Departure Time", "Distance",
  "Bus Type", "Status",
];

// Header text -> internal field (accepts common variants, case/space-insensitive).
const norm = (h) => String(h || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const FIELD_SYNONYMS = {
  busNumber: ["busnumber", "busno", "routeno", "routenumber", "number"],
  busName: ["busname", "name", "operator"],
  from: ["startinglocation", "start", "from", "source", "origin"],
  to: ["destination", "to", "end", "dest"],
  via: ["vialocations", "via", "viapoints", "viastops"],
  stopName: ["stopname", "stop"],
  stopOrder: ["stoporder", "order", "sequence", "seq", "stopno"],
  arrivalTime: ["arrivaltime", "arrival", "arr"],
  departureTime: ["departuretime", "departure", "dep"],
  distance: ["distance", "km", "kms", "distancekm"],
  busType: ["bustype", "type", "category"],
  status: ["status", "active"],
};
function headerField(h) {
  const n = norm(h);
  for (const field of Object.keys(FIELD_SYNONYMS)) {
    if (FIELD_SYNONYMS[field].includes(n)) return field;
  }
  return null;
}

const searchKeyOf = (busNumber) =>
  String(busNumber || "").toUpperCase().replace(/[\s-]+/g, "");

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export default function BusRouteImport({ existing = [], onImported }) {
  const { showToast, Toast } = useToast();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("add"); // "add" | "update"
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState(null); // { routes:[...], counts:{...} }
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const existingKeys = new Set((existing || []).map((r) => searchKeyOf(r.busNumber)));

  const reset = () => { setPreview(null); setResult(null); setFileName(""); };

  const openModal = () => {
    reset();
    setMode("add");
    setOpen(true);
  };

  // ---- Download the sample Excel template ----
  const downloadTemplate = useCallback(async () => {
    try {
      const XLSX = await loadSheetJS();
      const sample = [
        COLUMNS,
        ["138", "TNSTC Express", "Chennai (CMBT)", "Madurai", "Trichy; Dindigul",
         "Chennai (CMBT)", 1, "", "06:00", "460 km", "AC Sleeper", "Active"],
        ["138", "TNSTC Express", "Chennai (CMBT)", "Madurai", "Trichy; Dindigul",
         "Trichy", 2, "09:30", "09:45", "460 km", "AC Sleeper", "Active"],
        ["138", "TNSTC Express", "Chennai (CMBT)", "Madurai", "Trichy; Dindigul",
         "Madurai", 3, "12:30", "", "460 km", "AC Sleeper", "Active"],
      ];
      const ws = XLSX.utils.aoa_to_sheet(sample);
      ws["!cols"] = COLUMNS.map((c) => ({ wch: Math.max(12, c.length + 2) }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Bus Routes");
      XLSX.writeFile(wb, "Vooggly-BusRoutes-Template.xlsx");
    } catch (e) {
      showToast("Could not generate template. Check your connection and retry.", "error");
    }
  }, [showToast]);

  // ---- Parse an uploaded .xlsx/.xls/.csv into grouped, validated routes ----
  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setParsing(true);
    setResult(null);
    setPreview(null);
    setFileName(file.name);
    try {
      const XLSX = await loadSheetJS();
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(ws, { defval: "" });

      // Map each row's columns to internal fields.
      const rows = rawRows
        .map((row) => {
          const o = {};
          for (const key of Object.keys(row)) {
            const f = headerField(key);
            if (f) o[f] = row[key];
          }
          return o;
        })
        .filter((r) => Object.values(r).some((v) => String(v).trim() !== ""));

      // Group by bus number. Rows missing a bus number can't be grouped.
      const groups = new Map();
      const orphanRows = [];
      rows.forEach((r, idx) => {
        const bn = String(r.busNumber || "").trim();
        const key = searchKeyOf(bn);
        if (!key) { orphanRows.push({ ...r, _row: idx + 2 }); return; }
        if (!groups.has(key)) groups.set(key, { key, busNumber: bn, rows: [] });
        groups.get(key).rows.push(r);
      });

      const pick = (grp, field) => {
        for (const r of grp.rows) {
          const v = String(r[field] ?? "").trim();
          if (v) return v;
        }
        return "";
      };

      const routes = [];
      for (const grp of groups.values()) {
        const stops = grp.rows
          .filter((r) => String(r.stopName || "").trim())
          .map((r) => ({
            name: String(r.stopName).trim(),
            order: toNum(r.stopOrder),
            arrivalTime: String(r.arrivalTime || "").trim(),
            departureTime: String(r.departureTime || "").trim(),
          }))
          .sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9));

        const busNumber = grp.busNumber;
        const from = pick(grp, "from");
        const to = pick(grp, "to");
        const status = pick(grp, "status");
        const issues = [];
        if (!busNumber) issues.push("Missing Bus Number");
        if (!from) issues.push("Missing Starting Location");
        if (!to) issues.push("Missing Destination");
        // Chennai-only restriction — reject any place outside Chennai.
        const cErr = chennaiRouteError({ from, to, stops });
        if (cErr) issues.push(cErr);
        const exists = existingKeys.has(grp.key);

        routes.push({
          busNumber,
          busName: pick(grp, "busName"),
          from, to,
          via: pick(grp, "via"),
          distance: pick(grp, "distance"),
          busType: pick(grp, "busType"),
          status,
          stops,
          _exists: exists,
          _issues: issues,
          _valid: issues.length === 0,
        });
      }

      // Orphan (no bus number) rows become explicit error entries.
      orphanRows.forEach((r) => {
        routes.push({
          busNumber: "", busName: "", from: String(r.from || ""), to: String(r.to || ""),
          via: "", distance: "", busType: "", status: "", stops: [],
          _exists: false, _issues: ["Missing Bus Number"], _valid: false,
        });
      });

      const counts = {
        total: routes.length,
        valid: routes.filter((r) => r._valid).length,
        invalid: routes.filter((r) => !r._valid).length,
        existing: routes.filter((r) => r._exists).length,
      };
      setPreview({ routes, counts });
      if (!routes.length) showToast("No rows found in that file.", "error");
    } catch (err) {
      showToast("Could not read that file. Use the sample template format.", "error");
    } finally {
      setParsing(false);
    }
  };

  // ---- Download an error report of invalid / duplicate rows ----
  const downloadErrorReport = async () => {
    if (!preview) return;
    const rowsOut = preview.routes
      .filter((r) => !r._valid || r._exists)
      .map((r) => ({
        "Bus Number": r.busNumber || "(blank)",
        "Starting Location": r.from || "",
        "Destination": r.to || "",
        "Issue": r._issues.length
          ? r._issues.join("; ")
          : (r._exists ? "Already exists" : ""),
      }));
    if (!rowsOut.length) { showToast("No errors or duplicates to report.", "success"); return; }
    try {
      const XLSX = await loadSheetJS();
      const ws = XLSX.utils.json_to_sheet(rowsOut);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Errors");
      XLSX.writeFile(wb, "BusRoutes-Import-Errors.xlsx");
    } catch (e) {
      showToast("Could not generate the error report.", "error");
    }
  };

  // ---- Confirm + send the import ----
  const confirmImport = async () => {
    if (!preview) return;
    const toSend = preview.routes
      .filter((r) => r._valid)
      .map((r) => ({
        busNumber: r.busNumber,
        busName: r.busName,
        from: r.from,
        to: r.to,
        via: r.via,
        distance: r.distance,
        busType: r.busType,
        status: r.status,
        stops: r.stops,
      }));
    if (!toSend.length) { showToast("No valid routes to import. Fix the highlighted rows first.", "error"); return; }
    setImporting(true);
    try {
      const res = await importBusRoutes({ mode, fileName, routes: toSend });
      const d = res.data || {};
      setResult(d);
      showToast(`Imported: ${d.success} of ${d.total} (${d.failed} failed)`, d.failed ? "error" : "success");
      if (onImported) onImported();
      if (showHistory) loadHistory();
    } catch (e) {
      showToast(e.response?.data?.message || "Import failed.", "error");
    } finally {
      setImporting(false);
    }
  };

  const loadHistory = useCallback(() => {
    getBusRouteImportHistory()
      .then((r) => setHistory(r.data || []))
      .catch(() => {});
  }, []);

  const toggleHistory = () => {
    const next = !showHistory;
    setShowHistory(next);
    if (next) loadHistory();
  };

  const badge = (r) => {
    if (!r._valid) return <span className="badge badge-amber" style={{ background: "#fee2e2", color: "#b91c1c" }}>Error</span>;
    if (r._exists) return <span className="badge badge-amber">Exists</span>;
    return <span className="badge badge-green">New</span>;
  };

  return (
    <>
      <button className="btn btn-ghost" onClick={openModal} style={{ marginRight: 8 }}>
        ⬆ Import Bus Routes
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Import Bus Routes (Excel / CSV)"
        width={860}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>Close</button>
            {preview && !result && (
              <button className="btn btn-primary" onClick={confirmImport} disabled={importing || preview.counts.valid === 0}>
                {importing ? <IconLoader size={17} /> : `Import ${preview.counts.valid} route${preview.counts.valid === 1 ? "" : "s"}`}
              </button>
            )}
          </>
        }
      >
        {/* Step 1 — template + upload + mode */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
          <button className="btn btn-ghost btn-sm" onClick={downloadTemplate}>⬇ Download sample template</button>
          <label className="btn btn-primary btn-sm" style={{ cursor: "pointer", margin: 0 }}>
            {parsing ? "Reading…" : "Choose Excel / CSV file"}
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={onFile}
              style={{ display: "none" }}
              disabled={parsing}
            />
          </label>
          {fileName && <span className="muted" style={{ fontSize: "0.82rem" }}>{fileName}</span>}
          <button className="btn btn-ghost btn-sm" onClick={toggleHistory} style={{ marginLeft: "auto" }}>
            {showHistory ? "Hide import history" : "Import history"}
          </button>
        </div>

        <div className="field" style={{ marginBottom: 14 }}>
          <label style={{ fontSize: "0.8rem" }}>Import mode</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: "0.88rem", lineHeight: 1.45 }}>
              <input type="radio" name="impmode" checked={mode === "add"} onChange={() => setMode("add")} style={{ marginTop: 3, flexShrink: 0 }} />
              <span><b>Add New Routes</b> — insert new only; existing routes are skipped (never overwritten)</span>
            </label>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: "0.88rem", lineHeight: 1.45 }}>
              <input type="radio" name="impmode" checked={mode === "update"} onChange={() => setMode("update")} style={{ marginTop: 3, flexShrink: 0 }} />
              <span><b>Update Existing Routes</b> — overwrite matching routes &amp; add any new ones</span>
            </label>
          </div>
        </div>

        {/* Required-columns hint */}
        <div className="muted" style={{ fontSize: "0.76rem", marginBottom: 14, lineHeight: 1.6 }}>
          Columns: {COLUMNS.join(", ")}. Put one row per stop; rows that share the same <b>Bus Number</b> become one route
          (stops ordered by <b>Stop Order</b>). Status accepts Active / Inactive.
        </div>

        {/* Import history */}
        {showHistory && (
          <div className="panel" style={{ marginBottom: 16, padding: 0, overflow: "hidden" }}>
            {history.length === 0 ? (
              <div className="muted" style={{ padding: 14, fontSize: "0.84rem" }}>No imports yet.</div>
            ) : (
              <table className="tm-table" style={{ fontSize: "0.82rem" }}>
                <thead><tr><th>When</th><th>File</th><th>Mode</th><th>Total</th><th>Success</th><th>Failed</th></tr></thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h._id}>
                      <td>{new Date(h.createdAt).toLocaleString()}</td>
                      <td className="mono" style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.fileName || "—"}</td>
                      <td>{h.mode === "update" ? "Update" : "Add"}</td>
                      <td className="mono">{h.total}</td>
                      <td className="mono" style={{ color: "#16a34a" }}>{h.success}</td>
                      <td className="mono" style={{ color: h.failed ? "#b91c1c" : "inherit" }}>{h.failed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Result summary (after import) */}
        {result && (
          <div className="panel" style={{ padding: 14, marginBottom: 16, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Import complete</div>
            <div style={{ fontSize: "0.86rem" }}>
              Total: <b>{result.total}</b> · Added: <b style={{ color: "#16a34a" }}>{result.created}</b> ·
              Updated: <b style={{ color: "#2563eb" }}>{result.updated}</b> ·
              Skipped: <b>{result.skipped}</b> · Failed: <b style={{ color: "#b91c1c" }}>{result.failed}</b>
            </div>
            {Array.isArray(result.errors) && result.errors.length > 0 && (
              <div className="muted" style={{ fontSize: "0.78rem", marginTop: 8 }}>
                {result.errors.slice(0, 8).map((er, i) => (
                  <div key={i}>• {er.busNumber || "(blank)"} — {er.reason}</div>
                ))}
                {result.errors.length > 8 && <div>…and {result.errors.length - 8} more</div>}
              </div>
            )}
          </div>
        )}

        {/* Preview */}
        {preview && !result && (
          <>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: "0.86rem" }}>
                <b>{preview.counts.total}</b> routes ·
                <span style={{ color: "#16a34a" }}> {preview.counts.valid} valid</span> ·
                <span style={{ color: "#b91c1c" }}> {preview.counts.invalid} errors</span> ·
                <span style={{ color: "#b45309" }}> {preview.counts.existing} existing</span>
              </div>
              {(preview.counts.invalid > 0 || preview.counts.existing > 0) && (
                <button className="btn btn-ghost btn-sm" onClick={downloadErrorReport} style={{ marginLeft: "auto" }}>
                  ⬇ Download error report
                </button>
              )}
            </div>

            <div className="panel table-wrap" style={{ maxHeight: 320, overflow: "auto" }}>
              <table className="tm-table" style={{ fontSize: "0.82rem" }}>
                <thead>
                  <tr>
                    <th>Status</th><th>Bus No.</th><th>Bus Name</th><th>From → To</th>
                    <th>Stops</th><th>Type</th><th>Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.routes.map((r, i) => (
                    <tr key={i} style={!r._valid ? { background: "#fef2f2" } : r._exists ? { background: "#fffbeb" } : undefined}>
                      <td>{badge(r)}</td>
                      <td><span className="code-chip">{r.busNumber || "—"}</span></td>
                      <td className="mono" style={{ fontSize: "0.78rem" }}>{r.busName || "—"}</td>
                      <td style={{ fontSize: "0.82rem" }}>
                        <b>{r.from || "—"}</b> <span className="muted">→</span> <b>{r.to || "—"}</b>
                      </td>
                      <td className="mono">{r.stops.length}</td>
                      <td className="mono" style={{ fontSize: "0.78rem" }}>{r.busType || "—"}</td>
                      <td style={{ fontSize: "0.78rem", color: "#b91c1c" }}>
                        {r._issues.join(", ") || (r._exists ? (mode === "add" ? "Will skip (exists)" : "Will update") : "")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Modal>

      <Toast />
    </>
  );
}
