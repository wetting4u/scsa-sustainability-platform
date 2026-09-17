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
import { RecordForm } from "./components/record-form";
import { RecordTable } from "./components/record-table";

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
        <RecordForm
          editing={editing}
          resource={resource}
          setResource={setResource}
          error={error}
          onClose={() => setShow(false)}
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
              setRecords([...records, { ...record, id: crypto.randomUUID() }]);
            setShow(false);
            setMessage(
              editing
                ? "Record updated. Your summary is up to date."
                : "Record added. Your summary is up to date.",
            );
          }}
        />
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
          <RecordTable
            visible={visible}
            open={open}
            deleting={deleting}
            setDeleting={setDeleting}
            onDelete={(id) => {
              setRecords(records.filter((record) => record.id !== id));
              setDeleting(null);
              setMessage("Record deleted.");
            }}
          />
        ) : (
          <Empty>No records yet. Add your first household usage entry.</Empty>
        )}
      </section>
    </>
  );
}
