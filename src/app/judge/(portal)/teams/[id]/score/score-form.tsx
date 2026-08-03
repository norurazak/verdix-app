"use client";

import { useState } from "react";
import type { RubricCriterion } from "@/types/firestore";
import { submitScore } from "./actions";

function bandForValue(value: number): "weak" | "moderate" | "excellent" {
  if (value <= 2) return "weak";
  if (value <= 4) return "moderate";
  return "excellent";
}

const bandLabel = {
  weak: "Weak (0–2)",
  moderate: "Moderate (3–4)",
  excellent: "Excellent (5)",
};

export function ScoreForm({
  teamId,
  criteria,
  existingScores,
  existingComments,
}: {
  teamId: string;
  criteria: (RubricCriterion & { id: string })[];
  existingScores: Record<string, number>;
  existingComments: string;
}) {
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const criterion of criteria) {
      initial[criterion.id] = existingScores[criterion.id] ?? 3;
    }
    return initial;
  });

  return (
    <form
      action={submitScore.bind(null, teamId)}
      className="max-w-2xl space-y-6"
    >
      {criteria.map((criterion) => {
        const value = scores[criterion.id];
        const band = bandForValue(value);
        return (
          <div key={criterion.id} className="space-y-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <label
                htmlFor={`criterion_${criterion.id}`}
                className="font-medium text-black dark:text-zinc-50"
              >
                {criterion.label}
              </label>
              <span className="text-sm text-zinc-500">
                {value}/5 · {bandLabel[band]}
              </span>
            </div>
            {criterion.bands?.[band] && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {criterion.bands[band]}
              </p>
            )}
            <input
              id={`criterion_${criterion.id}`}
              name={`criterion_${criterion.id}`}
              type="range"
              min={0}
              max={5}
              step={1}
              value={value}
              onChange={(e) =>
                setScores((prev) => ({
                  ...prev,
                  [criterion.id]: Number(e.target.value),
                }))
              }
              className="w-full"
            />
          </div>
        );
      })}

      <div className="space-y-1">
        <label
          htmlFor="comments"
          className="block text-sm text-zinc-600 dark:text-zinc-400"
        >
          Comments (optional)
        </label>
        <textarea
          id="comments"
          name="comments"
          rows={4}
          defaultValue={existingComments}
          className="w-full rounded border border-zinc-300 px-3 py-2 text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      <button
        type="submit"
        className="rounded bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
      >
        Submit score
      </button>
    </form>
  );
}
