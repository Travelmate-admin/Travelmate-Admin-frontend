import { Fragment, useEffect, useMemo, useState } from "react";
import { getRides } from "../services/api";
import { useToast } from "../components/Toast";
import { IconSearch, IconLoader, IconCar, IconChevron, IconCheck } from "../components/Icons";
import "../styles/pages.css";

const Avatar = ({ name, photo }) =>
  photo ? <img className="avatar" src={photo} alt={name} />
        : <span className="avatar">{(name || "?").trim()[0]?.toUpperCase() || "?"}</span>;

export default function Rides() {
  const { showToast, Toast } = useToast();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState({}); // expanded rows

  useEffect(() => {
    getRides()
      .then((r) => setRides(r.data))
      .catch((e) => showToast(e.response?.data?.message || "Failed to load rides", "error"))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rides;
    return rides.filter(
      (r) =>
        r.from?.toLowerCase().includes(t) ||
        r.to?.toLowerCase().includes(t) ||
        r.poster?.name?.toLowerCase().includes(t) ||
        r.poster?.phone?.includes(t)
    );
  }, [rides, q]);

  const totalBooked = rides.reduce((s, r) => s + r.bookedCount, 0);
  const totalRode = rides.reduce((s, r) => s + r.rodeCount, 0);

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Rides &amp; Bookings</h2>
          <div className="lead">Every ride posted, who posted it, who booked it, and who actually rode.</div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-top"><span className="stat-label">Rides posted</span>
            <span className="stat-icon" style={{ background: "#22c55e" }}><IconCar size={20} /></span></div>
          <div className="stat-value mono">{rides.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-top"><span className="stat-label">Total booked</span></div>
          <div className="stat-value mono">{totalBooked}</div>
          <div className="stat-sub">passengers who booked</div>
        </div>
        <div className="stat-card">
          <div className="stat-top"><span className="stat-label">Completed (rode)</span>
            <span className="stat-icon" style={{ background: "#6c2bd9" }}><IconCheck size={20} /></span></div>
          <div className="stat-value mono">{totalRode}</div>
          <div className="stat-sub">rides actually taken</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <span className="muted"><IconSearch size={17} /></span>
          <input placeholder="Search route, poster name or phone…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="panel table-wrap">
        {loading ? (
          <div className="loading-wrap"><IconLoader size={28} /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><strong>No rides found</strong>Rides posted in the app will appear here.</div>
        ) : (
          <table className="tm-table">
            <thead>
              <tr>
                <th>Route</th>
                <th>Posted by (driver)</th>
                <th>Date / time</th>
                <th>Booked</th>
                <th>Rode</th>
                <th>Views</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const isOpen = open[r._id];
                return (
                  <Fragment key={r._id}>
                    <tr>
                      <td>
                        <div style={{ fontWeight: 700 }}>{r.from} → {r.to}</div>
                        <div className="muted" style={{ fontSize: "0.76rem" }}>{r.vehicle} · {r.seatsAvailable} seat(s)</div>
                      </td>
                      <td>
                        <div className="user-cell">
                          <Avatar name={r.poster?.name} photo={r.poster?.photo} />
                          <div>
                            <div className="nm">{r.poster?.name}</div>
                            <div className="ph mono">{r.poster?.phone || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="mono" style={{ fontSize: "0.84rem" }}>{r.date}<div className="muted">{r.time}</div></td>
                      <td><span className="badge badge-blue">{r.bookedCount}</span></td>
                      <td><span className="badge badge-green">{r.rodeCount}</span></td>
                      <td className="mono">{r.viewCount}</td>
                      <td>
                        {r.riders.length > 0 ? (
                          <button className="link-btn" onClick={() => setOpen((o) => ({ ...o, [r._id]: !o[r._id] }))}>
                            {isOpen ? "Hide" : "Riders"} <IconChevron size={14} style={{ transform: isOpen ? "rotate(180deg)" : "none", verticalAlign: "-2px" }} />
                          </button>
                        ) : <span className="muted" style={{ fontSize: "0.8rem" }}>—</span>}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="riders-detail">
                        <td colSpan={7}>
                          <div className="riders-inner">
                            <span className="muted" style={{ fontSize: "0.78rem", fontWeight: 700 }}>WHO BOOKED / RODE:</span>
                            <div>
                              {r.riders.map((rd, i) => (
                                <span className="rider-pill" key={i}>
                                  <b>{rd.name}</b>
                                  <span className="mono muted">{rd.phone}</span>
                                  <span className={`badge ${rd.status === "completed" ? "badge-green" : rd.status === "cancelled" ? "badge-red" : "badge-blue"}`}>
                                    {rd.status === "completed" ? "rode" : rd.status}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Toast />
    </div>
  );
}
