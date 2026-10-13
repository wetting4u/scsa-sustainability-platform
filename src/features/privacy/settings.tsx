"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon, PageHeading } from "@/components/ui";
import { isStrongPassword } from "@/features/auth/domain";
import { profileApi } from "./client";
type CommunityArea = {
  id: string;
  name: string;
};
export function Settings() {
  const [analytics, setAnalytics] = useState(false);
  const [leaderboard, setLeaderboard] = useState(false);
  const [household, setHousehold] = useState("");
  const [householdSize, setHouseholdSize] = useState(1);
  const [communityAreaId, setCommunityAreaId] = useState("");
  const [communityAreas, setCommunityAreas] = useState<CommunityArea[]>([]);
  const [communityAreasLoading, setCommunityAreasLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
  useState<"success" | "error">("success");
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [profileUpdated, setProfileUpdated] = useState(false);
  const [resettingProgress, setResettingProgress] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [freezingAccount, setFreezingAccount] = useState(false);
  const [freezeError, setFreezeError] = useState("");
  

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
          setCommunityAreaId(data.communityAreaId ?? "");
        }
      } catch (profileError) {
        if (active) {
          setMessageType("error");
          setMessage(
            profileError instanceof Error
              ? profileError.message
              : "Unable to load your household profile.",
          );
        }
      } finally {
        if (active) {
          setProfileLoading(false);
        }
      }
    }

    async function loadCommunityAreas() {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("community_areas")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (!active) {
      return;
    }

    if (error) {
      console.error(error);
      setMessageType("error");
      setMessage("Unable to load Community Areas.");
      setCommunityAreasLoading(false);
      return;
    }

    setCommunityAreas((data ?? []) as CommunityArea[]);
    setCommunityAreasLoading(false);
  }

    void loadProfile();
    void loadCommunityAreas();

    return () => {
      active = false;
    };
  }, []);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const value = String(formData.get("household") ?? "").trim();

    const size = Number(formData.get("householdSize"));

    const selectedCommunityAreaId = String(
    formData.get("communityAreaId") ?? "",
    ).trim();

    if (!value) {
      setMessageType("error");
      setMessage("Please enter a household name.");
      return;
    }
    if (!Number.isInteger(size) || size < 1 || size > 20) {
      setMessageType("error");
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
        communityAreaId: selectedCommunityAreaId || null,
      });

      setHousehold(data.displayName);
      setHouseholdSize(data.householdSize);
      setAnalytics(data.shareAnalytics);
      setLeaderboard(data.displayLeaderboard);
      setCommunityAreaId(data.communityAreaId ?? "");
      setProfileUpdated(true);
      router.refresh();
    } catch (profileError) {
      setMessageType("error");
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
      setMessageType("success");
      setMessageType("success");
      setMessage("Privacy preference updated.");
    } catch (profileError) {
    setMessageType("error");
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
      async function handleResetProgress() {
      const confirmed = window.confirm(
        "Reset all of your progress?\n\n" +
          "This will permanently delete your usage records, goals, challenge participation, and badge progress. " +
          "Your account, household profile, Community Area, and privacy settings will be kept.",
      );

      if (!confirmed) {
        return;
      }

      setResettingProgress(true);
      setResetMessage("");

      try {
        const response = await fetch("/api/account/reset", {
          method: "POST",
          cache: "no-store",
        });

        const payload = (await response.json().catch(() => null)) as
          | {
              data?: { reset?: boolean };
              error?: { message?: string };
            }
          | null;

        if (!response.ok) {
          throw new Error(
            payload?.error?.message ?? "Unable to reset your account progress.",
          );
        }

        setResetMessage("Your account progress has been reset successfully.");
        router.refresh();
      } catch (resetError) {
        setResetMessage(
          resetError instanceof Error
            ? resetError.message
            : "Unable to reset your account progress.",
        );
      } finally {
        setResettingProgress(false);
      }
    }
    async function handleFreezeAccount() {
    const confirmed = window.confirm(
      "Freeze your account?\n\n" +
        "You will temporarily lose access to household features. " +
        "Your account and saved information will be kept, and you can unfreeze the account later.",
    );

    if (!confirmed) {
      return;
    }

    setFreezingAccount(true);
    setFreezeError("");

    try {
      const response = await fetch("/api/account/freeze", {
        method: "POST",
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            data?: { frozen?: boolean };
            error?: { message?: string };
          }
        | null;

      if (!response.ok) {
        throw new Error(
          payload?.error?.message ?? "Unable to freeze your account.",
        );
      }

      router.replace("/account-frozen");
      router.refresh();
    } catch (freezeAccountError) {
      setFreezeError(
        freezeAccountError instanceof Error
          ? freezeAccountError.message
          : "Unable to freeze your account.",
      );
    } finally {
      setFreezingAccount(false);
    }
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
                disabled={profileLoading || saving}
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
                disabled={profileLoading || saving}
                required
              />
            </label>
            
            <label>
              Community Area
              <select
                name="communityAreaId"
                value={communityAreaId}
                onChange={(event) => setCommunityAreaId(event.target.value)}
                disabled={communityAreasLoading || profileLoading || saving}
              >
                <option value="">
                  {communityAreasLoading
                    ? "Loading Community Areas..."
                    : "Select your Community Area"}
                </option>

                {communityAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="caption">
              Choose the Community Area that best matches your household.
              No street address or postcode is required.
            </p>
            <button
              className="button primary"
              type="submit"
              disabled={saving || profileLoading}
            >
              {profileLoading
                ? "Loading profile..."
                : saving
                  ? "Saving..."
                  : "Save profile"}
            </button>
          </form>
        </section>
        <section className="panel">
          <h2>Account controls</h2>

          <p>
            Manage your saved progress and account access.
          </p>

          <div style={{ marginTop: "20px" }}>
            <strong>Reset progress</strong>

            <p className="caption">
              Permanently delete your usage records, goals, challenge participation,
              and badge progress. Your account, household profile, Community Area,
              and privacy preferences will be kept.
            </p>

            <button
              type="button"
              className="button secondary"
              disabled={resettingProgress || freezingAccount}
              onClick={() => void handleResetProgress()}
            >
              {resettingProgress ? "Resetting..." : "Reset progress"}
            </button>

            {resetMessage && (
              <p role="status" style={{ marginTop: "12px" }}>
                {resetMessage}
              </p>
            )}
          </div>
          <div style={{ marginTop: "28px" }}>
          <strong>Freeze account</strong>

          <p className="caption">
            Temporarily pause access to household features without deleting your
            account or saved information. You can unfreeze the account later.
          </p>

          <button
            type="button"
            className="button secondary"
            disabled={freezingAccount || resettingProgress}
            onClick={() => void handleFreezeAccount()}
          >
            {freezingAccount ? "Freezing..." : "Freeze account"}
          </button>

          {freezeError && (
            <p className="error" role="alert">
              {freezeError}
            </p>
          )}
        </div>
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
      {message && (
        <p
          role={messageType === "error" ? "alert" : "status"}
          className={messageType === "error" ? "error" : "success"}
        >
          {message}
        </p>
      )}
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
