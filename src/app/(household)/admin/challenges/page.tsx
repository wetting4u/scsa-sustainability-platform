"use client";
import { PeriodPicker } from "@/components/period-picker";

import { useEffect, useState, type FormEvent } from "react";

import { Icon, PageHeading } from "@/components/ui";
import { resources, type Resource } from "@/features/records/domain";
import {
  adminChallengesApi,
  challengesApi,
} from "@/features/challenges/client";
import type { Challenge, ChallengeInput } from "@/features/challenges/domain";

export default function AdminChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [editing, setEditing] = useState<Challenge | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadChallenges() {
      try {
        const result = await challengesApi.list();
        setChallenges(result.data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load challenges.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadChallenges();
  }, []);

  function openCreateForm() {
    setEditing(null);
    setError("");
    setMessage("");
    setShowForm(true);
  }

  function openEditForm(challenge: Challenge) {
    setEditing(challenge);
    setError("");
    setMessage("");
    setShowForm(true);
  }

  function closeForm() {
    setEditing(null);
    setError("");
    setShowForm(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const challenge: ChallengeInput = {
      title: String(formData.get("title") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      resource: String(formData.get("resource") ?? "electricity") as Resource,
      target: Number(formData.get("target")),
      start: String(formData.get("start") ?? ""),
      end: String(formData.get("end") ?? ""),
      tag: String(formData.get("tag") ?? "").trim(),
      icon: String(formData.get("icon") ?? "sprout"),
    };

    if (
      !challenge.title ||
      !challenge.description ||
      !challenge.tag ||
      !challenge.start ||
      !challenge.end ||
      !Number.isFinite(challenge.target) ||
      challenge.target <= 0 ||
      challenge.end < challenge.start
    ) {
      setError(
        "Complete every field and enter a valid target and date period.",
      );
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (editing) {
        const result = await adminChallengesApi.update(editing.id, challenge);

        setChallenges((current) =>
          current.map((item) => (item.id === editing.id ? result.data : item)),
        );

        setMessage("Challenge updated successfully.");
      } else {
        const result = await adminChallengesApi.create(challenge);

        setChallenges((current) => [...current, result.data]);

        setMessage("Challenge created successfully.");
      }

      setEditing(null);
      setShowForm(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save the challenge.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(challenge: Challenge) {
    const confirmed = window.confirm(
      `Delete "${challenge.title}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    setDeleting(challenge.id);
    setError("");
    setMessage("");

    try {
      await adminChallengesApi.remove(challenge.id);

      setChallenges((current) =>
        current.filter((item) => item.id !== challenge.id),
      );

      setMessage("Challenge deleted successfully.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete the challenge.",
      );
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="ADMINISTRATION"
        title="Manage challenges."
        description="Create, update and remove the sustainability challenges available to households."
        action={
          <button
            type="button"
            className="button primary"
            onClick={openCreateForm}
          >
            <Icon name="plus" />
            Create challenge
          </button>
        }
      />

      <div className="notice">
        <Icon name="shield" />
        Only administrators can change challenge information.
      </div>

      {message && (
        <p className="success" role="status">
          {message}
        </p>
      )}

      {error && !showForm && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {showForm && (
        <section className="panel form-panel">
          <h2>{editing ? "Edit challenge" : "Create challenge"}</h2>

          <form key={editing?.id ?? "new-challenge"} onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                Challenge name
                <input
                  name="title"
                  required
                  maxLength={100}
                  defaultValue={editing?.title ?? ""}
                  placeholder="Save water this month"
                />
              </label>

              <label>
                Resource
                <select
                  name="resource"
                  defaultValue={editing?.resource ?? "electricity"}
                >
                  {Object.entries(resources).map(([value, resource]) => (
                    <option value={value} key={value}>
                      {resource.label} ({resource.unit})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Usage limit
                <input
                  name="target"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  defaultValue={editing?.target ?? ""}
                />
              </label>

              <label>
                Tag
                <input
                  name="tag"
                  required
                  maxLength={50}
                  defaultValue={editing?.tag ?? "HOUSEHOLD CHALLENGE"}
                />
              </label>

              <PeriodPicker
                scope="challenge"
                existing={
                  editing
                    ? { start: editing.start, end: editing.end }
                    : undefined
                }
              />

              <label>
                Icon
                <select name="icon" defaultValue={editing?.icon ?? "sprout"}>
                  <option value="sprout">Sprout</option>
                  <option value="bolt">Electricity bolt</option>
                  <option value="drop">Water drop</option>
                </select>
              </label>

              <label>
                Description
                <textarea
                  name="description"
                  required
                  maxLength={500}
                  rows={4}
                  defaultValue={editing?.description ?? ""}
                  placeholder="Describe this household challenge."
                />
              </label>
            </div>

            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}

            <div className="form-actions">
              <button
                className="button primary"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editing
                    ? "Save changes"
                    : "Create challenge"}
              </button>

              <button
                className="button secondary"
                type="button"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="section-title">
        <h2>Current challenges</h2>
        <span>
          {loading ? "Loading..." : `${challenges.length} challenges`}
        </span>
      </div>

      <div className="three-grid">
        {challenges.map((challenge) => (
          <article className="panel" key={challenge.id}>
            <Icon name="challenges" size={30} />

            <div className="eyebrow">{challenge.tag}</div>

            <h2>{challenge.title}</h2>
            <p>{challenge.description}</p>

            <p>
              <strong>
                {resources[challenge.resource].label}:{" "}
                {challenge.target.toLocaleString()}{" "}
                {resources[challenge.resource].unit}
              </strong>
            </p>

            <p>
              {challenge.start} — {challenge.end}
            </p>

            <div className="form-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => openEditForm(challenge)}
              >
                Edit
              </button>

              <button
                type="button"
                className="button secondary"
                disabled={deleting === challenge.id}
                onClick={() => void handleDelete(challenge)}
              >
                {deleting === challenge.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </article>
        ))}
      </div>

      {!loading && challenges.length === 0 && (
        <section className="panel">
          <p>No challenges are currently available.</p>
        </section>
      )}
    </>
  );
}
