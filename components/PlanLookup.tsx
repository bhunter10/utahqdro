"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { User } from "firebase/auth";
import { planEntities, planAccountTypes, type PlanEntry } from "@/lib/plan-directory";

const emptyPlan: Omit<PlanEntry, "id"> = { name: "", administrator: "", entity: "", accountType: "", notes: "", active: true };

export function PlanLookup({ user }: { user: User }) {
  const [plans, setPlans] = useState<PlanEntry[]>([]);
  const [draft, setDraft] = useState<Omit<PlanEntry, "id">>(emptyPlan);
  const [editingId, setEditingId] = useState("");
  const [query, setQuery] = useState("");
  const [entity, setEntity] = useState("");
  const [accountType, setAccountType] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setMessage("");
    async function load() {
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/admin/plans", { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Could not load plans.");
        if (!controller.signal.aborted) setPlans(result.plans);
      } catch (error) {
        if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "Could not load plans.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [user, reload]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/plans", {
        method: "PUT", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, ...(editingId ? { id: editingId } : {}) })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not save plan.");
      setPlans((current) => [...current.filter((plan) => plan.id !== result.plan.id), result.plan].sort((a, b) => a.name.localeCompare(b.name)));
      setDraft(emptyPlan);
      setEditingId("");
      setMessage("Plan saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save plan.");
    } finally { setSaving(false); }
  }

  const search = query.trim().toLowerCase();
  const filtered = plans.filter((plan) => (showInactive || plan.active) && (!entity || plan.entity === entity) && (!accountType || plan.accountType === accountType) && [plan.name, plan.administrator, plan.entity, plan.notes].some((text) => text.toLowerCase().includes(search)));

  return (
    <section className="panel">
      <h2>Plan Lookup</h2>
      <p>Find formal plan names and administrators for the entities and account types offered in the QDRO request form.</p>
      <div className="field-grid">
        <label className="field">Search plans or administrators<input className="input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className="field">Entity / provider<select className="select" value={entity} onChange={(event) => setEntity(event.target.value)}><option value="">All entities</option>{planEntities.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="field">Account type<select className="select" value={accountType} onChange={(event) => setAccountType(event.target.value)}><option value="">All types</option>{planAccountTypes.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} /> Include inactive plans</label>
      </div>
      <p role="status" aria-live="polite">{loading ? "Loading plans…" : message}</p>
      <button type="button" className="button secondary" disabled={loading || saving} onClick={() => setReload((value) => value + 1)}>Refresh plans</button>
      {!loading && <>
        <p>{filtered.length} matching plans</p>
        {plans.length === 0 ? <p>No verified plans have been added yet. Add a formal plan name and administrator below.</p> : filtered.length === 0 ? <p>No plans match these filters.</p> : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-request-table">
              <caption>Plan names and administrators</caption>
              <thead><tr>{["Formal plan name", "Entity / provider", "Account type", "Administrator", "Status", "Actions"].map((heading) => <th key={heading} scope="col">{heading}</th>)}</tr></thead>
              <tbody>{filtered.map((plan) => <tr key={plan.id}>
                <td>{plan.name}{plan.notes && <p>{plan.notes}</p>}</td><td>{plan.entity}</td><td>{plan.accountType}</td><td>{plan.administrator}</td><td>{plan.active ? "Active" : "Inactive"}</td>
                <td><button type="button" className="button secondary" disabled={saving} aria-label={`Edit ${plan.name}`} onClick={() => { setEditingId(plan.id); setDraft(plan); setMessage(""); }}>Edit</button></td>
              </tr>)}</tbody>
            </table>
          </div>
        )}
      </>}
      <form onSubmit={save} style={{ marginTop: 32 }}>
        <h3>{editingId ? "Edit plan" : "Add plan"}</h3>
        <p>Use the formal name and administrator from verified plan documents. A provider may differ from the plan administrator.</p>
        <fieldset disabled={saving || loading} style={{ border: 0, padding: 0 }}>
          <div className="field-grid">
            <label className="field">Formal plan name<input className="input" required maxLength={300} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
            <label className="field">Plan administrator<input className="input" required maxLength={300} value={draft.administrator} onChange={(event) => setDraft({ ...draft, administrator: event.target.value })} /></label>
            <label className="field">Entity / provider<select className="select" required value={draft.entity} onChange={(event) => setDraft({ ...draft, entity: event.target.value })}><option value="">Select entity</option>{planEntities.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label className="field">Account type<select className="select" required value={draft.accountType} onChange={(event) => setDraft({ ...draft, accountType: event.target.value })}><option value="">Select type</option>{planAccountTypes.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label className="field full-width">Notes / alternate names<textarea className="textarea" maxLength={3000} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></label>
            <label><input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} /> Currently offered</label>
          </div>
          <div className="nav-actions" style={{ marginTop: 16 }}>
            <button className="button primary" type="submit">{saving ? "Saving…" : "Save plan"}</button>
            {editingId && <button className="button secondary" type="button" onClick={() => { setEditingId(""); setDraft(emptyPlan); }}>Cancel edit</button>}
          </div>
        </fieldset>
      </form>
    </section>
  );
}
