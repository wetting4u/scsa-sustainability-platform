"use client";

import Link from "next/link";
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
  rank: number;
  pseudonym: string;
  points: number;
};

const demoLeaderboards = {
  weekly: {
    overall: [
      { rank: 1, pseudonym: "GreenKoala", points: 520 },
      { rank: 2, pseudonym: "EcoWattle", points: 460 },
      { rank: 3, pseudonym: "BlueGumHome", points: 390 },
      { rank: 4, pseudonym: "LeafyNest", points: 320 },
      { rank: 5, pseudonym: "SunnyPossum", points: 270 },
    ],

    electricity: [
      { rank: 1, pseudonym: "GreenKoala", points: 180 },
      { rank: 2, pseudonym: "EcoWattle", points: 170 },
      { rank: 3, pseudonym: "BlueGumHome", points: 140 },
    ],

    water: [
      { rank: 1, pseudonym: "GreenKoala", points: 190 },
      { rank: 2, pseudonym: "EcoWattle", points: 160 },
      { rank: 3, pseudonym: "BlueGumHome", points: 130 },
    ],

    waste: [
      { rank: 1, pseudonym: "GreenKoala", points: 150 },
      { rank: 2, pseudonym: "EcoWattle", points: 130 },
      { rank: 3, pseudonym: "BlueGumHome", points: 120 },
    ],
  },

  monthly: {
    overall: [
      { rank: 1, pseudonym: "EcoWattle", points: 1840 },
      { rank: 2, pseudonym: "GreenKoala", points: 1710 },
      { rank: 3, pseudonym: "LeafyNest", points: 1490 },
      { rank: 4, pseudonym: "BlueGumHome", points: 1320 },
      { rank: 5, pseudonym: "SunnyPossum", points: 980 },
    ],

    electricity: [
      { rank: 1, pseudonym: "EcoWattle", points: 640 },
      { rank: 2, pseudonym: "GreenKoala", points: 590 },
      { rank: 3, pseudonym: "LeafyNest", points: 520 },
    ],

    water: [
      { rank: 1, pseudonym: "GreenKoala", points: 620 },
      { rank: 2, pseudonym: "EcoWattle", points: 610 },
      { rank: 3, pseudonym: "LeafyNest", points: 480 },
    ],

    waste: [
      { rank: 1, pseudonym: "EcoWattle", points: 590 },
      { rank: 2, pseudonym: "GreenKoala", points: 500 },
      { rank: 3, pseudonym: "LeafyNest", points: 490 },
    ],
  },
};

