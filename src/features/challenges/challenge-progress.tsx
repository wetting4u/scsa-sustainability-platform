import Link from "next/link";
import { Circle, SquareCheck } from "lucide-react";
import { resources } from "@/features/records/domain";
import type { Challenge } from "./domain";
import type { evaluateChallengeProgress } from "./progress";
import styles from "./challenges.module.css";

type Props = {
  challenge: Challenge;
  progress: ReturnType<typeof evaluateChallengeProgress>;
};
export function ChallengeProgress({ challenge, progress }: Props) {
  const earned = progress.status === "completed";
  const achieved = progress.status === "achieved" || earned;
  const color =
    achieved || progress.status === "within_limit"
      ? "green"
      : progress.status === "exceeded"
        ? "red"
        : "grey";
  const hasData = progress.coveredDays > 0;
  const unit = resources[challenge.resource].unit;
  return (
    <section
      className={styles.progress}
      aria-label={`Your progress: ${challenge.title}`}
    >
      <div className={`${styles.progressStatus} ${styles[color]}`}>
        {achieved ? (
          <SquareCheck size={23} aria-hidden="true" />
        ) : (
          <Circle size={17} fill="currentColor" aria-hidden="true" />
        )}
        <strong>{progress.label}</strong>
      </div>
      {earned ? (
        <>
          <strong className={styles.green}>
            {progress.awardedPoints?.toLocaleString()} points earned
          </strong>
          <p className={styles.help}>
            Awarded after verification. Later record changes do not change these
            points.
          </p>
        </>
      ) : (
        <>
          <p className={styles.amount}>
            <strong>{hasData ? progress.usage.toLocaleString() : "—"}</strong> /{" "}
            {challenge.target.toLocaleString()} {unit}
          </p>
          <progress
            className={`${styles.meter} ${styles[color]}`}
            max={100}
            value={Math.min(100, Math.max(0, progress.percentage))}
            aria-label="Usage limit consumed"
            aria-valuetext={
              hasData
                ? `${progress.usage} of ${challenge.target} ${unit} used`
                : "No recorded usage"
            }
          />
          <p className={styles.help}>
            {hasData
              ? `${Math.round(progress.percentage)}% of usage limit used — lower is better.`
              : "Missing records are not zero usage."}
          </p>
          <p className={styles.coverage}>
            {progress.coveredDays} / {progress.totalDays} days recorded
          </p>
          <p className={styles.help}>
            {progress.status === "achieved"
              ? "Full-period records are within the limit. Ready for final verification and points."
              : progress.status === "upcoming"
                ? "This challenge has not started yet."
                : progress.status === "exceeded"
                  ? "Your recorded usage is above the limit. This does not qualify for points."
                  : progress.status === "incomplete"
                    ? "The challenge has ended. Add the missing records to check completion."
                    : "Achievement is checked after the challenge ends and every day is covered."}
          </p>
          {progress.status === "achieved" &&
            challenge.rewardPoints === null && (
              <p className={styles.help}>
                An administrator needs to configure reward points.
              </p>
            )}
          {!achieved && (
            <Link href="/records" className="text-link">
              View / add usage records →
            </Link>
          )}
        </>
      )}
    </section>
  );
}
