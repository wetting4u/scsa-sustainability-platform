"use client";

import Link from "next/link";
import styles from "./community.module.css";
import { useEffect, useState } from "react";

import { PageHeading, Icon } from "@/components/ui";
import { profileApi } from "@/features/privacy/client";
import { createClient } from "@/lib/supabase/client";

type PeriodType = "weekly" | "monthly";

type CommunityStatistics = {
  community_area_id: string;
  period_type: PeriodType;
  period_start: string;
  period_end: string;
  total_households: number | null;
  total_records: number | null;
  total_participations: number | null;
  is_suppressed: boolean;
};
type LeaderboardEntry = {
  resource: "electricity" | "water" | "waste";
  isMe: boolean;
  rank: number;
  pseudonym: string;
  points: number;
};

export function Community() {
  const [myEntries, setMyEntries] = useState<LeaderboardEntry[]>([]);
  const [sharingEnabled, setSharingEnabled] = useState(false);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [rankingError, setRankingError] = useState("");
  const [periodType, setPeriodType] = useState<PeriodType>("weekly");
  const [statistics, setStatistics] = useState<CommunityStatistics | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsCommunityArea, setNeedsCommunityArea] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadStatistics() {
      setLoading(true);
      setEntries([]);
      setMyEntries([]);
      setRankingError("");
      setError("");
      setNeedsCommunityArea(false);

      try {
        const { data: profile } = await profileApi.get();

        if (!profile.communityAreaId) {
          if (active) {
            setStatistics(null);
            setNeedsCommunityArea(true);
          }
          return;
        }

        const supabase = createClient();

        const { data, error: statisticsError } = await supabase.rpc(
          "get_community_statistics",
          {
            p_community_area_id: profile.communityAreaId,
            p_period_type: periodType,
          },
        );

        if (statisticsError) {
          throw statisticsError;
        }

        const result = Array.isArray(data) ? data[0] : data;

        if (!result) {
          throw new Error("Community statistics are unavailable.");
        }

        if (active) {
          setStatistics(result as CommunityStatistics);
        }
        try {
          const response = await fetch(
            `/api/community/leaderboard?period=${periodType}`,
            { cache: "no-store" },
          );
          const payload = await response.json();
          if (!response.ok)
            throw new Error(
              payload.error?.message ?? "Unable to load rankings.",
            );
          if (active) {
            setEntries(payload.data.entries);
            setMyEntries(payload.data.myEntries);
            setSharingEnabled(payload.data.sharingEnabled);
          }
        } catch (rankingFailure) {
          if (active)
            setRankingError(
              rankingFailure instanceof Error
                ? rankingFailure.message
                : "Unable to load rankings.",
            );
        }
      } catch (loadError) {
        console.error(loadError);

        if (active) {
          setStatistics(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load Community statistics.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadStatistics();

    return () => {
      active = false;
    };
  }, [periodType]);

  const cards = [
    {
      label: "Participating households",
      description: "Households currently sharing community analytics.",
      value: statistics?.total_households,
    },
    {
      label: "Usage records contributed",
      description: "Records whose usage dates overlap this period.",
      value: statistics?.total_records,
    },
    {
      label: "Challenge participations",
      description: "New challenge joins during this period, not completions.",
      value: statistics?.total_participations,
    },
  ];

  return (
    <>
      <PageHeading
        eyebrow="SMALL STEPS. SHARED FUTURE."
        title="Together makes a difference."
        description="A glimpse of what a more mindful community can look like."
      />

      <section className="welcome-banner">
        <div>
          <span className="eyebrow">SOUTH AUSTRALIA, GROWING TOGETHER</span>

          <h2>
            Many households.
            <br />
            One shared future.
          </h2>

          <p>
            Community reporting brings consenting households together,
            <br />
            showing shared progress while keeping individual records private.
          </p>
        </div>

        <div className="challenge-emblem">
          <Icon name="community" size={95} />
        </div>
      </section>

      <section className="panel">
        <div className="section-title">
          <div>
            <h2>Community statistics</h2>
            <p className="caption">
              Aggregated statistics for your current Community Area.
            </p>
          </div>

          <label>
            Period
            <select
              value={periodType}
              onChange={(event) =>
                setPeriodType(event.target.value as PeriodType)
              }
              disabled={loading}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
        </div>

        {needsCommunityArea && (
          <div className="notice">
            Select your Community Area in Settings before viewing Community
            statistics.{" "}
            <Link href="/settings" className="text-link">
              Open Settings
            </Link>
          </div>
        )}

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {!needsCommunityArea && !error && (
          <>
            <div className="stats-grid">
              {cards.map((card) => {
                let displayedValue = "—";

                if (!loading && statistics) {
                  displayedValue = statistics.is_suppressed
                    ? "Hidden"
                    : String(card.value ?? 0);
                }

                return (
                  <article className="stat-card" key={card.label}>
                    <div className="eyebrow">COMMUNITY DATA</div>

                    <div className="stat-value">
                      {loading ? "..." : displayedValue}
                    </div>

                    <p>{card.label}</p>
                    <p className={styles.statHelp}>{card.description}</p>
                  </article>
                );
              })}
            </div>
            <section aria-label="Resource leaderboards">
              <h3>
                {periodType === "weekly" ? "Weekly" : "Monthly"} resource
                leaderboards
              </h3>
              <p className="caption">
                Points claimed this {periodType === "weekly" ? "week" : "month"}
                , using Adelaide time. Each resource is ranked separately. Top
                50 households per resource, plus your own rank. Equal points
                share a rank.
              </p>
              {rankingError && (
                <p role="alert" className="error">
                  {rankingError}
                </p>
              )}
              <div className={styles.boards}>
                {(["electricity", "water", "waste"] as const).map(
                  (resource) => {
                    const mine = myEntries.find(
                      (entry) => entry.resource === resource,
                    );
                    const board = entries.filter(
                      (entry) => entry.resource === resource,
                    );
                    return (
                      <article
                        className={`${styles.board} ${styles[resource]}`}
                        key={resource}
                      >
                        <h3>
                          {resource === "electricity"
                            ? "Electricity"
                            : resource === "water"
                              ? "Water"
                              : "Waste"}
                        </h3>
                        {loading ? (
                          <p role="status">Loading rankings...</p>
                        ) : (
                          !rankingError && (
                            <>
                              <div className={styles.yourRank}>
                                <span className={styles.eyebrow}>
                                  YOUR RANK
                                </span>
                                {mine ? (
                                  <>
                                    <div>
                                      <strong className={styles.rankNumber}>
                                        #{mine.rank}
                                      </strong>
                                      <strong>
                                        {mine.points.toLocaleString()} pts
                                      </strong>
                                    </div>
                                    <span>
                                      {mine.pseudonym}{" "}
                                      <span className={styles.you}>You</span>
                                    </span>
                                  </>
                                ) : (
                                  <p>
                                    {sharingEnabled ? (
                                      "No points claimed in this period yet."
                                    ) : (
                                      <>
                                        Leaderboard sharing is off.{" "}
                                        <Link href="/settings">
                                          Manage sharing
                                        </Link>
                                      </>
                                    )}
                                  </p>
                                )}
                              </div>
                              {board.length === 0 ? (
                                <p className="caption">
                                  No shared points earned in this period yet.
                                </p>
                              ) : (
                                <ol
                                  className={styles.ranking}
                                  aria-label={`${resource} rankings`}
                                >
                                  {board.map((entry) => (
                                    <li
                                      key={entry.pseudonym}
                                      className={`${styles.row} ${entry.isMe ? styles.myRow : ""}`}
                                    >
                                      <span
                                        className={styles.rank}
                                        aria-label={`Rank ${entry.rank}`}
                                      >
                                        {entry.rank}
                                      </span>
                                      <span className={styles.name}>
                                        {entry.pseudonym}
                                        {entry.isMe && (
                                          <span className={styles.you}>
                                            You
                                          </span>
                                        )}
                                      </span>
                                      <strong className={styles.points}>
                                        {entry.points.toLocaleString()}
                                        <small>pts</small>
                                      </strong>
                                    </li>
                                  ))}
                                </ol>
                              )}
                            </>
                          )
                        )}
                      </article>
                    );
                  },
                )}
              </div>
              <p className="caption">
                Only households that enable leaderboard sharing appear, using
                their pseudonyms.
              </p>
            </section>

            {statistics?.is_suppressed && (
              <p className="caption">
                Statistics are hidden because the Community group is too small
                to display safely.
              </p>
            )}

            {statistics && (
              <p className="caption">
                Period: {statistics.period_start} – {statistics.period_end}
              </p>
            )}
          </>
        )}
      </section>
    </>
  );
}
