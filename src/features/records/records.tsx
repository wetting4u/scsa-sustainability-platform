"use client";

import { useEffect, useState, type FormEvent } from "react";

import { Empty, Icon, PageHeading } from "@/components/ui";
import { recordsApi } from "./client";
import { RecordForm } from "./components/record-form";
import { RecordTable } from "./components/record-table";
import {
  resources,
  validateRecord,
  type Resource,
  type UsageRecord,
} from "./domain";

export function Records() {
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<UsageRecord | null>(null);
  const [show, setShow] = useState(false);
  const [resource, setResource] = useState<Resource>("electricity");
  const [error, setError] = useState("");
  const [pageError, setPageError] = useState("");
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  async function loadRecords() {
    setLoading(true);
    setPageError("");

    try {
      const result = await recordsApi.list();
      setRecords(result.data);
    } catch (requestError) {
      setPageError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load usage records.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);

    if (query.get("new")) {
      setShow(true);
    }

    const selectedResource = query.get("resource");

    if (selectedResource && selectedResource in resources) {
      setFilter(selectedResource);
    }
  }, []);

  useEffect(() => {
    void loadRecords();
  }, []);

  function open(record?: UsageRecord) {
    setEditing(record ?? null);
    setResource(record?.resource ?? "electricity");
    setError("");
    setMessage("");
    setShow(true);
  }

  function closeForm() {
    setShow(false);
    setEditing(null);
    setError("");
  }

  async function handleRecordSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const record: Omit<UsageRecord, "id"> = {
      resource,
      start: String(formData.get("start")),
      end: String(formData.get("end")),
      amount: Number(formData.get("amount")),
    };

    const validationError = validateRecord(record);

    if (validationError) {
      setError(validationError);
      return;
    }

    const overlaps = records.some(
      (existingRecord) =>
        existingRecord.id !== editing?.id &&
        existingRecord.resource === record.resource &&
        existingRecord.start <= record.end &&
        existingRecord.end >= record.start,
    );

    if (overlaps) {
      setError(
        "This period overlaps an existing record for this resource. Edit the existing record or choose another period.",
      );
      return;
    }

    setError("");
    setPageError("");
    setMessage("");

    try {
      if (editing) {
        const result = await recordsApi.update(editing.id, record);

        setRecords((currentRecords) =>
          currentRecords.map((currentRecord) =>
            currentRecord.id === editing.id
              ? result.data
              : currentRecord,
          ),
        );

        setMessage("Record updated. Your summary is up to date.");
      } else {
        const result = await recordsApi.create(record);

        setRecords((currentRecords) => [
          result.data,
          ...currentRecords,
        ]);

        setMessage("Record added. Your summary is up to date.");
      }

      closeForm();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save the usage record.",
      );
    }
  }

  async function handleDelete(id: string) {
    setPageError("");
    setMessage("");

    try {
      await recordsApi.remove(id);

      setRecords((currentRecords) =>
        currentRecords.filter((record) => record.id !== id),
      );

      setMessage("Record deleted.");
    } catch (requestError) {
      setPageError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete the usage record.",
      );
    } finally {
      setDeleting(null);
    }
  }

  const visible = records
    .filter((record) => filter === "all" || record.resource === filter)
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

      {pageError && (
        <p className="error" role="alert">
          {pageError}
        </p>
      )}

      {message && (
        <p className="success" role="status">
          {message}
        </p>
      )}

      {show && (
        <RecordForm
          editing={editing}
          resource={resource}
          setResource={setResource}
          error={error}
          onClose={closeForm}
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
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">All resources</option>

              {Object.entries(resources).map(([key, value]) => (
                <option value={key} key={key}>
                  {value.label}
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