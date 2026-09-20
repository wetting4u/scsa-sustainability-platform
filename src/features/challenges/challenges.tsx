"use client";
import { useEffect, useState } from "react";
import { Icon, PageHeading } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import {
  resources,
  totalFor,
  type Resource,
  type UsageRecord,
} from "@/features/records/domain";
type Challenge = {
  id: string;
  title: string;
  description: string;
  resource: Resource;
  target: number;
  start: string;
  end: string;
  tag: string;
  icon: string;
  duration: string;
};

export function Challenges() {
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [joined, setJoined] = useState<string[]>([]);
  const [membershipError, setMembershipError] = useState("");
  const [changing, setChanging] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function loadChallenges() {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("challenges")
      .select(
        "id, title, description, resource, target, start_date, end_date, tag, icon",
      )
      .order("start_date", { ascending: true });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setChallenges(
      (data ?? []).map((challenge) => {
        const days =
          Math.round(
            (Date.parse(challenge.end_date) -
              Date.parse(challenge.start_date)) /
              86400000,
          ) + 1;

        return {
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          resource: challenge.resource as Resource,
          target: Number(challenge.target),
          start: challenge.start_date,
          end: challenge.end_date,
          tag: challenge.tag,
          icon: challenge.icon,
          duration: `${days} days`,
        };
      }),
    );

    setLoading(false);
  }

  void loadChallenges();
}, []);
useEffect(() => {
  async function loadMemberships() {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("challenge_memberships")
      .select("challenge_id")
      .eq("user_id", user.id);

    if (error) {
      setMembershipError(error.message);
      return;
    }

    setJoined((data ?? []).map((membership) => membership.challenge_id));
  }

  void loadMemberships();
}, []);
useEffect(() => {
  async function loadRecords() {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("usage_records")
      .select("id, resource, start_date, end_date, amount")
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      return;
    }

    setRecords(
      (data ?? []).map((record) => ({
        id: record.id,
        resource: record.resource as Resource,
        start: record.start_date,
        end: record.end_date,
        amount: Number(record.amount),
      })),
    );
  }

  void loadRecords();
}, []);
useEffect(() => {
  async function loadRecords() {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("usage_records")
      .select("id, resource, start_date, end_date, amount")
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      return;
    }

    setRecords(
      (data ?? []).map((record) => ({
        id: record.id,
        resource: record.resource as Resource,
        start: record.start_date,
        end: record.end_date,
        amount: Number(record.amount),
      })),
    );
  }

  void loadRecords();
}, []);
async function toggleChallenge(challengeId: string, active: boolean) {
  setChanging(challengeId);
  setMembershipError("");

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    setMembershipError("Please sign in again.");
    setChanging(null);
    return;
  }

  const result = active
    ? await supabase
        .from("challenge_memberships")
        .delete()
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId)
    : await supabase.from("challenge_memberships").insert({
        user_id: user.id,
        challenge_id: challengeId,
      });

  if (result.error) {
    setMembershipError(result.error.message);
    setChanging(null);
    return;
  }

  setJoined((current) =>
    active
      ? current.filter((id) => id !== challengeId)
      : [...current, challengeId],
  );

  setChanging(null);
}
  return (
    <>
      <PageHeading
        eyebrow="BETTER HABITS START SMALL"
        title="A challenge worth taking."
        description="Choose a small commitment. See what your household can do."
      />
      <div className="welcome-banner challenge-banner">
        <div>
          <span className="eyebrow">PROGRESS OVER PERFECTION</span>
          <h2>
            Little changes.
            <br />
            Lasting habits.
          </h2>
          <p>
            Join a challenge at your own pace.
            <br />
            Your participation stays private unless you choose to share.
          </p>
        </div>
        <div className="challenge-emblem">
          <Icon name="sprout" size={100} />
        </div>
      </div>
      {membershipError && (
      <p role="alert" className="error">
      {membershipError}
      </p>
      )}
      <div className="section-title">
        <h2>Explore challenges</h2>
        <span>
          {joined.length} joined ·{" "}
          {loading ? "Loading challenges..." : `${challenges.length} available`}
        </span>
      </div>
      <div className="three-grid">
        {challenges.map((c) => {
          const active = joined.includes(c.id);
          return (
            <article className="panel challenge-card" key={c.id}>
              <div className={`challenge-art ${c.resource}`}>
                <Icon name={c.icon as "sprout" | "bolt" | "drop"} size={66} />
                <span>{c.duration}</span>
              </div>
              <div className="eyebrow">{c.tag}</div>
              <h2>{c.title}</h2>
              <p>{c.description}</p>
              <button
                className="text-link"
                onClick={() => setDetail(detail === c.id ? null : c.id)}
                aria-expanded={detail === c.id}
              >
                {detail === c.id ? "Hide details" : "See challenge details"}{" "}
                <Icon name="arrow" size={16} />
              </button>
              {detail === c.id && (
                <div className="challenge-details">
                  <strong>
                    {c.start} — {c.end}
                  </strong>
                  <p>
                    Log {resources[c.resource].label.toLowerCase()} usage for
                    this period. Suggested limit: {c.target.toLocaleString()}{" "}
                    {resources[c.resource].unit}.
                  </p>
                  <p>
                    Recorded so far:{" "}
                    {totalFor(
                      records,
                      c.resource,
                      c.start,
                      c.end,
                    ).toLocaleString()}{" "}
                    {resources[c.resource].unit}. Completion requires
                    full-period data; automatic verification is a future
                    feature.
                  </p>
                  <small>Illustrative challenge and badge criteria.</small>
                </div>
              )}
              <button
                className={`button ${active ? "secondary" : "primary"} full`}
                onClick={() => void toggleChallenge(c.id, active)}
                disabled={changing === c.id}
              >
                {active ? (
                  <>
                    <Icon name="check" size={17} />
                    Joined · Leave challenge
                  </>
                ) : (
                  <>
                    Join challenge <Icon name="plus" size={17} />
                  </>
                )}
              </button>
            </article>
          );
        })}
      </div>
    </>
  );
}
