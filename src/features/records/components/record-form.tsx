"use client";
import type { FormEventHandler } from "react";
import { Icon } from "@/components/ui";
import { resources, type Resource, type UsageRecord } from "../domain";

type Props = {
  editing: UsageRecord | null;
  resource: Resource;
  setResource: (resource: Resource) => void;
  error: string;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};
export function RecordForm({
  editing,
  resource,
  setResource,
  error,
  onClose,
  onSubmit,
}: Props) {
  return (
    <section className="panel form-panel">
      <div className="section-title">
        <h2>{editing ? "Edit usage record" : "Log household usage"}</h2>
        <button
          className="icon-button"
          aria-label="Close record form"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <p>
        Enter the amount used during a period, not a cumulative meter reading.
      </p>
      <form key={editing?.id || "new"} onSubmit={onSubmit}>
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
          <button className="button secondary" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
