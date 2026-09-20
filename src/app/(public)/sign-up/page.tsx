"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const email = String(formData.get("email")).trim();
    const password = String(formData.get("password"));
    const confirmPassword = String(formData.get("confirmPassword"));

    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The two passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
  const supabase = createClient();

  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    setError(signUpError.message);
    return;
  }

  setMessage(
    data.session
      ? "Account created successfully."
      : "Account created. Please check your email to confirm your account.",
  );

  form.reset();
} catch (requestError) {
  setError(
    requestError instanceof Error
      ? requestError.message
      : "Unable to create the account.",
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
        style={{
          width: "100%",
          maxWidth: "480px",
        }}
      >
        <div className="eyebrow">JOIN SCSA</div>

        <h1>Create your account</h1>

        <p>
          Create a household account to track your sustainability progress.
        </p>

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
              placeholder="At least 8 characters"
              minLength={8}
              required
            />
          </label>

          <label>
            Confirm password
            <input
              name="confirmPassword"
              type="password"
              placeholder="Enter your password again"
              required
            />
          </label>

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

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
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p style={{ marginTop: "20px", marginBottom: 0 }}>
          Already have an account? <Link href="/sign-in">Sign in</Link>
        </p>
      </section>
    </main>
  );
}