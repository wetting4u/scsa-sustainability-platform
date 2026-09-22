"use client";

import { useEffect, useState } from "react";

import { Icon, PageHeading } from "@/components/ui";
import {
  resources,
  totalFor,
  type UsageRecord,
} from "@/features/records/domain";
import { recordsApi } from "@/features/records/client";
import { challengesApi } from "./client";
import type { Challenge } from "./domain";

export function Challenges() {
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [joined, setJoined] = useState<string[]>([]);
  const [membershipError, setMembershipError] = useState("");
  const [changing, setChanging] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChallengePage() {
      setLoading(true);
      setMembershipError("");

      try {
        const [challengesResult, membershipsResult, recordsResult] =
          await Promise.all([
            challengesApi.list(),
            challengesApi.memberships(),
            recordsApi.list(),
          ]);

        setChallenges(challengesResult.data);
        setJoined(membershipsResult.data);
        setRecords(recordsResult.data);
      } catch (error) {
        setMembershipError(
          error instanceof Error ? error.message : "Unable to load challenges.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadChallengePage();
  }, []);

  async function toggleChallenge(challengeId: string, active: boolean) {
    if (changing) return;
    setChanging(challengeId);
    setMembershipError("");

    try {
      if (active) {
        await challengesApi.leave(challengeId);

        setJoined((current) => current.filter((id) => id !== challengeId));
      } else {
        await challengesApi.join(challengeId);

        setJoined((current) =>
          current.includes(challengeId) ? current : [...current, challengeId],
        );
      }
    } catch (error) {
      setMembershipError(
        error instanceof Error
          ? error.message
          : "Unable to update challenge membership.",
      );
    } finally {
      setChanging(null);
    }
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
        {challenges.map((challenge) => {
          const active = joined.includes(challenge.id);

          return (
            <article className="panel challenge-card" key={challenge.id}>
              <div className={`challenge-art ${challenge.resource}`}>
                <Icon
                  name={challenge.icon as "sprout" | "bolt" | "drop"}
                  size={66}
                />

                <span>{challenge.duration}</span>
              </div>

              <div className="eyebrow">{challenge.tag}</div>

              <h2>{challenge.title}</h2>

              <p>{challenge.description}</p>

              <button
                className="text-link"
                onClick={() =>
                  setDetail(detail === challenge.id ? null : challenge.id)
                }
                aria-expanded={detail === challenge.id}
              >
                {detail === challenge.id
                  ? "Hide details"
                  : "See challenge details"}{" "}
                <Icon name="arrow" size={16} />
              </button>

              {detail === challenge.id && (
                <div className="challenge-details">
                  <strong>
                    {challenge.start} — {challenge.end}
                  </strong>

                  <p>
                    Log {resources[challenge.resource].label.toLowerCase()}{" "}
                    usage for this period. Suggested limit:{" "}
                    {challenge.target.toLocaleString()}{" "}
                    {resources[challenge.resource].unit}.
                  </p>

                  <p>
                    Recorded so far:{" "}
                    {totalFor(
                      records,
                      challenge.resource,
                      challenge.start,
                      challenge.end,
                    ).toLocaleString()}{" "}
                    {resources[challenge.resource].unit}. Completion requires
                    full-period data; automatic verification is a future
                    feature.
                  </p>

                  <small>Illustrative challenge and badge criteria.</small>
                </div>
              )}

              <button
                className={`button ${active ? "secondary" : "primary"} full`}
                onClick={() => void toggleChallenge(challenge.id, active)}
                disabled={changing !== null}
              >
                {changing === challenge.id ? (
                  "Updating..."
                ) : active ? (
                  <>
                    <Icon name="check" size={17} />
                    Joined · Leave challenge
                  </>
                ) : (
                  <>
                    Join challenge
                    <Icon name="plus" size={17} />
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
