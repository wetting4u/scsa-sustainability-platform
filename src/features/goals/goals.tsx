"use client";
import { useState } from "react";
import { Icon, PageHeading, Empty } from "@/components/ui";
import { useDemo } from "@/features/demo/provider";
import {
  resources,
  totalFor,
  type Goal,
  type Resource,
} from "@/features/records/domain";
export function GoalCard({
  goal,
  compact = false,
}: {
  goal: Goal;
  compact?: boolean;
}) {
  const { records } = useDemo();
  const total = totalFor(records, goal.resource, goal.start, goal.end);
  const percent = Math.round((total / goal.target) * 100);
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
        <p className="caption">
          {percent > 100
            ? "Recorded usage exceeds this limit."
            : "Below the limit so far. Incomplete records do not confirm savings."}
        </p>
      )}
    </article>
  );
}
export function Goals() {
  const { goals, setGoals } = useDemo();
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <PageHeading
        eyebrow="GIVE YOUR SMALL STEPS A DIRECTION"
        title="Goals with purpose."
        description="Choose a manageable household limit and follow your progress."
        action={
          <button className="button primary" onClick={() => setShow(!show)}>
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
      {show && (
        <section className="panel form-panel">
          <h2>Create a household goal</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const target = Number(f.get("target"));
              const start = String(f.get("start"));
              const end = String(f.get("end"));
              const title = String(f.get("title")).trim();
              const resource = f.get("resource") as Resource;
              if (
                !title ||
                !Number.isFinite(target) ||
                target <= 0 ||
                target > resources[resource].max ||
                end < start
              ) {
                setError(
                  "Enter a title, a positive target within the demo range, and a valid date period.",
                );
                return;
              }
              setGoals([
                ...goals,
                {
                  id: crypto.randomUUID(),
                  title,
                  resource,
                  target,
                  start,
                  end,
                },
              ]);
              setShow(false);
              setError("");
            }}
          >
            <div className="form-grid">
              <label>
                Goal name
                <input
                  name="title"
                  required
                  maxLength={80}
                  placeholder="Keep our weekly bin lighter"
                />
              </label>
              <label>
                Resource
                <select name="resource">
                  {Object.entries(resources).map(([k, v]) => (
                    <option value={k} key={k}>
                      {v.label} ({v.unit})
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
                />
              </label>
              <label>
                Start date
                <input
                  name="start"
                  type="date"
                  defaultValue="2026-09-01"
                  required
                />
              </label>
              <label>
                End date
                <input
                  name="end"
                  type="date"
                  defaultValue="2026-09-30"
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
              <button className="button primary" type="submit">
                Save goal
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
      <div className="section-title">
        <h2>My goals</h2>
        <span>{goals.length} personal commitments</span>
      </div>
      <div className="two-grid">
        {goals.map((g) => (
          <GoalCard goal={g} key={g.id} />
        ))}
      </div>
      {!goals.length && <Empty>Your next small step starts with a goal.</Empty>}
    </>
  );
}
