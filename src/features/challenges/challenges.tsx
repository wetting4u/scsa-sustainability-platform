"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { Icon, PageHeading } from "@/components/ui";
import {
  resources,
  totalFor,
  type UsageRecord,
} from "@/features/records/domain";
import { recordsApi } from "@/features/records/client";
import { challengesApi } from "./client";
import styles from "./challenges.module.css";
import { adelaideToday } from "@/lib/periods";
import type { Challenge } from "./domain";
import { evaluateChallengeProgress } from "./progress";
import { ChallengeProgress } from "./challenge-progress";

export function Challenges() {
  const [refresh, setRefresh] = useState(0);
  const [today, setToday] = useState(adelaideToday);
  const [rewards, setRewards] = useState<
    { challenge_id: string; points: number }[]
  >([]);
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [joined, setJoined] = useState<string[]>([]);
  const [membershipError, setMembershipError] = useState("");
  const [changing, setChanging] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadChallengePage() {
      setLoading(true);
      setLoadFailed(false);
      setMembershipError("");

      try {
        const [
          challengesResult,
          membershipsResult,
          recordsResult,
          rewardsResult,
        ] = await Promise.all([
          challengesApi.list(),
          challengesApi.memberships(),
          recordsApi.list(),
          challengesApi.rewards(),
        ]);

        if (!active) return;
        setToday(adelaideToday());
        setChallenges(challengesResult.data);
        setJoined(membershipsResult.data);
        setRecords(recordsResult.data);
        setRewards(rewardsResult.data);
      } catch (error) {
        if (!active) return;
        setLoadFailed(true);
        setMembershipError(
          error instanceof Error ? error.message : "Unable to load challenges.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadChallengePage();
    return () => {
      active = false;
    };
  }, [refresh]);

  useEffect(() => {
    const update = () => {
      if (!document.hidden) setRefresh((value) => value + 1);
    };
    document.addEventListener("visibilitychange", update);
    const timer = window.setInterval(() => setToday(adelaideToday()), 60000);
    return () => {
      document.removeEventListener("visibilitychange", update);
      window.clearInterval(timer);
    };
  }, []);

  async function toggleChallenge(challengeId: string, active: boolean) {
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

  async function claimPoints(id: string) {
    setChanging(id);
    setMembershipError("");
    try {
      const result = await challengesApi.claim(id);
      setRewards((current) => [
        ...current.filter((r) => r.challenge_id !== id),
        { challenge_id: id, points: result.data.points },
      ]);
    } catch (error) {
      setMembershipError(
        error instanceof Error ? error.message : "Unable to claim points.",
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

      <div className={styles.exploreHeader}>
        <div className={styles.exploreTitle}>
          <h2>Explore challenges</h2>
          <button
            type="button"
            className={styles.refreshButton}
            aria-label={
              loading
                ? "Refreshing challenge progress"
                : "Refresh challenge progress"
            }
            title="Refresh progress"
            disabled={loading || changing !== null}
            onClick={() => setRefresh((value) => value + 1)}
          >
            <RefreshCw
              size={19}
              aria-hidden="true"
              className={loading ? styles.refreshing : undefined}
            />
          </button>
        </div>
        <span className={styles.challengeCount} role="status">
          {joined.length} joined ·{" "}
          {loading ? "Loading challenges..." : `${challenges.length} available`}
        </span>
      </div>

      {!loading && !membershipError && challenges.length === 0 && (
        <p className="caption">No challenges are available right now.</p>
      )}
      <div className="three-grid">
        {!loading &&
          !loadFailed &&
          challenges.map((challenge) => {
            const active = joined.includes(challenge.id);
            const reward = rewards.find((r) => r.challenge_id === challenge.id);
            const ended = challenge.end < today;
            const progress = evaluateChallengeProgress(
              challenge,
              records,
              reward,
              today,
            );

            return (
              <article className="panel challenge-card" key={challenge.id}>
                <div className={`challenge-art ${challenge.resource}`}>
                  <Icon
                    name={challenge.icon as "sprout" | "bolt" | "drop"}
                    size={66}
                  />
                </div>

                <div className="eyebrow">{challenge.tag}</div>

                <h2>{challenge.title}</h2>

                <div className={styles.summary}>
                  <strong>
                    {challenge.rewardPoints == null
                      ? "Points not configured"
                      : `${challenge.rewardPoints.toLocaleString()} points`}
                  </strong>{" "}
                  · {resources[challenge.resource].label}
                  <span>
                    {challenge.start} — {challenge.end}
                  </span>
                </div>
                {(active || reward) && (
                  <ChallengeProgress
                    challenge={challenge}
                    progress={progress}
                  />
                )}

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
                    <p>{challenge.description}</p>
                    <strong>
                      {challenge.start} — {challenge.end}
                    </strong>

                    <p>
                      Log {resources[challenge.resource].label.toLowerCase()}{" "}
                      usage for this period. Usage limit:{" "}
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
                      full-period data and usage at or below the limit. Claim
                      points after the challenge ends.
                    </p>

                    <small>
                      Only records fully inside the challenge period count.
                      Points are awarded once and retained as a snapshot.
                    </small>
                  </div>
                )}

                {active && progress.canClaim && !reward && (
                  <button
                    className="button primary full"
                    disabled={
                      changing !== null || challenge.rewardPoints == null
                    }
                    onClick={() => void claimPoints(challenge.id)}
                  >
                    {changing === challenge.id
                      ? "Checking..."
                      : `Claim ${challenge.rewardPoints?.toLocaleString()} points`}
                  </button>
                )}
                <button
                  className={`button ${active ? "secondary" : "primary"} full`}
                  onClick={() => void toggleChallenge(challenge.id, active)}
                  disabled={
                    loading ||
                    changing !== null ||
                    Boolean(reward) ||
                    (!active && ended)
                  }
                >
                  {changing === challenge.id ? (
                    "Updating..."
                  ) : reward ? (
                    "Completed"
                  ) : !active && ended ? (
                    "Challenge ended"
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
