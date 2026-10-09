"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon, PageHeading } from "@/components/ui";

import {
  resources,
  totalFor,
  type Resource,
  type UsageRecord,
} from "@/features/records/domain";

import styles from "./overview.module.css";
import { createClient } from "@/lib/supabase/client";
type EarnedBadge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  awardedAt: string;
};

type BadgeQueryRow = {
  awarded_at: string;
  badge: {
    id: string;
    name: string;
    description: string;
    icon: string;
  } | null;
};

export function Overview() {

const [badges, setBadges] = useState<EarnedBadge[]>([]);
const [badgesLoading, setBadgesLoading] = useState(true);
const [badgesError, setBadgesError] = useState("");

const [records, setRecords] = useState<UsageRecord[]>([]);
const [loading, setLoading] = useState(true);
const [resource, setResource] = useState<Resource>("electricity");
const [recordsError, setRecordsError] = useState("");

  useEffect(() => {
    async function loadRecords() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("usage_records")
        .select("id, resource, start_date, end_date, amount")
        .eq("user_id", user.id)
        .order("end_date", { ascending: true });

      if (error) {
        console.error(error);
        setRecordsError("Unable to load your resource records.");
        setLoading(false);
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

      setLoading(false);
    }

    void loadRecords();
  }, []);
 
  useEffect(() => {
    async function loadBadges() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setBadgesLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_badges")
        .select(
          `
        awarded_at,
        badge:badges (
          id,
          name,
          description,
          icon
        )
      `,
        )
        .eq("user_id", user.id)
        .order("awarded_at", { ascending: false });

      if (error) {
        console.error(error);
        setBadgesError("Unable to load your badges.");
        setBadgesLoading(false);
        return;
      }

      const rows = (data ?? []) as unknown as BadgeQueryRow[];
      const earnedBadges: EarnedBadge[] = [];

      for (const row of rows) {
        if (!row.badge) continue;

        earnedBadges.push({
          id: row.badge.id,
          name: row.badge.name,
          description: row.badge.description,
          icon: row.badge.icon,
          awardedAt: row.awarded_at,
        });
      }

      setBadges(earnedBadges);
      setBadgesLoading(false);
    }

    void loadBadges();
  }, []);
  const weeks = [
    ["01–07 Sep", "2026-09-01", "2026-09-07"],
    ["08–14 Sep", "2026-09-08", "2026-09-14"],
    ["15–21 Sep", "2026-09-15", "2026-09-21"],
    ["22–30 Sep", "2026-09-22", "2026-09-30"],
  ];
  const values = weeks.map((w) => totalFor(records, resource, w[1], w[2]));
  const hasData = weeks.map((w) =>
    records.some(
      (r) => r.resource === resource && r.start >= w[1] && r.end <= w[2],
    ),
  );
  const max = Math.max(...values, 1);
  const latestBadge = badges[0];
  return (
    <>
      <PageHeading
        eyebrow="A LITTLE PROGRESS, EVERY DAY"
        title="Your everyday impact."
        description="Small changes at home. A brighter future for all of us."
        action={
          <Link className="button primary" href="/records?new=1">
            <Icon name="plus" size={18} />
            Log usage
          </Link>
        }
      />
      {loading && (
        <div className="notice" role="status">
          <Icon name="records" />
          Loading your resource records...
        </div>
      )}

      {recordsError && (
        <p className="error" role="alert">
          {recordsError}
        </p>
      )}
      <section className="welcome-banner">
        <div>
          <span className="eyebrow">LET’S GROW SOMETHING GOOD</span>
          <h2>
            A greener community
            <br />
            starts right at home.
          </h2>
          <p>
            Track your resources, build better habits,
            <br />
            and celebrate the small wins along the way.
          </p>
          <Link className="text-link" href="/challenges">
            Find your next challenge <Icon name="arrow" size={17} />
          </Link>
        </div>
        <div className="botanical" aria-hidden="true">
          <div className="sun" />
          <div className="stem" />
          <i className="leaf l1" />
          <i className="leaf l2" />
          <i className="leaf l3" />
          <i className="leaf l4" />
          <div className="ground" />
          <span className="botanical-caption">
            LESS WASTE. MORE POSSIBILITY.
          </span>
        </div>
      </section>
      <div className="section-title">
        <h2>Your resource snapshot</h2>
      </div>
      <div className="stats-grid">
        {(Object.keys(resources) as Resource[]).map((key, index) => (
          <article className={`stat-card ${key}`} key={key}>
            <div className="stat-top">
              <span className="resource-icon">
                <Icon
                  name={index === 0 ? "bolt" : index === 1 ? "drop" : "sprout"}
                />
              </span>
              <span>{resources[key].label}</span>
              <Link
                href={`/records?resource=${key}`}
                aria-label={`View ${resources[key].label} records`}
              >
                <Icon name="external" size={18} />
              </Link>
            </div>
            <div className="stat-value">
              {records.some(
                (r) =>
                  r.resource === key &&
                  r.start >= "2026-09-01" &&
                  r.end <= "2026-09-30",
              )
                ? totalFor(records, key).toLocaleString()
                : "—"}{" "}
              <small>{resources[key].unit}</small>
            </div>
            <p>Recorded usage this month</p>
            <div className="stat-foot">
              {
                records.filter(
                  (r) =>
                    r.resource === key &&
                    r.start >= "2026-09-01" &&
                    r.end <= "2026-09-30",
                ).length
              }{" "}
              entries <span>Manual household records</span>
            </div>
          </article>
        ))}
      </div>
      <div className={styles.stack}>
        <section className="panel">
          <div className="section-title">
            <div>
              <h2>A clearer picture</h2>
              <p>Your recorded usage over time</p>
            </div>
            <Icon name="records" />
          </div>
          <div className="tabs" aria-label="Chart resource">
            {(Object.keys(resources) as Resource[]).map((r) => (
              <button
                key={r}
                aria-pressed={r === resource}
                className={r === resource ? "selected" : ""}
                onClick={() => setResource(r)}
              >
                {resources[r].label}
              </button>
            ))}
          </div>
          <div
            className="chart"
            role="img"
            aria-label={`${resources[resource].label} weekly recorded totals: ${weeks.map((w, i) => `${w[0]}: ${hasData[i] ? `${values[i]} ${resources[resource].unit}` : "no records"}`).join("; ")}. Missing records do not mean zero consumption.`}
          >
            {weeks.map((w, i) => (
              <div className="chart-column" key={w[0]}>
                <span>{hasData[i] ? values[i].toLocaleString() : "—"}</span>
                <div className="bar-track">
                  <div
                    className={`bar ${resource}`}
                    style={{ height: `${(values[i] / max) * 100}%` }}
                  />
                </div>
                <small>{w[0]}</small>
              </div>
            ))}
          </div>
          <p className="caption">
            {resources[resource].unit} · Complete record periods within each
            week only. Missing data is not zero usage.
          </p>
        </section>
        <section className="badge-card" aria-live="polite">
          <span className="badge-medal">
            <Icon name="award" size={34} />
          </span>

          <div>
            <div className="eyebrow">
              {badgesLoading
                ? "CHECKING YOUR PROGRESS"
                : latestBadge
                  ? "YOUR LATEST SMALL WIN"
                  : "YOUR NEXT SMALL WIN"}
            </div>

            <h3>
              {badgesLoading
                ? "Loading your badges..."
                : (latestBadge?.name ?? "Every journey starts somewhere")}
            </h3>

            <p>
              {badgesError
                ? badgesError
                : badgesLoading
                  ? "Looking for the achievements you have earned."
                  : latestBadge
                    ? `${latestBadge.description} · Earned ${new Date(
                        latestBadge.awardedAt,
                      ).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}`
                    : "Complete activities to earn your first badge."}
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
