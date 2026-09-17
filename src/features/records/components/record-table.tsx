"use client";
import { Icon } from "@/components/ui";
import { resources, type UsageRecord } from "../domain";

type Props = {
  visible: UsageRecord[];
  open: (record: UsageRecord) => void;
  deleting: string | null;
  setDeleting: (id: string | null) => void;
  onDelete: (id: string) => void;
};
export function RecordTable({
  visible,
  open,
  deleting,
  setDeleting,
  onDelete,
}: Props) {
  return (
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
                      <button onClick={() => onDelete(r.id)}>Yes</button>
                      <button onClick={() => setDeleting(null)}>Cancel</button>
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
