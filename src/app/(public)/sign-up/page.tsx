"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState("");

const passwordRules = [
  {
    label: "At least 8 characters",
    valid: password.length >= 8,
  },
  {
    label: "At least one uppercase letter",
    valid: /[A-Z]/.test(password),
  },
  {
    label: "At least one lowercase letter",
    valid: /[a-z]/.test(password),
  },
  {
    label: "At least one number",
    valid: /\d/.test(password),
  },
  {
    label: "At least one special character",
    valid: /[^A-Za-z0-9]/.test(password),
  },
];

const passwordValid = passwordRules.every((rule) => rule.valid);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const email = String(formData.get("email")).trim();
    const password = String(formData.get("password"));
    const confirmPassword = String(formData.get("confirmPassword"));

    setError("");
    setMessage("");

    if (!passwordValid) {
      setError(
        "Password must contain at least 8 characters, including uppercase, lowercase, number and special character.",
      );
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
  setPassword("");
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
              placeholder="Create a strong password"
              minLength={8}
              required
              onChange={(event) => setPassword(event.target.value)}
              aria-describedby="password-requirements"
            />
          </label>

          <ul
            id="password-requirements"
            aria-live="polite"
            style={{
              margin: "-4px 0 18px",
              paddingLeft: "20px",
              fontSize: "14px",
              lineHeight: 1.7,
            }}
          >
            {passwordRules.map((rule) => (
              <li
                key={rule.label}
                style={{
                  color:
                    password.length === 0
                      ? "#6b7280"
                      : rule.valid
                        ? "#2f6b46"
                        : "#b42318",
                }}
              >
                {rule.valid ? "✓" : "○"} {rule.label}
              </li>
            ))}
          </ul>

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
            disabled={submitting || !passwordValid}
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