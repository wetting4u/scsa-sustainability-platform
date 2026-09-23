"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import {
  authErrorMessage,
  isStrongPassword,
  passwordRequirements,
} from "@/features/auth/domain";
import { createClient } from "@/lib/supabase/client";

type SignUpStep = "credentials" | "verification";

export default function SignUpPage() {
  const [step, setStep] = useState<SignUpStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const requirements = passwordRequirements(password);
  const passwordValid = isStrongPassword(password);

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const normalizedEmail = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    const enteredPassword = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    setError("");
    setMessage("");

    if (!isStrongPassword(enteredPassword)) {
      setError(
        "Use at least 8 characters with uppercase, lowercase, number, and special character.",
      );
      return;
    }

    if (enteredPassword !== confirmPassword) {
      setError("The two passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: enteredPassword,
      });

      if (signUpError) {
        setError(
          authErrorMessage(
            signUpError,
            "Unable to create the account. Check your details and try again.",
          ),
        );
        return;
      }

      if (data.session) {
        await supabase.auth.signOut();
        setError(
          "The Supabase project must require email confirmation before accounts can sign in.",
        );
        return;
      }

      setEmail(normalizedEmail);
      setPassword("");
      setCode("");
      setStep("verification");
      setMessage(`We sent a 6-digit verification code to ${normalizedEmail}.`);
    } catch {
      setError("Unable to reach the authentication service. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your confirmation email.");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      const { error: verificationError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });

      if (verificationError) {
        setError(
          authErrorMessage(
            verificationError,
            "The verification code is invalid or expired.",
          ),
        );
        return;
      }

      const initializationResponse = await fetch(
        "/api/account/initialization",
        {
          cache: "no-store",
        },
      );

      if (!initializationResponse.ok) {
        setError(
          "Your email was verified, but we could not finish setting up your private household account. Please sign in again or contact the project team.",
        );
        return;
      }

      window.location.assign("/overview");
    } catch {
      setError("Unable to verify the code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setError("");
    setMessage("");
    setResending(true);

    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (resendError) {
        setError(
          authErrorMessage(
            resendError,
            "Unable to resend the verification email. Please try again later.",
          ),
        );
        return;
      }

      setMessage(`A new verification code was sent to ${email}.`);
    } catch {
      setError("Unable to resend the verification email. Please try again.");
    } finally {
      setResending(false);
    }
  }

  function editEmail() {
    setStep("credentials");
    setCode("");
    setError("");
    setMessage("");
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
        <div className="eyebrow">JOIN SCSA</div>
        <h1>
          {step === "credentials" ? "Create your account" : "Check your email"}
        </h1>
        <p>
          {step === "credentials"
            ? "Create a household account to track your sustainability progress."
            : `Enter the verification code sent to ${email}.`}
        </p>

        {step === "credentials" ? (
          <form key="credentials" onSubmit={handleSignUp}>
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={email}
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Create a strong password"
                minLength={8}
                required
                value={password}
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
              {requirements.map((requirement) => (
                <li
                  key={requirement.label}
                  style={{
                    color:
                      password.length === 0
                        ? "#6b7280"
                        : requirement.valid
                          ? "#2f6b46"
                          : "#b42318",
                  }}
                >
                  {requirement.valid ? "✓" : "○"} {requirement.label}
                </li>
              ))}
            </ul>

            <label>
              Confirm password
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
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
        ) : (
          <form key="verification" onSubmit={handleVerification}>
            <label>
              Verification code
              <input
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
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
              disabled={submitting || code.length !== 6}
              style={{ marginTop: "16px" }}
            >
              {submitting ? "Verifying..." : "Verify email"}
            </button>

            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
              <button
                className="button secondary"
                type="button"
                disabled={resending || submitting}
                onClick={() => void handleResend()}
              >
                {resending ? "Sending..." : "Resend code"}
              </button>
              <button
                className="button secondary"
                type="button"
                disabled={submitting}
                onClick={editEmail}
              >
                Change email
              </button>
            </div>
          </form>
        )}

        <p style={{ marginTop: "20px", marginBottom: 0 }}>
          Already have an account? <Link href="/sign-in">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
