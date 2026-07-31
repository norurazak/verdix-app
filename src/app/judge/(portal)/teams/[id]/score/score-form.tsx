"use client";

import { useState } from "react";
import type { RubricCriterion } from "@/types/firestore";
import { submitScore } from "./actions";

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
      initial[criterion.id] = existingScores[criterion.id] ?? 5;
    }
    return initial;
  });

  return (
    <form
      action={submitScore.bind(null, teamId)}
      className="max-w-2xl space-y-6"
    >
      {criteria.map((criterion) => (
        <div key={criterion.id} className="space-y-1">
          <div className="flex items-baseline justify-between">
            <label
              htmlFor={`criterion_${criterion.id}`}
              className="font-medium text-black dark:text-zinc-50"
            >
              {criterion.label}
            </label>
            <span className="text-sm text-zinc-500">
              {scores[criterion.id]}/10
            </span>
          </div>
          {criterion.description && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {criterion.description}
            </p>
          )}
          <input
            id={`criterion_${criterion.id}`}
            name={`criterion_${criterion.id}`}
            type="range"
            min={1}
            max={10}
            step={1}
            value={scores[criterion.id]}
            onChange={(e) =>
              setScores((prev) => ({
                ...prev,
                [criterion.id]: Number(e.target.value),
              }))
            }
            className="w-full"
          />
        </div>
      ))}

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
