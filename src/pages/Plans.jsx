import { useEffect, useState } from "react";
import { getPricing, updatePricing } from "../services/api";
import { useToast } from "../components/Toast";
import { IconLoader } from "../components/Icons";
import "../styles/pages.css";

const PLAN_KEYS = [
  { key: "daily", label: "Daily Plan" },
  { key: "monthly", label: "Monthly Plan" },
  { key: "yearly", label: "Yearly Plan" },
];

export default function Plans() {
  const { showToast, Toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  const load = () => {
    setLoading(true);
    getPricing()
      .then((r) => setForm(r.data))
      .catch((e) => showToast(e.response?.data?.message || "Failed to load pricing", "error"))
      .finally(() => setLoading(false));
  };
  useEffect(load, []); // eslint-disable-line

  const setPlan = (key, field, value) =>
    setForm((f) => ({ ...f, plans: { ...f.plans, [key]: { ...f.plans[key], [field]: value } } }));
  const setFind = (field, value) =>
    setForm((f) => ({ ...f, findRide: { ...f.findRide, [field]: value } }));

  const save = async () => {
    const payload = {
      plans: {
        daily:   { price: Number(form.plans.daily.price),   durationDays: Number(form.plans.daily.durationDays) },
        monthly: { price: Number(form.plans.monthly.price), durationDays: Number(form.plans.monthly.durationDays) },
        yearly:  { price: Number(form.plans.yearly.price),  durationDays: Number(form.plans.yearly.durationDays) },
      },
      findRide: {
        unlockFee: Number(form.findRide.unlockFee),
        processingFee: Number(form.findRide.processingFee),
      },
    };
    const allNums = [
      payload.plans.daily.price, payload.plans.daily.durationDays,
      payload.plans.monthly.price, payload.plans.monthly.durationDays,
      payload.plans.yearly.price, payload.plans.yearly.durationDays,
      payload.findRide.unlockFee, payload.findRide.processingFee,
    ];
    if (allNums.some((n) => !Number.isFinite(n) || n < 0)) {
      showToast("All values must be a number 0 or greater", "error");
      return;
    }
    setSaving(true);
    try {
      await updatePricing(payload);
      showToast("Pricing saved — changes are live on the website", "success");
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to update pricing", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return <div className="loading-wrap"><IconLoader size={28} /></div>;
  }

  const findTotal = Number(form.findRide.unlockFee) + Number(form.findRide.processingFee);

  return (
    <div>
      <Toast />
      <div className="page-head">
        <div>
          <div className="lead">
            Set the amounts charged on the TravelMate website. Changes apply live —
            users see the new price on their next page load.
          </div>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? <IconLoader size={17} /> : "Save changes"}
        </button>
      </div>

      {/* Post-ride plans */}
      <div className="panel" style={{ padding: 20, marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 4px" }}>Post-ride plans</h3>
        <div className="muted" style={{ fontSize: "0.82rem", marginBottom: 16 }}>
          Subscription prices on the "Choose your plan" page used to post rides.
        </div>
        {PLAN_KEYS.map(({ key, label }) => (
          <div className="field-row" key={key} style={{ alignItems: "flex-end" }}>
            <div className="field">
              <label>{label} — price (₹)</label>
              <input type="number" min="0" value={form.plans[key].price}
                onChange={(e) => setPlan(key, "price", e.target.value)} />
            </div>
            <div className="field">
              <label>Duration (days)</label>
              <input type="number" min="0" value={form.plans[key].durationDays}
                onChange={(e) => setPlan(key, "durationDays", e.target.value)} />
            </div>
          </div>
        ))}
      </div>

      {/* Find-ride */}
      <div className="panel" style={{ padding: 20 }}>
        <h3 style={{ margin: "0 0 4px" }}>Find-ride (Unlock Contact)</h3>
        <div className="muted" style={{ fontSize: "0.82rem", marginBottom: 16 }}>
          Fee charged when a user unlocks a rider's contact. Total paid = Unlock fee + Processing fee.
        </div>
        <div className="field-row" style={{ alignItems: "flex-end" }}>
          <div className="field">
            <label>Unlock fee (₹)</label>
            <input type="number" min="0" value={form.findRide.unlockFee}
              onChange={(e) => setFind("unlockFee", e.target.value)} />
          </div>
          <div className="field">
            <label>Processing fee (₹)</label>
            <input type="number" min="0" value={form.findRide.processingFee}
              onChange={(e) => setFind("processingFee", e.target.value)} />
          </div>
        </div>
        <div className="muted" style={{ fontSize: "0.82rem", marginTop: 8 }}>
          Users will pay <b>₹{Number.isFinite(findTotal) ? findTotal : "—"}</b> total to unlock a contact.
        </div>
      </div>
    </div>
  );
}
