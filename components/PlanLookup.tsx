"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { User } from "firebase/auth";
import { planEntities, planAccountTypes, offeredPlans, mergeOfferedPlans, matchedPlanTemplate, planSavePayload, type PlanEntry } from "@/lib/plan-directory";

const emptyPlan: Omit<PlanEntry, "id"> = { name: "", administrator: "", entity: "", accountType: "", notes: "", active: true };

export function PlanLookup({ user }: { user: User }) {
  const [plans, setPlans] = useState<PlanEntry[]>(offeredPlans);
  const [draft, setDraft] = useState<Omit<PlanEntry, "id">>(emptyPlan);
  const [editingId, setEditingId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingInModal, setEditingInModal] = useState(false);
  const editDialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const searchDialog = useRef<HTMLDialogElement>(null);
  const detailDialog = useRef<HTMLDialogElement>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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
        if (!controller.signal.aborted) setPlans(mergeOfferedPlans(result.plans));
      } catch (error) {
        if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "Could not load plans.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [user]);

  useEffect(() => {
    if (showForm && editingInModal) editDialog.current?.showModal();
    else editDialog.current?.close();
  }, [showForm, editingInModal]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/plans", {
        method: "PUT", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(planSavePayload(draft, editingId))
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not save plan.");
      setPlans((current) => [...current.filter((plan) => plan.id !== result.plan.id && !(plan.id.startsWith("offered-") && plan.entity === result.plan.entity && plan.accountType === result.plan.accountType)), result.plan].sort((a, b) => a.name.localeCompare(b.name)));
      setDraft(emptyPlan);
      setEditingId("");
      setShowForm(false);
      setMessage("Plan saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save plan.");
    } finally { setSaving(false); }
  }

  const search = query.trim().toLowerCase();
  const alphabeticalPlans = [...plans].sort((a, b) => (a.name || a.entity).localeCompare(b.name || b.entity, "en", { sensitivity: "base" }) || a.accountType.localeCompare(b.accountType));
  const filtered = alphabeticalPlans.filter((plan) => [plan.name, plan.administrator, plan.entity, plan.accountType, plan.notes].some((text) => text.toLowerCase().includes(search)));

  function planList(entries: PlanEntry[]) {
    return (
      <ul className="plan-list">
        {entries.map((plan) => (
          <li key={plan.id}>
            <button className="plan-list-link" type="button" aria-haspopup="dialog" onClick={() => { setSelectedPlan(plan); searchDialog.current?.close(); detailDialog.current?.showModal(); }}>
              {plan.name || plan.entity}{plan.accountType && <span className="plan-list-account"> · {plan.accountType}</span>}
            </button>
          </li>
        ))}
      </ul>
    );
  }

  const planForm = (
        <form id="plan-form" onSubmit={save} style={{ marginTop: 24, marginBottom: 24 }}>
          <h3 id="plan-form-title">{editingInModal ? "Edit plan" : "Add plan"}</h3>
          {editingInModal && message && <p role="status" aria-live="polite">{message}</p>}
          <p>Use the formal name and administrator from verified plan documents. A provider may differ from the plan administrator.</p>
          <fieldset disabled={saving || loading} style={{ border: 0, padding: 0 }}>
            <div className="field-grid">
              <label className="field">Formal plan name<input className="input" autoFocus required maxLength={300} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
              <label className="field">Plan administrator<textarea className="textarea" required maxLength={300} value={draft.administrator} onChange={(event) => setDraft({ ...draft, administrator: event.target.value })} /></label>
              <label className="field">Entity / provider<select className="select" required value={draft.entity} onChange={(event) => setDraft({ ...draft, entity: event.target.value })}><option value="">Select entity</option>{planEntities.map((value) => <option key={value}>{value}</option>)}</select></label>
              <label className="field">Account type<select className="select" required value={draft.accountType} onChange={(event) => setDraft({ ...draft, accountType: event.target.value })}><option value="">Select type</option>{planAccountTypes.map((value) => <option key={value}>{value}</option>)}</select></label>
              <label className="field full-width">Notes / alternate names<textarea className="textarea" maxLength={3000} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></label>
              <label><input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} /> Currently offered</label>
            </div>
            <div className="nav-actions" style={{ marginTop: 16 }}>
              <button className="button primary" type="submit">{saving ? "Saving…" : "Save plan"}</button>
              <button className="button secondary" type="button" onClick={() => { setEditingId(""); setDraft(emptyPlan); setShowForm(false); setMessage(""); }}>Cancel</button>
            </div>
          </fieldset>
        </form>
  );

  return (
    <section className="panel">
      <div className="section-head">
        <h2>Plan Lookup</h2>
        <div className="nav-actions">
          <button type="button" className="button secondary" aria-label="Search plans" aria-haspopup="dialog" disabled={loading} onClick={() => searchDialog.current?.showModal()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
          </button>
          {!showForm && <button type="button" className="button primary" disabled={loading} aria-expanded={showForm} aria-controls="plan-form" onClick={() => { setDraft(emptyPlan); setEditingId(""); setMessage(""); setEditingInModal(false); setShowForm(true); }}>Add plan</button>}
        </div>
      </div>
      {(loading || message) && <p role="status" aria-live="polite">{loading ? "Loading plans…" : message}</p>}
      {showForm && !editingInModal && planForm}
      <dialog ref={editDialog} className="plan-search-dialog" aria-labelledby="plan-form-title" onCancel={(event) => { if (saving) event.preventDefault(); }} onClose={() => { setShowForm(false); setEditingInModal(false); setEditingId(""); setDraft(emptyPlan); }}>
        {showForm && editingInModal && planForm}
      </dialog>
      {!loading && (alphabeticalPlans.length > 0 ? planList(alphabeticalPlans) : <p>No plans added yet.</p>)}
      <dialog ref={searchDialog} className="plan-search-dialog" aria-labelledby="plan-search-title" onClick={(event) => { if (event.target === event.currentTarget) searchDialog.current?.close(); }}>
        <div className="section-head">
          <h2 id="plan-search-title">Plan search</h2>
          <button type="button" className="button secondary" onClick={() => searchDialog.current?.close()}>Close</button>
        </div>
        <label className="field">Search plans<input className="input" type="search" autoFocus placeholder="Plan name, administrator, or provider" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <p role="status">{filtered.length} {filtered.length === 1 ? "matching plan" : "matching plans"}</p>
        {plans.length === 0 ? <p>No plans have been added yet. Close this window and select “Add plan” to get started.</p> : filtered.length === 0 ? <p>No plans match your search. Try another name or provider.</p> : (
          planList(filtered)
        )}
      </dialog>
      <dialog ref={detailDialog} className="plan-search-dialog" aria-labelledby="plan-detail-title" onClick={(event) => { if (event.target === event.currentTarget) detailDialog.current?.close(); }}>
        <div className="section-head">
          <h2 id="plan-detail-title">Plan details</h2>
          <button type="button" className="button secondary" onClick={() => detailDialog.current?.close()}>Close</button>
        </div>
        {selectedPlan && <>
          <dl className="plan-details">
            <dt>Plan name</dt><dd>{selectedPlan.name || "Not recorded yet"}</dd>
            <dt>Plan administrator</dt><dd style={{ whiteSpace: "pre-line" }}>{selectedPlan.administrator || "Not recorded yet"}</dd>
            {selectedPlan.notes && <><dt>Notes / alternate names</dt><dd style={{ whiteSpace: "pre-line" }}>{selectedPlan.notes}</dd></>}
            <dt>QDRO template</dt><dd>{matchedPlanTemplate(selectedPlan).name}</dd>
          </dl>
          <button type="button" className="button secondary" disabled={saving} onClick={() => { detailDialog.current?.close(); setEditingId(selectedPlan.id.startsWith("offered-") ? "" : selectedPlan.id); setDraft({ ...selectedPlan, accountType: planAccountTypes.includes(selectedPlan.accountType) ? selectedPlan.accountType : "" }); setMessage(""); setEditingInModal(true); setShowForm(true); }}>Edit plan</button>
        </>}
      </dialog>
    </section>
  );
}