export function Community() {
  const [periodType, setPeriodType] = useState<PeriodType>("weekly");
  const [statistics, setStatistics] =
    useState<CommunityStatistics | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsCommunityArea, setNeedsCommunityArea] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadStatistics() {
      setLoading(true);
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
      value: statistics?.total_households,
    },
    {
      label: "Usage records contributed",
      value: statistics?.total_records,
    },
    {
      label: "Challenge participations",
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
          <span className="eyebrow">
            SOUTH AUSTRALIA, GROWING TOGETHER
          </span>

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
                  </article>
                );
              })}
            </div>
            <section className="panel">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              <div>
                <h2 style={{ marginBottom: "6px" }}>Weekly overall leaderboard</h2>
                <p className="caption" style={{ margin: 0 }}>
                  See how participating households are contributing to a more sustainable
                  community.
                </p>
              </div>

              <span
                className="caption"
                style={{
                  padding: "6px 10px",
                  borderRadius: "999px",
                  background: "var(--surface-soft, #f3f5ef)",
                  whiteSpace: "nowrap",
                }}
              >
                This week
              </span>
            </div>

            <div style={{ display: "grid", gap: "10px" }}>
              {demoLeaderboards.weekly.overall.map((entry) => (
                <div
                  key={`weekly-overall-${entry.rank}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "48px 1fr auto",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px 16px",
                    border: "1px solid var(--border, #e4e8df)",
                    borderRadius: "14px",
                    background:
                    entry.rank <= 3
                      ? "var(--surface-soft, #f7f9f3)"
                      : "transparent",
                  }}
                >
                  <div
                    aria-label={`Rank ${entry.rank}`}
                    style={{
                      width: "36px",
                      height: "36px",
                      display: "grid",
                      placeItems: "center",
                      borderRadius: "50%",
                      fontWeight: 700,
                      background:
                        entry.rank <= 3
                          ? "var(--surface-soft, #eef3e7)"
                          : "transparent",
                    }}
                  >
                    {entry.rank === 1
                      ? "🥇"
                      : entry.rank === 2
                        ? "🥈"
                        : entry.rank === 3
                          ? "🥉"
                          : entry.rank}
                  </div>

                  <div>
                    <strong>{entry.pseudonym}</strong>
                    <div className="caption">Community household</div>
                  </div>

                  <strong style={{ whiteSpace: "nowrap" }}>
                    {entry.points.toLocaleString()} pts
                  </strong>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "28px" }}>
              <h3 style={{ marginBottom: "14px" }}>Resource leaderboards</h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "16px",
                }}
              >
                {[
                  {
                    title: "Electricity",
                    icon: "⚡",
                    entries: demoLeaderboards.weekly.electricity,
                  },
                  {
                    title: "Water",
                    icon: "💧",
                    entries: demoLeaderboards.weekly.water,
                  },
                  {
                    title: "Waste",
                    icon: "🌱",
                    entries: demoLeaderboards.weekly.waste,
                  },
                ].map((board) => (
                  <div
                    key={`weekly-${board.title}`}
                    style={{
                      border: "1px solid var(--border, #e4e8df)",
                      borderRadius: "16px",
                      padding: "18px",
                    }}
                  >
                    <div style={{ marginBottom: "16px" }}>
                      <div style={{ fontSize: "24px", marginBottom: "6px" }}>
                        {board.icon}
                      </div>

                      <h3 style={{ margin: 0 }}>{board.title}</h3>

                      <p
                        className="caption"
                        style={{ marginTop: "4px", marginBottom: 0 }}
                      >
                        Top households this week
                      </p>
                    </div>

                    <div style={{ display: "grid", gap: "12px" }}>
                      {board.entries.map((entry) => (
                        <div
                          key={`weekly-${board.title}-${entry.rank}`}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "32px 1fr auto",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span>
                            {entry.rank === 1
                              ? "🥇"
                              : entry.rank === 2
                                ? "🥈"
                                : "🥉"}
                          </span>

                          <span>{entry.pseudonym}</span>

                          <strong style={{ whiteSpace: "nowrap" }}>
                            {entry.points} pts
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="caption" style={{ marginTop: "16px", marginBottom: 0 }}>
              Rankings use pseudonyms to protect household privacy. Only households that
              choose to participate in the leaderboard are shown.
            </p>
          </section>
          <section className="panel">
          <div style={{ marginBottom: "20px" }}>
            <div className="eyebrow">MONTHLY RANKINGS</div>

            <h2 style={{ marginBottom: "6px" }}>
              Monthly overall leaderboard
            </h2>

            <p className="caption" style={{ margin: 0 }}>
              This month's leading households across the community.
            </p>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            {demoLeaderboards.monthly.overall.map((entry) => (
              <div
                key={`monthly-overall-${entry.rank}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "48px 1fr auto",
                  alignItems: "center",
                  gap: "14px",
                  padding: "14px 16px",
                  border: "1px solid var(--border, #e4e8df)",
                  borderRadius: "14px",
                  background:
                    entry.rank <= 3
                      ? "var(--surface-soft, #f7f9f3)"
                      : "transparent",
                }}
              >
                <div
                  aria-label={`Rank ${entry.rank}`}
                  style={{
                    width: "36px",
                    height: "36px",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 700,
                  }}
                >
                  {entry.rank === 1
                    ? "🥇"
                    : entry.rank === 2
                      ? "🥈"
                      : entry.rank === 3
                        ? "🥉"
                        : entry.rank}
                </div>

                <div>
                  <strong>{entry.pseudonym}</strong>
                  <div className="caption">Community household</div>
                </div>

                <strong style={{ whiteSpace: "nowrap" }}>
                  {entry.points.toLocaleString()} pts
                </strong>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "28px" }}>
            <h3 style={{ marginBottom: "14px" }}>
              Resource leaderboards
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "16px",
              }}
            >
              {[
                {
                  title: "Electricity",
                  icon: "⚡",
                  entries: demoLeaderboards.monthly.electricity,
                },
                {
                  title: "Water",
                  icon: "💧",
                  entries: demoLeaderboards.monthly.water,
                },
                {
                  title: "Waste",
                  icon: "🌱",
                  entries: demoLeaderboards.monthly.waste,
                },
              ].map((board) => (
                <div
                  key={`monthly-${board.title}`}
                  style={{
                    border: "1px solid var(--border, #e4e8df)",
                    borderRadius: "16px",
                    padding: "18px",
                  }}
                >
                  <div style={{ marginBottom: "16px" }}>
                    <div
                      style={{
                        fontSize: "24px",
                        marginBottom: "6px",
                      }}
                    >
                      {board.icon}
                    </div>

                    <h3 style={{ margin: 0 }}>
                      {board.title}
                    </h3>

                    <p
                      className="caption"
                      style={{
                        marginTop: "4px",
                        marginBottom: 0,
                      }}
                    >
                      Top households this month
                    </p>
                  </div>

                  <div style={{ display: "grid", gap: "12px" }}>
                    {board.entries.map((entry) => (
                      <div
                        key={`monthly-${board.title}-${entry.rank}`}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "32px 1fr auto",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span>
                          {entry.rank === 1
                            ? "🥇"
                            : entry.rank === 2
                              ? "🥈"
                              : "🥉"}
                        </span>

                        <span>{entry.pseudonym}</span>

                        <strong style={{ whiteSpace: "nowrap" }}>
                          {entry.points} pts
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
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