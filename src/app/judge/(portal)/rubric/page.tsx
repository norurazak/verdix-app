import { adminDb } from "@/lib/firebase/admin";
import { requireJudge } from "@/lib/auth/session";
import type { RubricCriterion } from "@/types/firestore";

export default async function JudgeRubricPage() {
  await requireJudge();

  const snap = await adminDb.collection("rubricCriteria").orderBy("sortOrder").get();
  const criteria = snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as RubricCriterion),
  }));

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-lg font-semibold text-black dark:text-zinc-50">
        Rubric reference
      </h1>
      {criteria.length === 0 && (
        <p className="text-sm text-zinc-500">
          The organizer hasn&apos;t set up the rubric yet.
        </p>
      )}
      {criteria.map((criterion) => (
        <div
          key={criterion.id}
          className="border-b border-zinc-100 pb-3 dark:border-zinc-900"
        >
          <p className="font-medium text-black dark:text-zinc-50">
            {criterion.label}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {criterion.description}
          </p>
        </div>
      ))}
    </div>
  );
}
