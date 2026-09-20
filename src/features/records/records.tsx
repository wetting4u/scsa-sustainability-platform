"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Icon, PageHeading, Empty } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import {
  resources,
  validateRecord,
  type Resource,
  type UsageRecord,
} from "./domain";
import { RecordForm } from "./components/record-form";
import { RecordTable } from "./components/record-table";

export function Records() {
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<UsageRecord | null>(null);
  const [show, setShow] = useState(false);
  const [resource, setResource] = useState<Resource>("electricity");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  async function loadRecords() {
  setLoading(true);

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    setError("Please sign in again.");
    setLoading(false);
    return;
  }

  const { data, error: loadError } = await supabase
    .from("usage_records")
    .select("id, resource, start_date, end_date, amount")
    .eq("user_id", user.id)
    .order("end_date", { ascending: false });

  if (loadError) {
    setError(loadError.message);
  } else {
    setRecords(
      (data ?? []).map((row) => ({
        id: row.id,
        resource: row.resource as Resource,
        start: row.start_date,
        end: row.end_date,
        amount: Number(row.amount),
      })),
    );
  }

  setLoading(false);
}
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("new")) setShow(true);
    const r = q.get("resource");
    if (r && r in resources) setFilter(r);
  }, []);
  useEffect(() => {
  void loadRecords();
}, []);
  function open(record?: UsageRecord) {
    setEditing(record || null);
    setResource(record?.resource || "electricity");
    setError("");
    setShow(true);
  }
  async function handleRecordSubmit(
  event: FormEvent<HTMLFormElement>,
) {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);

  const record = {
    resource,
    start: String(formData.get("start")),
    end: String(formData.get("end")),
    amount: Number(formData.get("amount")),
  };

  const invalid = validateRecord(record);

  if (invalid) {
    setError(invalid);
    return;
  }

  const overlaps = records.some(
    (existingRecord) =>
      existingRecord.id !== editing?.id &&
      existingRecord.resource === resource &&
      existingRecord.start <= record.end &&
      existingRecord.end >= record.start,
  );

  if (overlaps) {
    setError(
      "This period overlaps an existing record for this resource. Edit the existing record or choose another period.",
    );
    return;
  }

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    setError("Please sign in again.");
    return;
  }

  if (editing) {
    const { error: updateError } = await supabase
      .from("usage_records")
      .update({
        resource: record.resource,
        start_date: record.start,
        end_date: record.end,
        amount: record.amount,
      })
      .eq("id", editing.id)
      .eq("user_id", user.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }
  } else {
    const { error: insertError } = await supabase
      .from("usage_records")
      .insert({
        user_id: user.id,
        resource: record.resource,
        start_date: record.start,
        end_date: record.end,
        amount: record.amount,
      });

    if (insertError) {
      setError(insertError.message);
      return;
    }
  }

  await loadRecords();

  setShow(false);
  setEditing(null);
  setError("");
  setMessage(
    editing
      ? "Record updated. Your summary is up to date."
      : "Record added. Your summary is up to date.",
  );
}

async function handleDelete(id: string) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    setMessage("Please sign in again.");
    setDeleting(null);
    return;
  }

  const { error: deleteError } = await supabase
    .from("usage_records")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (deleteError) {
    setMessage(deleteError.message);
    setDeleting(null);
    return;
  }

  await loadRecords();
  setDeleting(null);
  setMessage("Record deleted.");
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
        Your household usage records are securely stored in your account.
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
        onSubmit={handleRecordSubmit}
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
        {loading ? (
          <p>Loading records...</p>
        ) : visible.length ? (
          <RecordTable
            visible={visible}
            open={open}
            deleting={deleting}
            setDeleting={setDeleting}
            onDelete={(id) => {
            void handleDelete(id);
          }}
          />
        ) : (
          <Empty>No records yet. Add your first household usage entry.</Empty>
        )}
      </section>
    </>
  );
}
