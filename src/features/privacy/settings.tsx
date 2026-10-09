"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon, PageHeading } from "@/components/ui";
import { isStrongPassword } from "@/features/auth/domain";
import { profileApi } from "./client";
export function Settings() {
  const [analytics, setAnalytics] = useState(false);
  const [leaderboard, setLeaderboard] = useState(false);
  const [household, setHousehold] = useState("");
  const [householdSize, setHouseholdSize] = useState(1);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [profileUpdated, setProfileUpdated] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const { data } = await profileApi.get();

        if (active) {
          setHousehold(data.displayName);
          setHouseholdSize(data.householdSize);
          setAnalytics(data.shareAnalytics);
          setLeaderboard(data.displayLeaderboard);
        }
      } catch (profileError) {
        if (active) {
          setMessage(
            profileError instanceof Error
              ? profileError.message
              : "Unable to load your household profile.",
          );
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const value = String(formData.get("household") ?? "").trim();

    const size = Number(formData.get("householdSize"));

    if (!value) {
      setMessage("Please enter a household name.");
      return;
    }
    if (!Number.isInteger(size) || size < 1 || size > 20) {
      setMessage("Household size must be a whole number between 1 and 20.");
      return;
    }

    setSaving(true);
    setMessage("");
    setProfileUpdated(false);

    try {
      const { data } = await profileApi.update({
        displayName: value,
        householdSize: size,
      });

      setHousehold(data.displayName);
      setHouseholdSize(data.householdSize);
      setAnalytics(data.shareAnalytics);
      setLeaderboard(data.displayLeaderboard);
      setProfileUpdated(true);
      router.refresh();
    } catch (profileError) {
      setMessage(
        profileError instanceof Error
          ? profileError.message
          : "Unable to update your household profile.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function updatePrivacyPreference(
    field: "shareAnalytics" | "displayLeaderboard",
    value: boolean,
  ) {
    setSavingPrivacy(true);
    setMessage("");

    try {
      const { data } = await profileApi.update({ [field]: value });

      setAnalytics(data.shareAnalytics);
      setLeaderboard(data.displayLeaderboard);
      setMessage("Privacy preference updated.");
    } catch (profileError) {
      setMessage(
        profileError instanceof Error
          ? profileError.message
          : "Unable to update your privacy preference.",
      );
    } finally {
      setSavingPrivacy(false);
    }
  }
  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    setPasswordError("");
    setPasswordMessage("");

    if (!isStrongPassword(password)) {
      setPasswordError(
        "Password must contain at least 8 characters, uppercase and lowercase letters, a number, and a special character.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("The two passwords do not match.");
      return;
    }

    setChangingPassword(true);

    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setPasswordError(error.message);
    } else {
      form.reset();
      setPasswordMessage("Password updated successfully.");
    }

    setChangingPassword(false);
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
        Your household profile and privacy preferences are securely saved to
        your account.
      </div>
      <div className="settings-grid">
        <section className="panel">
          <h2>Household profile</h2>
          <p>A friendly name for your personal dashboard.</p>
          <form onSubmit={handleProfileSubmit}>
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
            <label>
              Household size
              <input
                key={`household-size-${householdSize}`}
                name="householdSize"
                type="number"
                min={1}
                max={20}
                step={1}
                defaultValue={householdSize}
                required
              />
            </label>
            <p className="caption">
              You can update this name at any time. No address or personal
              details are required.
            </p>
            <button className="button primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save profile"}
            </button>
          </form>
        </section>
        <section className="panel">
          <h2>Change password</h2>

          <p>
            Enter a new password for your account. No confirmation email is
            required.
          </p>

          <form onSubmit={handlePasswordSubmit}>
            <label>
              New password
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>

            <p className="caption">
              Use at least 8 characters with uppercase and lowercase letters, a
              number, and a special character.
            </p>

            <label>
              Confirm new password
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>

            {passwordError && (
              <p className="error" role="alert">
                {passwordError}
              </p>
            )}

            {passwordMessage && (
              <p className="success" role="status">
                {passwordMessage}
              </p>
            )}

            <button
              className="button primary"
              type="submit"
              disabled={changingPassword}
            >
              {changingPassword ? "Updating password..." : "Update password"}
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
                void updatePrivacyPreference("shareAnalytics", !analytics)
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
                void updatePrivacyPreference("displayLeaderboard", !leaderboard)
              }
            >
              <span />
            </button>
          </div>
        </section>
      </div>
      <p role="status" className={message ? "success" : ""}>
        {message}
      </p>
      {profileUpdated && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-updated-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "grid",
            placeItems: "center",
            padding: "24px",
            background: "rgba(15, 35, 27, 0.45)",
            backdropFilter: "blur(3px)",
          }}
        >
          <section
            className="panel"
            style={{
              width: "100%",
              maxWidth: "420px",
              textAlign: "center",
            }}
          >
            <Icon name="check" size={42} />

            <h2 id="profile-updated-title">Profile updated</h2>

            <p>
              Your household name and household size have been saved
              successfully.
            </p>

            <button
              type="button"
              className="button primary"
              onClick={() => setProfileUpdated(false)}
            >
              Done
            </button>
          </section>
        </div>
      )}
    </>
  );
}
