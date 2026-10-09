"use client";

import { useId, useState } from "react";
import {
  adelaideToday,
  periodKind,
  periodLabel,
  periodOptions,
  type DateRange,
  type PeriodKind,
  type PeriodScope,
} from "@/lib/periods";

export function PeriodPicker({
  scope,
  existing,
}: {
  scope: PeriodScope;
  existing?: DateRange;
}) {
  const id = useId();
  const today = adelaideToday();
  const [kind, setKind] = useState<PeriodKind | "existing">(
    existing ? "existing" : "weekly",
  );
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selected, setSelected] = useState("");
  const options =
    kind === "existing"
      ? []
      : periodOptions(
          kind,
          scope === "goal" ? today.slice(0, 7) : month,
          scope,
          today,
        );
  const range =
    kind === "existing"
      ? existing
      : (options.find((p) => p.start === selected) ?? options[0]);
  return (
    <>
      <label>
        Period
        <select
          value={kind}
          onChange={(e) => {
            setKind(e.target.value as PeriodKind | "existing");
            setSelected("");
          }}
          aria-describedby={`${id}-help`}
        >
          {existing && (
            <option value="existing">
              Keep existing period
              {periodKind(existing) ? ` (${periodKind(existing)})` : ""}
            </option>
          )}
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </label>
      {scope === "challenge" && kind !== "existing" && (
        <label>
          Calendar month
          <input
            type="month"
            value={month}
            min={today.slice(0, 7)}
            max="9998-12"
            required
            onChange={(e) => {
              setMonth(e.target.value);
              setSelected("");
            }}
          />
        </label>
      )}
      <label>
        Date range
        <select
          value={range?.start ?? ""}
          required
          onChange={(e) => setSelected(e.target.value)}
          aria-describedby={`${id}-help`}
        >
          {kind === "existing" && existing ? (
            <option value={existing.start}>{periodLabel(existing)}</option>
          ) : (
            options.map((p) => (
              <option key={p.start} value={p.start}>
                {periodLabel(p)}
              </option>
            ))
          )}
          {!range && <option value="">Choose an available period</option>}
        </select>
      </label>
      <input type="hidden" name="start" value={range?.start ?? ""} />
      <input type="hidden" name="end" value={range?.end ?? ""} />
      <p id={`${id}-help`}>
        {kind === "existing"
          ? "Your saved dates are preserved. Choose Weekly or Monthly to replace them."
          : scope === "goal"
            ? "Adelaide time. Choose this month or a current/future week starting by month-end; the final week may end next month."
            : "Adelaide time. Choose a current or future calendar week or month. Weeks run Monday to Sunday."}
      </p>
    </>
  );
}
