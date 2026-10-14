"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function FrozenAccountActions() {
  const router = useRouter();

  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  async function handleUnfreeze() {
    setWorking(true);
    setError("");

    try {
      const response = await fetch("/api/account/freeze", {
        method: "DELETE",
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
          payload?.error?.message ?? "Unable to unfreeze your account.",
        );
      }

      router.replace("/overview");
      router.refresh();
    } catch (unfreezeError) {
      setError(
        unfreezeError instanceof Error
          ? unfreezeError.message
          : "Unable to unfreeze your account.",
      );
    } finally {
      setWorking(false);
    }
  }

  async function handleSignOut() {
    setWorking(true);
    setError("");

    const supabase = createClient();
    await supabase.auth.signOut();

    router.replace("/sign-in");
    router.refresh();
  }

  return (
    <div className="form-actions">
      <button
        type="button"
        className="button primary"
        disabled={working}
        onClick={() => void handleUnfreeze()}
      >
        {working ? "Updating..." : "Unfreeze my account"}
      </button>

      <button
        type="button"
        className="button secondary"
        disabled={working}
        onClick={() => void handleSignOut()}
      >
        Sign out
      </button>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}