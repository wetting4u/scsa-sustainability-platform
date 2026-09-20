"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);
  const email = String(formData.get("email")).trim();
  const password = String(formData.get("password"));

  setMessage("");
  setSubmitting(true);

  try {
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    window.location.href = "/overview";
  } catch (requestError) {
    setMessage(
      requestError instanceof Error
        ? requestError.message
        : "Unable to sign in.",
    );
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
      <section
        className="panel"
        style={{ width: "100%", maxWidth: "480px" }}
      >
        <div className="eyebrow">WELCOME BACK</div>

        <h1>Sign in</h1>

        <p>Sign in to continue tracking your household progress.</p>

        <form onSubmit={handleSubmit}>
          <label>
            Email address
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              placeholder="Enter your password"
              required
            />
          </label>

          {message && (
            <p className="success" role="status">
              {message}
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