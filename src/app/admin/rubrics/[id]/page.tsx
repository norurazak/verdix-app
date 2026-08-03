import { notFound } from "next/navigation";
import Link from "next/link";
import { adminDb } from "@/lib/firebase/admin";
import type { Rubric, RubricCriterion } from "@/types/firestore";
import { createCriterion, updateCriterion, deleteCriterion } from "./actions";

const inputClass =
  "rounded border border-zinc-300 px-2 py-1 text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

export default async function RubricCriteriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [rubricSnap, criteriaSnap] = await Promise.all([
    adminDb.collection("rubrics").doc(id).get(),
    adminDb
      .collection("rubricCriteria")
      .where("rubricId", "==", id)
      .orderBy("sortOrder")
      .get(),
  ]);

  if (!rubricSnap.exists) notFound();
  const rubric = rubricSnap.data() as Rubric;
  const criteria = criteriaSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as RubricCriterion),
  }));
  const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/rubrics"
          className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          ← All rubrics
        </Link>
        <h1 className="text-lg font-semibold text-black dark:text-zinc-50">
          {rubric.name}
        </h1>
        <p
          className={`text-sm ${Math.round(totalWeight) === 100 ? "text-zinc-500" : "text-amber-600"}`}
        >
          Weights sum to {totalWeight.toFixed(2)}%
          {Math.round(totalWeight) !== 100 && " — should total 100%"}
        </p>
      </div>

      <details className="rounded border border-zinc-200 p-4 dark:border-zinc-800">
        <summary className="cursor-pointer text-sm font-medium text-black dark:text-zinc-50">
          Add a criterion
        </summary>
        <form
          action={createCriterion.bind(null, id)}
          className="mt-4 grid max-w-xl gap-3"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <input name="label" placeholder="Label" required className={`flex-1 ${inputClass}`} />
            <input
              name="weight"
              type="number"
              step="0.01"
              placeholder="Weight %"
              className={`w-full sm:w-28 ${inputClass}`}
            />
            <input
              name="sortOrder"
              type="number"
              placeholder="Order"
              defaultValue={criteria.length + 1}
              className={`w-full sm:w-20 ${inputClass}`}
            />
          </div>
          <textarea
            name="bandWeak"
            placeholder="Weak (0-2) description"
            rows={2}
            className={inputClass}
          />
          <textarea
            name="bandModerate"
            placeholder="Moderate (3-4) description"
            rows={2}
            className={inputClass}
          />
          <textarea
            name="bandExcellent"
            placeholder="Excellent (5) description"
            rows={2}
            className={inputClass}
          />
          <button
            type="submit"
            className="w-fit rounded bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
          >
            Add criterion
          </button>
        </form>
      </details>

      <div className="space-y-4">
        {criteria.length === 0 && (
          <p className="text-sm text-zinc-500">No criteria yet.</p>
        )}
        {criteria.map((criterion) => (
          <form
            key={criterion.id}
            action={updateCriterion.bind(null, id, criterion.id)}
            className="grid max-w-xl gap-3 rounded border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                name="label"
                defaultValue={criterion.label}
                required
                className={`flex-1 ${inputClass}`}
              />
              <input
                name="weight"
                type="number"
                step="0.01"
                defaultValue={criterion.weight}
                className={`w-full sm:w-28 ${inputClass}`}
              />
              <input
                name="sortOrder"
                type="number"
                defaultValue={criterion.sortOrder}
                className={`w-full sm:w-20 ${inputClass}`}
              />
            </div>
            <textarea
              name="bandWeak"
              defaultValue={criterion.bands?.weak}
              placeholder="Weak (0-2) description"
              rows={2}
              className={inputClass}
            />
            <textarea
              name="bandModerate"
              defaultValue={criterion.bands?.moderate}
              placeholder="Moderate (3-4) description"
              rows={2}
              className={inputClass}
            />
            <textarea
              name="bandExcellent"
              defaultValue={criterion.bands?.excellent}
              placeholder="Excellent (5) description"
              rows={2}
              className={inputClass}
            />
            <div className="flex items-center gap-4">
              <button
                type="submit"
                className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
              >
                Save
              </button>
              <button
                type="submit"
                formAction={deleteCriterion.bind(null, id, criterion.id)}
                className="text-sm text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
