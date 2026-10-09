"use client";
import { PeriodPicker } from "@/components/period-picker";

import { useEffect, useState, type FormEvent } from "react";

import { Empty, Icon, PageHeading } from "@/components/ui";
import { recordsApi } from "@/features/records/client";
import {
  resources,
  type Goal,
  type Resource,
  type UsageRecord,
} from "@/features/records/domain";
import { goalsApi } from "./client";

function calculateGoalUsage(goal: Goal, records: UsageRecord[]) {
  return records
    .filter(
      (record) =>
        record.resource === goal.resource &&
        record.start >= goal.start &&
        record.end <= goal.end,
    )
    .reduce((sum, record) => sum + record.amount, 0);
}

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
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (usageRecords !== undefined) {
      setTotal(calculateGoalUsage(goal, usageRecords));
      return;
    }

    let cancelled = false;

    async function loadGoalUsage() {
      try {
        const result = await recordsApi.list();

        if (!cancelled) {
          setTotal(calculateGoalUsage(goal, result.data));
        }
      } catch (requestError) {
        console.error(requestError);

        if (!cancelled) {
          setTotal(0);
        }
      }
    }

    void loadGoalUsage();

    return () => {
      cancelled = true;
    };
  }, [goal, usageRecords]);

  const percent = goal.target > 0 ? Math.round((total / goal.target) * 100) : 0;

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
          {total.toLocaleString()} / {goal.target.toLocaleString()}{" "}
          {resources[goal.resource].unit}
        </strong>
        <span>{percent}% used</span>
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
            {percent > 100
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
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
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
        const [goalsResult, recordsResult] = await Promise.all([
          goalsApi.list(),
          recordsApi.list(),
        ]);

        setGoals(goalsResult.data);
        setUsageRecords(recordsResult.data);
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
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save the goal.",
      );
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
          <button className="button primary" onClick={() => openForm()}>
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

              <PeriodPicker
                scope="goal"
                existing={
                  editing
                    ? { start: editing.start, end: editing.end }
                    : undefined
                }
              />
            </div>

            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}

            <div className="form-actions">
              <button className="button primary" type="submit">
                {editing ? "Save changes" : "Save goal"}
              </button>

              <button
                className="button secondary"
                type="button"
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
              usageRecords={usageRecords}
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
