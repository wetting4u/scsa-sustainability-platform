"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Icon, PageHeading, Empty } from "@/components/ui";
import {
  resources,
  type Goal,
  type Resource,
} from "@/features/records/domain";
import { createClient } from "@/lib/supabase/client";
export function GoalCard({
  goal,
  compact = false,
}: {
  goal: Goal;
  compact?: boolean;
}) {
  const [total, setTotal] = useState(0);

useEffect(() => {
  async function loadGoalUsage() {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("usage_records")
      .select("amount")
      .eq("user_id", user.id)
      .eq("resource", goal.resource)
      .gte("start_date", goal.start)
      .lte("end_date", goal.end);

    if (error) {
      console.error(error);
      return;
    }

    const recordedTotal = (data ?? []).reduce(
      (sum, record) => sum + Number(record.amount),
      0,
    );

    setTotal(recordedTotal);
  }

  void loadGoalUsage();
}, [goal.resource, goal.start, goal.end]);

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
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadGoals() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error: loadError } = await supabase
        .from("goals")
        .select("id, title, resource, target, start_date, end_date")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (loadError) {
        console.error(loadError);
        setLoading(false);
        return;
      }

      setGoals(
        (data ?? []).map((goal) => ({
          id: goal.id,
          title: goal.title,
          resource: goal.resource as Resource,
          target: Number(goal.target),
          start: goal.start_date,
          end: goal.end_date,
        })),
      );

      setLoading(false);
    }

    void loadGoals();
  }, []);
  async function handleGoalSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);

  const target = Number(formData.get("target"));
  const start = String(formData.get("start"));
  const end = String(formData.get("end"));
  const title = String(formData.get("title")).trim();
  const resource = formData.get("resource") as Resource;

  if (
    !title ||
    !Number.isFinite(target) ||
    target <= 0 ||
    target > resources[resource].max ||
    end < start
  ) {
    setError(
      "Enter a title, a positive target within the allowed range, and a valid date period.",
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

  const { data, error: insertError } = await supabase
    .from("goals")
    .insert({
      user_id: user.id,
      title,
      resource,
      target,
      start_date: start,
      end_date: end,
    })
    .select("id, title, resource, target, start_date, end_date")
    .single();

  if (insertError) {
    setError(insertError.message);
    return;
  }

  setGoals((currentGoals) => [
    {
      id: data.id,
      title: data.title,
      resource: data.resource as Resource,
      target: Number(data.target),
      start: data.start_date,
      end: data.end_date,
    },
    ...currentGoals,
  ]);

  form.reset();
  setShow(false);
  setError("");
}
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
          <form onSubmit={handleGoalSubmit}>
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
      {loading ? (
        <p>Loading goals...</p>
      ) : (
        !goals.length && <Empty>Your next small step starts with a goal.</Empty>
      )}
    </>
  );
}
