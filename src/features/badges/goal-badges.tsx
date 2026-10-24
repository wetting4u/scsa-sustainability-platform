"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Circle, Square, SquareCheck } from "lucide-react";
import { resources } from "@/features/records/domain";
import { periodLabel } from "@/lib/periods";
import { goalUsageIndicator, type GoalBadge } from "./domain";
import styles from "./goal-badges.module.css";

export function GoalBadges() {
  const [badges, setBadges] = useState<GoalBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/badges", {
          cache: "no-store",
          signal: controller.signal,
        });
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.error?.message ?? "Unable to load goal badges.");
        if (active) setBadges(body.data);
      } catch (e) {
        if (active)
          setError(
            e instanceof Error ? e.message : "Unable to load goal badges.",
          );
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    // Recheck after returning to this tab and at date boundaries without a scheduler.
    const refresh = () => {
      if (document.visibilityState === "visible") setRetry((n) => n + 1);
    };
    document.addEventListener("visibilitychange", refresh);
    const timer = setInterval(refresh, 60000);
    return () => {
      active = false;
      controller.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [retry]);
  const achieved = badges.filter((b) => b.status === "achieved").length;
  return (
    <section
      className="panel"
      aria-labelledby="goal-badges-heading"
      aria-busy={loading}
    >
      <div className="section-title">
        <h2 id="goal-badges-heading">Your goal badges</h2>
        <Link href="/goals" className="text-link">
          Manage goals
        </Link>
      </div>
      <p>
        Personal achievements from your recorded usage. No challenge
        participation or sharing required.
      </p>
      {loading ? (
        <p role="status">Checking your goals...</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <button
            className="button secondary"
            onClick={() => setRetry((n) => n + 1)}
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          <p>
            {achieved} {achieved === 1 ? "badge" : "badges"} earned
          </p>
          {!badges.length ? (
            <p>Create your first goal to start collecting badges.</p>
          ) : (
            <div className={styles.grid}>
              {badges.map((b) => {
                const indicator = goalUsageIndicator(b);
                const earned = b.status === "achieved";
                return (
                  <article key={b.id} className={styles.card}>
                    <div className={styles.heading}>
                      <span
                        className={`${styles.lamp} ${styles[indicator.color]}`}
                        aria-hidden="true"
                      >
                        <Circle size={24} fill="currentColor" />
                      </span>
                      <div>
                        <span className={`tag ${b.resource}`}>
                          {resources[b.resource].label}
                        </span>
                        <h3>{b.title}</h3>
                      </div>
                    </div>
                    <strong>{indicator.label}</strong>
                    <p className={styles.achievement}>
                      {earned ? (
                        <SquareCheck className={styles.earned} size={22} aria-hidden="true" />
                      ) : (
                        <Square size={22} aria-hidden="true" />
                      )}
                      <span>
                        {earned ? "Goal achieved" : "Not yet achieved"}
                      </span>
                    </p>
                    <p>{periodLabel(b)}</p>
                    <p>
                      {b.usage.toLocaleString()} / {b.target.toLocaleString()}{" "}
                      {resources[b.resource].unit}
                    </p>
                    <p className="caption">
                      {b.coveredDays} / {b.totalDays} days recorded
                    </p>
                    {b.status === "within_limit" && (
                      <p className="caption">
                        Not earned yet. The period must end with complete
                        records and usage within the limit.
                      </p>
                    )}
                    {(b.status === "no_data" ||
                      b.status === "insufficient_data") && (
                      <p className="caption">
                        Missing records are not zero usage. Only records fully
                        inside this goal period count.
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
          <p className="caption">
            Badges are recalculated from saved goals and records. Editing or
            deleting their source data may change an achievement.
          </p>
        </>
      )}
    </section>
  );
}
