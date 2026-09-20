"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon, PageHeading } from "@/components/ui";
export function Settings() {
const [analytics, setAnalytics] = useState(false);
const [leaderboard, setLeaderboard] = useState(false);
const [household, setHousehold] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
const [saving, setSaving] = useState(false);
const [savingPrivacy, setSavingPrivacy] = useState(false);

useEffect(() => {
  async function loadProfile() {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("household_profiles")
      .select("display_name, share_analytics, display_leaderboard")
      .eq("user_id", user.id)
      .maybeSingle();

      if (data) {
        if (data.display_name) {
          setHousehold(data.display_name);
        }

        setAnalytics(Boolean(data.share_analytics));
        setLeaderboard(Boolean(data.display_leaderboard));
      }
  }

  void loadProfile();
}, [setAnalytics, setHousehold, setLeaderboard]);

async function handleProfileSubmit(
  event: FormEvent<HTMLFormElement>,
) {
  event.preventDefault();

  const value = String(
    new FormData(event.currentTarget).get("household"),
  ).trim();

  if (!value) {
    setMessage("Please enter a household name.");
    return;
  }

  setSaving(true);
  setMessage("");

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    setMessage("Please sign in again.");
    setSaving(false);
    return;
  }

  const { error } = await supabase
    .from("household_profiles")
    .update({ display_name: value })
    .eq("user_id", user.id);

  if (error) {
    setMessage(error.message);
  } else {
    setHousehold(value);
    setMessage("Household profile updated.");
    router.refresh();
  }

  setSaving(false);
}
async function updatePrivacyPreference(
  field: "share_analytics" | "display_leaderboard",
  value: boolean,
) {
  setSavingPrivacy(true);
  setMessage("");

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    setMessage("Please sign in again.");
    setSavingPrivacy(false);
    return;
  }

  const { error } = await supabase
    .from("household_profiles")
    .update({ [field]: value })
    .eq("user_id", user.id);

  if (error) {
    setMessage(error.message);
  } else {
    if (field === "share_analytics") {
      setAnalytics(value);
    } else {
      setLeaderboard(value);
    }

    setMessage("Privacy preference updated.");
  }

  setSavingPrivacy(false);
}

  return (
    <>
      <PageHeading
        eyebrow="YOU’RE IN CONTROL"
        title="Your space. Your choices."
        description="Make yourself at home, and decide what you want to share."
      />
      <div className="notice">
        <Icon name="shield" />
          Your household profile and privacy preferences are securely saved to your account.
      </div>
      <div className="settings-grid">
        <section className="panel">
          <h2>Household profile</h2>
          <p>A friendly name for your personal dashboard.</p>
          <form
            onSubmit={handleProfileSubmit}
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
              You can update this name at any time. No address or personal details are required.
            </p>
            <button
              className="button primary"
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save profile"}
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
              type="button"
              disabled={savingPrivacy}
              onClick={() =>
                void updatePrivacyPreference("share_analytics", !analytics)
              }
              
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
              type="button"
              disabled={savingPrivacy}
              onClick={() =>
                void updatePrivacyPreference(
                  "display_leaderboard",
                  !leaderboard,
                )
              }
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
      <p role="status" className={message ? "success" : ""}>
        {message}
      </p>
    </>
  );
}
