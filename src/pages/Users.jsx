import { useEffect, useMemo, useState } from "react";
import { getUsers, blockUser, unblockUser } from "../services/api";
import Modal from "../components/Modal";
import { useToast } from "../components/Toast";
import { IconSearch, IconLoader, IconBan, IconCheck } from "../components/Icons";
import "../styles/pages.css";

const Avatar = ({ name, photo }) =>
  photo ? <img className="avatar" src={photo} alt={name} />
        : <span className="avatar">{(name || "?").trim()[0]?.toUpperCase() || "?"}</span>;

export default function Users() {
  const { showToast, Toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const [blockTarget, setBlockTarget] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    getUsers()
      .then((r) => setUsers(r.data))
      .catch((e) => showToast(e.response?.data?.message || "Failed to load users", "error"))
      .finally(() => setLoading(false));
  };
  useEffect(load, []); // eslint-disable-line

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return users.filter((u) => {
      if (tab === "blocked" && !u.isBlocked) return false;
      if (tab === "active" && u.isBlocked) return false;
      if (!t) return true;
      return (
        (u.fullName || "").toLowerCase().includes(t) ||
        (u.phone || "").includes(t) ||
        (u.city || "").toLowerCase().includes(t) ||
        (u.email || "").toLowerCase().includes(t)
      );
    });
  }, [users, q, tab]);

  const blockedCount = users.filter((u) => u.isBlocked).length;

  const confirmBlock = async () => {
    setBusy(true);
    try {
      await blockUser(blockTarget.phone, reason || "Blocked by admin");
      showToast("User blocked");
      setUsers((list) => list.map((u) => (u.phone === blockTarget.phone ? { ...u, isBlocked: true, blockReason: reason } : u)));
      setBlockTarget(null); setReason("");
    } catch (e) {
      showToast(e.response?.data?.message || "Failed", "error");
    } finally { setBusy(false); }
  };

  const doUnblock = async (u) => {
    try {
      await unblockUser(u.phone);
      showToast("User unblocked");
      setUsers((list) => list.map((x) => (x.phone === u.phone ? { ...x, isBlocked: false, blockReason: "" } : x)));
    } catch (e) {
      showToast(e.response?.data?.message || "Failed", "error");
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Users</h2>
          <div className="lead">All registered users. Block or unblock anyone directly.</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="filter-tabs">
          <button className={`filter-tab ${tab === "all" ? "active" : ""}`} onClick={() => setTab("all")}>All ({users.length})</button>
          <button className={`filter-tab ${tab === "active" ? "active" : ""}`} onClick={() => setTab("active")}>Active</button>
          <button className={`filter-tab ${tab === "blocked" ? "active" : ""}`} onClick={() => setTab("blocked")}>Blocked ({blockedCount})</button>
        </div>
        <div className="spacer" />
        <div className="search-box">
          <span className="muted"><IconSearch size={17} /></span>
          <input placeholder="Search name, phone, city…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="panel table-wrap">
        {loading ? (
          <div className="loading-wrap"><IconLoader size={28} /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><strong>No users found</strong>Try a different search or filter.</div>
        ) : (
          <table className="tm-table">
            <thead>
              <tr><th>User</th><th>City</th><th>Email</th><th>Joined</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u._id || u.phone}>
                  <td>
                    <div className="user-cell">
                      <Avatar name={u.fullName} photo={u.photo} />
                      <div>
                        <div className="nm">{u.fullName || "Unnamed user"}</div>
                        <div className="ph mono">{u.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td>{u.city || "—"}</td>
                  <td className="muted" style={{ fontSize: "0.84rem" }}>{u.email || "—"}</td>
                  <td className="mono" style={{ fontSize: "0.82rem" }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</td>
                  <td>
                    {u.isBlocked
                      ? <span className="badge badge-red" title={u.blockReason}>Blocked</span>
                      : <span className="badge badge-green">Active</span>}
                  </td>
                  <td>
                    {u.isBlocked
                      ? <button className="btn btn-ghost btn-sm" onClick={() => doUnblock(u)}><IconCheck size={15} /> Unblock</button>
                      : <button className="btn btn-danger btn-sm" onClick={() => { setBlockTarget(u); setReason(""); }}><IconBan size={15} /> Block</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={!!blockTarget}
        onClose={() => setBlockTarget(null)}
        title="Block this user?"
        width={440}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setBlockTarget(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={confirmBlock} disabled={busy}>
              {busy ? <IconLoader size={16} /> : <><IconBan size={16} /> Block</>}
            </button>
          </>
        }
      >
        {blockTarget && (
          <div>
            <div className="user-cell" style={{ marginBottom: 16, padding: 12, background: "var(--surface-2)", borderRadius: "var(--r-md)" }}>
              <Avatar name={blockTarget.fullName} photo={blockTarget.photo} />
              <div>
                <div className="nm">{blockTarget.fullName || "Unnamed"}</div>
                <div className="ph mono">{blockTarget.phone}</div>
              </div>
            </div>
            <div className="field">
              <label>Reason (optional)</label>
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Spam / abusive behaviour" />
            </div>
          </div>
        )}
      </Modal>

      <Toast />
    </div>
  );
}
