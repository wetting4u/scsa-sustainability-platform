"use client";

import { useEffect, useState, type FormEvent } from "react";

import { Empty, Icon, PageHeading } from "@/components/ui";
import { goalUsage } from "./domain";
import {
  resources,
  type Goal,
  type Resource,
  type UsageRecord,
} from "@/features/records/domain";
import { goalsApi } from "./client";

export function GoalCard({
  goal,
  compact = false,
  usageRecords,
  onEdit,
  onDelete,
  deleting = false,
}: {
  goal: Goal;
  compact?: boolean;
  usageRecords?: UsageRecord[];
  onEdit?: (goal: Goal) => void;
  onDelete?: (id: string) => void;
  deleting?: boolean;
}) {
  const usage =
    goal.usage ??
    (usageRecords === undefined ? undefined : goalUsage(goal, usageRecords));
  const total = usage?.amount ?? 0;
  const percent =
    usage?.percentUsed == null ? 0 : Math.round(usage.percentUsed);
  const hasRecords = usage?.hasRecords === true;
  return (
    <article className={compact ? "goal-card compact" : "panel goal-card"}>
      <div className="goal-meta">
        <span className={`tag ${goal.resource}`}>
          {resources[goal.resource].label}
        </span>
        <span>Usage limit</span>
      </div>

      <h3>{goal.title}</h3>

      <p>
        Stay within {goal.target.toLocaleString()}{" "}
        {resources[goal.resource].unit}
      </p>

      <div className="progress-label">
        <strong>
          {hasRecords ? total.toLocaleString() : "—"} /{" "}
          {goal.target.toLocaleString()} {resources[goal.resource].unit}
        </strong>
        <span>{hasRecords ? `${percent}% used` : "No records"}</span>
      </div>

      <div className="progress-track">
        <div
          className={percent > 100 ? "over" : ""}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>

      <small>
        {goal.start} — {goal.end}
      </small>

      {!compact && (
        <>
          <p className="caption">
            {!usage
              ? "Usage unavailable."
              : !hasRecords
                ? "No records in this period. Completion is not confirmed."
                : percent > 100
                  ? "Recorded usage exceeds this limit."
                  : "Below the limit so far. Incomplete records do not confirm savings."}
          </p>

          {(onEdit || onDelete) && (
            <div className="form-actions">
              {onEdit && (
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => onEdit(goal)}
                >
                  Edit
                </button>
              )}

              {onDelete && (
                <button
                  className="button secondary"
                  type="button"
                  disabled={deleting}
                  onClick={() => onDelete(goal.id)}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </article>
  );
}

export function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pageError, setPageError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadPageData() {
      setLoading(true);
      setPageError("");

      try {
        const goalsResult = await goalsApi.list();
        setGoals(goalsResult.data);
      } catch (requestError) {
        setPageError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load goals.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadPageData();
  }, []);

  function openForm(goal?: Goal) {
    setEditing(goal ?? null);
    setError("");
    setMessage("");
    setShow(true);
  }

  function closeForm() {
    setShow(false);
    setEditing(null);
    setError("");
  }

  async function handleGoalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const formData = new FormData(event.currentTarget);
    const resourceValue = String(formData.get("resource"));

    if (!Object.prototype.hasOwnProperty.call(resources, resourceValue)) {
      setError("Choose a valid resource.");
      return;
    }

    const goal: Omit<Goal, "id"> = {
      title: String(formData.get("title")).trim(),
      resource: resourceValue as Resource,
      target: Number(formData.get("target")),
      start: String(formData.get("start")),
      end: String(formData.get("end")),
    };

    if (
      !goal.title ||
      goal.title.length > 80 ||
      !Number.isFinite(goal.target) ||
      goal.target <= 0 ||
      goal.target > resources[goal.resource].max ||
      !goal.start ||
      !goal.end ||
      goal.end < goal.start
    ) {
      setError(
        "Enter a title, a positive target within the allowed range, and a valid date period.",
      );
      return;
    }

    setError("");
    setPageError("");
    setMessage("");

    setSaving(true);
    try {
      if (editing) {
        const result = await goalsApi.update(editing.id, goal);

        setGoals((currentGoals) =>
          currentGoals.map((currentGoal) =>
            currentGoal.id === editing.id ? result.data : currentGoal,
          ),
        );

        setMessage("Goal updated.");
      } else {
        const result = await goalsApi.create(goal);

        setGoals((currentGoals) => [result.data, ...currentGoals]);

        setMessage("Goal created.");
      }

      closeForm();
      try {
        const refreshed = await goalsApi.list();
        setGoals(refreshed.data);
      } catch {
        setPageError(
          "Goal saved, but usage could not be refreshed. Reload to try again.",
        );
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save the goal.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this goal?",
    );

    if (!confirmed) {
      return;
    }

    setDeleting(id);
    setPageError("");
    setMessage("");

    try {
      await goalsApi.remove(id);

      setGoals((currentGoals) => currentGoals.filter((goal) => goal.id !== id));

      setMessage("Goal deleted.");
    } catch (requestError) {
      setPageError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete the goal.",
      );
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="GIVE YOUR SMALL STEPS A DIRECTION"
        title="Goals with purpose."
        description="Choose a manageable household limit and follow your progress."
        action={
          <button
            className="button primary"
            disabled={saving}
            onClick={() => openForm()}
          >
            <Icon name="plus" />
            Create goal
          </button>
        }
      />

      <div className="notice">
        <Icon name="goals" />
        Goals track recorded usage against a limit. They do not verify
        reductions or award savings automatically.
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
        <section className="panel form-panel">
          <h2>{editing ? "Edit goal" : "Create a household goal"}</h2>

          <form key={editing?.id ?? "new-goal"} onSubmit={handleGoalSubmit}>
            <div className="form-grid">
              <label>
                Goal name
                <input
                  name="title"
                  required
                  maxLength={80}
                  defaultValue={editing?.title ?? ""}
                  placeholder="Keep our weekly bin lighter"
                />
              </label>

              <label>
                Resource
                <select
                  name="resource"
                  defaultValue={editing?.resource ?? "electricity"}
                >
                  {Object.entries(resources).map(([key, value]) => (
                    <option value={key} key={key}>
                      {value.label} ({value.unit})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Maximum usage
                <input
                  name="target"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  defaultValue={editing?.target}
                />
              </label>

              <label>
                Start date
                <input
                  name="start"
                  type="date"
                  defaultValue={editing?.start ?? "2026-09-01"}
                  required
                />
              </label>

              <label>
                End date
                <input
                  name="end"
                  type="date"
                  defaultValue={editing?.end ?? "2026-09-30"}
                  required
                />
              </label>
            </div>

            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}

            <div className="form-actions">
              <button
                className="button primary"
                type="submit"
                disabled={saving}
              >
                {saving ? "Saving..." : editing ? "Save changes" : "Save goal"}
              </button>

              <button
                className="button secondary"
                type="button"
                disabled={saving}
                onClick={closeForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="section-title">
        <h2>My goals</h2>
        <span>{goals.length} personal commitments</span>
      </div>

      {loading ? (
        <p>Loading goals...</p>
      ) : goals.length ? (
        <div className="two-grid">
          {goals.map((goal) => (
            <GoalCard
              goal={goal}

              key={goal.id}
              onEdit={openForm}
              onDelete={(id) => {
                void handleDelete(id);
              }}
              deleting={deleting === goal.id}
            />
          ))}
        </div>
      ) : (
        <Empty>Your next small step starts with a goal.</Empty>
      )}
    </>
  );
}
