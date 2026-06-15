import { useEffect, useState } from "react";
import { getReports, resolveReport, blockFromReport } from "../services/api";
import Modal from "../components/Modal";
import { useToast } from "../components/Toast";
import { IconLoader, IconBan, IconCheck, IconFlag } from "../components/Icons";
import "../styles/pages.css";

const FILTERS = [
  { key: "pending", label: "Pending" },
  { key: "actioned", label: "Blocked" },
  { key: "resolved", label: "Resolved" },
  { key: "", label: "All" },
];

const Avatar = ({ name }) => <span className="avatar">{(name || "?").trim()[0]?.toUpperCase() || "?"}</span>;

export default function Reports() {
  const { showToast, Toast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [blockTarget, setBlockTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = (f = filter) => {
    setLoading(true);
    getReports(f)
      .then((r) => setReports(r.data))
      .catch((e) => showToast(e.response?.data?.message || "Failed to load reports", "error"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(filter); }, [filter]); // eslint-disable-line

  const onResolve = async (rep) => {
    try {
      await resolveReport(rep._id);
      showToast("Report marked resolved");
      load();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed", "error");
    }
  };

  const doBlock = async () => {
    if (!blockTarget) return;
    setBusy(true);
    try {
      await blockFromReport(blockTarget._id, blockTarget.reason);
      showToast(`${blockTarget.reportedName || blockTarget.reportedPhone} blocked permanently`);
      setBlockTarget(null);
      load();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to block user", "error");
    } finally {
      setBusy(false);
    }
  };

  const pendingCount = reports.filter((r) => r.status === "pending").length;

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>User Reports</h2>
          <div className="lead">Review reports filed by users, read the reason, then block the offender if needed.</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="filter-tabs">
          {FILTERS.map((f) => (
            <button key={f.key} className={`filter-tab ${filter === f.key ? "active" : ""}`} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        {filter === "pending" && pendingCount > 0 && (
          <span className="badge badge-amber">{pendingCount} awaiting review</span>
        )}
      </div>

      {loading ? (
        <div className="loading-wrap"><IconLoader size={28} /></div>
      ) : reports.length === 0 ? (
        <div className="empty-state panel">
          <IconFlag size={34} style={{ color: "var(--text-muted)", marginBottom: 8 }} />
          <strong>No reports here</strong>
          {filter === "pending" ? "Nothing waiting on you — all clear." : "Nothing to show for this filter."}
        </div>
      ) : (
        <div className="report-list">
          {reports.map((rep) => (
            <div className={`report-card ${rep.status}`} key={rep._id}>
              <div className="report-row">
                <div className="report-vs">
                  <div className="user-cell">
                    <Avatar name={rep.reporterName || "?"} />
                    <div>
                      <div className="nm">{rep.reporterName || "Unknown"}</div>
                      <div className="ph mono">{rep.reporterPhone}</div>
                    </div>
                  </div>
                  <span className="report-arrow">reported →</span>
                  <div className="user-cell">
                    <Avatar name={rep.reportedName || "?"} />
                    <div>
                      <div className="nm">
                        {rep.reportedName || "Unknown"}
                        {rep.reportedUserBlocked && <span className="badge badge-red" style={{ marginLeft: 8 }}>Blocked</span>}
                      </div>
                      <div className="ph mono">{rep.reportedPhone}</div>
                    </div>
                  </div>
                </div>
                <div className="report-meta">{new Date(rep.createdAt).toLocaleString()}</div>
              </div>

              <div className="report-reason">
                <span className="rtag">{rep.reason}</span>
                {rep.description && <span>— {rep.description}</span>}
              </div>

              {rep.status === "pending" ? (
                <div className="report-actions">
                  <button className="btn btn-danger btn-sm" onClick={() => setBlockTarget(rep)} disabled={rep.reportedUserBlocked}>
                    <IconBan size={15} /> {rep.reportedUserBlocked ? "Already blocked" : "Block user permanently"}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => onResolve(rep)}>
                    <IconCheck size={15} /> Dismiss (no action)
                  </button>
                </div>
              ) : (
                <div className="report-actions">
                  <span className={`badge ${rep.status === "actioned" ? "badge-red" : "badge-green"}`}>
                    {rep.status === "actioned" ? "User blocked" : "Resolved — no action"}
                  </span>
                  {rep.adminNote && <span className="muted" style={{ fontSize: "0.8rem" }}>{rep.adminNote}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!blockTarget}
        onClose={() => setBlockTarget(null)}
        title="Block user permanently?"
        width={440}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setBlockTarget(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={doBlock} disabled={busy}>
              {busy ? <IconLoader size={16} /> : <><IconBan size={16} /> Block permanently</>}
            </button>
          </>
        }
      >
        {blockTarget && (
          <div style={{ fontSize: "0.92rem", color: "var(--text-secondary)" }}>
            <p>You’re about to permanently block:</p>
            <div className="user-cell" style={{ margin: "14px 0", padding: "12px", background: "var(--surface-2)", borderRadius: "var(--r-md)" }}>
              <Avatar name={blockTarget.reportedName || "?"} />
              <div>
                <div className="nm">{blockTarget.reportedName || "Unknown user"}</div>
                <div className="ph mono">{blockTarget.reportedPhone}</div>
              </div>
            </div>
            <p>Reason on file: <b style={{ color: "var(--red)" }}>{blockTarget.reason}</b></p>
            <p style={{ marginTop: 10 }}>The user will be marked <code>isBlocked</code> in the database. You can reverse this from the Users page.</p>
          </div>
        )}
      </Modal>

      <Toast />
    </div>
  );
}
