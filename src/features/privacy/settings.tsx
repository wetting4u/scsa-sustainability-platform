"use client";
import { useState } from "react";
import { Icon, PageHeading } from "@/components/ui";
import { useDemo } from "@/features/demo/provider";
export function Settings() {
  const {
    analytics,
    setAnalytics,
    leaderboard,
    setLeaderboard,
    household,
    setHousehold,
    reset,
  } = useDemo();
  const [message, setMessage] = useState("");
  return (
    <>
      <PageHeading
        eyebrow="YOU’RE IN CONTROL"
        title="Your space. Your choices."
        description="Make yourself at home, and decide what you want to share."
      />
      <div className="notice">
        <Icon name="shield" />
        These are demonstration preferences. No authentication, backend privacy
        enforcement or data sharing is active.
      </div>
      <div className="settings-grid">
        <section className="panel">
          <h2>Household profile</h2>
          <p>A friendly name for your personal dashboard.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const value = String(
                new FormData(e.currentTarget).get("household"),
              ).trim();
              if (!value) {
                setMessage("Please enter a household name.");
                return;
              }
              setHousehold(value);
              setMessage("Household profile updated for this demo.");
            }}
          >
            <label>
              Household name
              <input
                key={household}
                name="household"
                defaultValue={household}
                maxLength={60}
                required
              />
            </label>
            <p className="caption">
              No address or personal details are needed to explore the
              prototype.
            </p>
            <button className="button primary" type="submit">
              Save profile
            </button>
          </form>
        </section>
        <section className="panel">
          <h2>Privacy by default</h2>
          <p>
            Your personal tracking works with both sharing options switched off.
          </p>
          <div className="toggle-row">
            <div>
              <strong>Include my data in community reports</strong>
              <p>
                Contribute to aggregated SCSA insights. Individual household
                records would not be shown.
              </p>
            </div>
            <button
              role="switch"
              aria-checked={analytics}
              aria-label="Include my data in community reports"
              className={`toggle ${analytics ? "on" : ""}`}
              onClick={() => setAnalytics(!analytics)}
            >
              <span />
            </button>
          </div>
          <div className="toggle-row">
            <div>
              <strong>Show my pseudonym on the leaderboard</strong>
              <p>
                Future feature. This switch previews your preference; no
                leaderboard is currently published.
              </p>
            </div>
            <button
              role="switch"
              aria-checked={leaderboard}
              aria-label="Show my pseudonym on the leaderboard"
              className={`toggle ${leaderboard ? "on" : ""}`}
              onClick={() => setLeaderboard(!leaderboard)}
            >
              <span />
            </button>
          </div>
          <div className="privacy-summary" role="status">
            <Icon name="shield" />
            <span>
              {!analytics && !leaderboard
                ? "Both sharing preferences are off."
                : `${analytics ? "Community reporting enabled." : "Community reporting disabled."} ${leaderboard ? "Leaderboard preference enabled (future feature)." : "Leaderboard preference disabled."}`}
            </span>
          </div>
        </section>
      </div>
      <section className="panel reset-panel">
        <div>
          <h2>A fresh start for your next demo</h2>
          <p>
            Restore sample records, goals, challenges and default privacy
            preferences.
          </p>
        </div>
        <button
          className="button secondary"
          onClick={() => {
            reset();
            setMessage("Demo reset to its original sample data.");
          }}
        >
          Reset demo
        </button>
      </section>
      <p role="status" className={message ? "success" : ""}>
        {message}
      </p>
    </>
  );
}
