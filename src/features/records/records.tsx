"use client";
import { useEffect, useState } from "react";
import { Icon, PageHeading, Empty } from "@/components/ui";
import { useDemo } from "@/features/demo/provider";
import {
  resources,
  validateRecord,
  type Resource,
  type UsageRecord,
} from "./domain";
export function Records() {
  const { records, setRecords } = useDemo();
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<UsageRecord | null>(null);
  const [show, setShow] = useState(false);
  const [resource, setResource] = useState<Resource>("electricity");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("new")) setShow(true);
    const r = q.get("resource");
    if (r && r in resources) setFilter(r);
  }, []);
  function open(record?: UsageRecord) {
    setEditing(record || null);
    setResource(record?.resource || "electricity");
    setError("");
    setShow(true);
  }
  const visible = records
    .filter((r) => filter === "all" || r.resource === filter)
    .toSorted((a, b) => b.end.localeCompare(a.end));
  return (
    <>
      <PageHeading
        eyebrow="NOTICE MORE. WASTE LESS."
        title="Your household, recorded."
        description="Keep water, electricity and waste in one simple place."
        action={
          <button className="button primary" onClick={() => open()}>
            <Icon name="plus" />
            Add record
          </button>
        }
      />
      <div className="notice">
        <Icon name="shield" />
        Demo records stay in this browser session. Refreshing resets your
        changes. No data is sent to a database.
      </div>
      <div role="status" className={message ? "success" : ""}>
        {message}
      </div>
      {show && (
        <section className="panel form-panel">
          <div className="section-title">
            <h2>{editing ? "Edit usage record" : "Log household usage"}</h2>
            <button
              className="icon-button"
              aria-label="Close record form"
              onClick={() => setShow(false)}
            >
              <Icon name="close" />
            </button>
          </div>
          <p>
            Enter the amount used during a period, not a cumulative meter
            reading.
          </p>
          <form
            key={editing?.id || "new"}
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const record = {
                resource,
                start: String(f.get("start")),
                end: String(f.get("end")),
                amount: Number(f.get("amount")),
              };
              const invalid = validateRecord(record);
              if (invalid) {
                setError(invalid);
                return;
              }
              if (
                records.some(
                  (r) =>
                    r.id !== editing?.id &&
                    r.resource === resource &&
                    r.start <= record.end &&
                    r.end >= record.start,
                )
              ) {
                setError(
                  "This period overlaps an existing record for this resource. Edit the existing record or choose another period.",
                );
                return;
              }
              if (editing)
                setRecords(
                  records.map((r) =>
                    r.id === editing.id ? { ...record, id: r.id } : r,
                  ),
                );
              else
                setRecords([
                  ...records,
                  { ...record, id: crypto.randomUUID() },
                ]);
              setShow(false);
              setMessage(
                editing
                  ? "Record updated. Your summary is up to date."
                  : "Record added. Your summary is up to date.",
              );
            }}
          >
            <div className="form-grid">
              <label>
                Resource
                <select
                  value={resource}
                  onChange={(e) => setResource(e.target.value as Resource)}
                >
                  {Object.entries(resources).map(([k, v]) => (
                    <option value={k} key={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Amount used ({resources[resource].unit})
                <input
                  name="amount"
                  type="number"
                  required
                  min="0"
                  max={resources[resource].max}
                  step="0.01"
                  defaultValue={editing?.amount}
                  placeholder="0.00"
                />
              </label>
              <label>
                Period start
                <input
                  name="start"
                  type="date"
                  required
                  defaultValue={editing?.start || "2026-09-15"}
                />
              </label>
              <label>
                Period end
                <input
                  name="end"
                  type="date"
                  required
                  defaultValue={editing?.end || "2026-09-21"}
                />
              </label>
            </div>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions">
              <button className="button primary" type="submit">
                {editing ? "Save changes" : "Save record"}
              </button>
              <button
                className="button secondary"
                type="button"
                onClick={() => setShow(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}
      <section className="panel">
        <div className="section-title">
          <div>
            <h2>Record history</h2>
            <p>{visible.length} entries · All recorded periods</p>
          </div>
          <label className="filter-label">
            Resource
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All resources</option>
              {Object.entries(resources).map(([k, v]) => (
                <option value={k} key={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {visible.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Period</th>
                  <th>Usage</th>
                  <th>Source</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className={`tag ${r.resource}`}>
                        {resources[r.resource].label}
                      </span>
                    </td>
                    <td>
                      {r.start} <span className="muted">to</span> {r.end}
                    </td>
                    <td>
                      <strong>{r.amount.toLocaleString()}</strong>{" "}
                      {resources[r.resource].unit}
                    </td>
                    <td>
                      <span className="muted">Manual entry</span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          aria-label={`Edit ${resources[r.resource].label} ${r.start}`}
                          onClick={() => open(r)}
                        >
                          <Icon name="edit" size={17} />
                        </button>
                        <button
                          className="icon-button"
                          aria-label={`Delete ${resources[r.resource].label} ${r.start}`}
                          onClick={() => setDeleting(r.id)}
                        >
                          <Icon name="delete" size={17} />
                        </button>
                        {deleting === r.id && (
                          <span className="delete-confirm">
                            Delete?
                            <button
                              onClick={() => {
                                setRecords(
                                  records.filter((x) => x.id !== r.id),
                                );
                                setDeleting(null);
                                setMessage("Record deleted.");
                              }}
                            >
                              Yes
                            </button>
                            <button onClick={() => setDeleting(null)}>
                              Cancel
                            </button>
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>No records yet. Add your first household usage entry.</Empty>
        )}
      </section>
    </>
  );
}
