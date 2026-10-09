"use client";
import { PageHeading, Icon } from "@/components/ui";
export function Community() {
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
            Community reporting brings consenting households’
            <br />
            progress together while keeping individual records private.
          </p>
        </div>
        <div className="challenge-emblem">
          <Icon name="community" size={95} />
        </div>
      </section>
      <div className="stats-grid">
        {[
          ["128", "Participating households"],
          ["342", "Usage records contributed"],
          ["86", "Challenge participations"],
        ].map(([v, l]) => (
          <article className="stat-card" key={l}>
            <div className="eyebrow">SAMPLE COMMUNITY DATA</div>
            <div className="stat-value">{v}</div>
            <p>{l}</p>
          </article>
        ))}
      </div>
    </>
  );
}
