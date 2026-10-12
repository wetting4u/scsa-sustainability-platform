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