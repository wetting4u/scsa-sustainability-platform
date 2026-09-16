"use client";
import { useState } from "react";
import { Icon, PageHeading } from "@/components/ui";
import { useDemo } from "@/features/demo/provider";
import { challenges } from "@/mocks/data";
import { resources, totalFor } from "@/features/records/domain";
export function Challenges() {
  const { joined, setJoined, records } = useDemo();
  const [detail, setDetail] = useState<string | null>(null);
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
      <div className="section-title">
        <h2>Explore challenges</h2>
        <span>{joined.length} joined · September demo collection</span>
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
                onClick={() =>
                  setJoined(
                    active
                      ? joined.filter((id) => id !== c.id)
                      : [...joined, c.id],
                  )
                }
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
