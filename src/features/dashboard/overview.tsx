"use client";
import Link from "next/link";
import { useState } from "react";
import { Icon, PageHeading } from "@/components/ui";
import { useDemo } from "@/features/demo/provider";
import { resources, totalFor, type Resource } from "@/features/records/domain";
import { GoalCard } from "@/features/goals/goals";
export function Overview() {
  const { records, goals } = useDemo();
  const [resource, setResource] = useState<Resource>("electricity");
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
        <span className="period-tag">September 2026 · Demo period</span>
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
      <div className="dashboard-grid">
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
        <section className="panel goals-preview">
          <div className="section-title">
            <h2>Growing towards your goals</h2>
            <Link href="/goals" className="text-link">
              View all <Icon name="arrow" size={16} />
            </Link>
          </div>
          {goals.slice(0, 2).map((g) => (
            <GoalCard key={g.id} goal={g} compact />
          ))}
          {!goals.length && <p>Create your first goal to get started.</p>}
          <Link className="button secondary full" href="/goals">
            Make a little commitment <Icon name="plus" size={16} />
          </Link>
        </section>
      </div>
      <div className="bottom-grid">
        <section className="tip-card">
          <span className="tip-icon">
            <Icon name="leaf" size={25} />
          </span>
          <div>
            <div className="eyebrow">ONE SMALL THING TO TRY</div>
            <h3>Let the daylight do the work.</h3>
            <p>Open your curtains before reaching for the light switch.</p>
            <small>
              Sample rule-based tip · Suggested for an electricity goal
            </small>
          </div>
        </section>
        <section className="badge-card">
          <span className="badge-medal">
            <Icon name="award" size={34} />
          </span>
          <div>
            <div className="eyebrow">YOUR FIRST SMALL WIN</div>
            <h3>Every journey starts somewhere</h3>
            <p>
              First record badge ·{" "}
              {records.length
                ? "Unlocked in this demo"
                : "Add a record to unlock"}
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
