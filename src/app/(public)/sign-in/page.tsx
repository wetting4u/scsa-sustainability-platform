"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { authErrorMessage } from "@/features/auth/domain";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") ?? "");

    setError("");
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(
          authErrorMessage(
            signInError,
            "Unable to sign in. Check your details and try again.",
          ),
        );
        return;
      }

      window.location.assign("/overview");
    } catch {
      setError("Unable to reach the authentication service. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
      }}
    >
      <section className="panel" style={{ width: "100%", maxWidth: "480px" }}>
        <div className="eyebrow">WELCOME BACK</div>
        <h1>Sign in</h1>
        <p>Sign in to continue tracking your household progress.</p>

        <form onSubmit={handleSubmit}>
          <label>
            Email address
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              required
            />
          </label>

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <button
            className="button primary full"
            type="submit"
            disabled={submitting}
            style={{ marginTop: "16px" }}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p style={{ marginTop: "20px", marginBottom: 0 }}>
          New to SCSA? <Link href="/sign-up">Create an account</Link>
        </p>
      </section>
    </main>
  );
}
