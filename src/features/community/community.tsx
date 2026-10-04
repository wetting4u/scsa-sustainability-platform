"use client";
import Link from "next/link";
import { PageHeading, Icon } from "@/components/ui";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
export function Community() {
  const [analytics, setAnalytics] = useState(false);
  const [loading, setLoading] = useState(true);
  const [preferenceError, setPreferenceError] = useState("");

  useEffect(() => {
    async function loadPreference() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("household_profiles")
        .select("share_analytics")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error(error);
        setPreferenceError("Unable to load your sharing preference.");
        setLoading(false);
        return;
      }

      setAnalytics(Boolean(data.share_analytics));
      setLoading(false);
    }

    void loadPreference();
  }, []);
  const preferenceStatus = loading
    ? "loading"
    : preferenceError
      ? "unavailable"
      : analytics
        ? "enabled"
        : "disabled";
  return (
    <>
      <PageHeading
        eyebrow="SMALL STEPS. SHARED FUTURE."
        title="Together makes a difference."
        description="A glimpse of what a more mindful community can look like."
      />
      <div className="notice">
        <Icon name="shield" />
        Illustrative community totals only. These figures are not calculated
        from your household records.
      </div>
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
      <div className="two-grid">
        <section className="panel">
          <Icon name="shield" size={28} />
          <h2>Your contribution is your choice.</h2>
          <p>
            Community reporting is currently <strong>{preferenceStatus}</strong>{" "}
            in your account preferences. Personal goals and tracking work either
            way.
          </p>
          {preferenceError && (
            <p className="error" role="alert">
              {preferenceError}
            </p>
          )}
          <Link href="/settings" className="button secondary">
            Manage sharing <Icon name="arrow" size={16} />
          </Link>
        </section>
        <section className="panel">
          <span className="tag">PLANNED EXTENSION</span>
          <h2>A little friendly encouragement.</h2>
          <p>
            Pseudonymous leaderboards are planned for a later phase. No
            household ranking or public profile is published in this prototype.
          </p>
          <p className="caption">
            Future reports will require consent checks and small-group
            suppression. No household drill-down is shown.
          </p>
        </section>
      </div>
    </>
  );
}
