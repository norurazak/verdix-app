import { adminDb } from "@/lib/firebase/admin";
import type { RubricCriterion } from "@/types/firestore";
import { createCriterion, updateCriterion, deleteCriterion } from "./actions";

export default async function RubricPage() {
  const snap = await adminDb.collection("rubricCriteria").orderBy("sortOrder").get();
  const criteria = snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as RubricCriterion),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-4 text-lg font-semibold text-black dark:text-zinc-50">
          Rubric criteria
        </h1>
        <form action={createCriterion} className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label
              htmlFor="label"
              className="block text-sm text-zinc-600 dark:text-zinc-400"
            >
              Label
            </label>
            <input
              id="label"
              name="label"
              required
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="sortOrder"
              className="block text-sm text-zinc-600 dark:text-zinc-400"
            >
              Order
            </label>
            <input
              id="sortOrder"
              name="sortOrder"
              type="number"
              defaultValue={criteria.length + 1}
              className="w-24 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>
          <div className="min-w-64 flex-1 space-y-1">
            <label
              htmlFor="description"
              className="block text-sm text-zinc-600 dark:text-zinc-400"
            >
              Description
            </label>
            <input
              id="description"
              name="description"
              className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>
          <button
            type="submit"
            className="rounded bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
          >
            Add criterion
          </button>
        </form>
      </div>

      <div className="space-y-2">
        {criteria.length === 0 && (
          <p className="text-sm text-zinc-500">
            No rubric criteria yet — judges won&apos;t see anything on the
            Rubric Reference tab until you add some.
          </p>
        )}
        {criteria.map((criterion) => (
          <form
            key={criterion.id}
            action={updateCriterion.bind(null, criterion.id)}
            className="flex flex-wrap items-start gap-3 border-b border-zinc-100 py-2 dark:border-zinc-900"
          >
            <input
              name="sortOrder"
              type="number"
              defaultValue={criterion.sortOrder}
              className="w-16 rounded border border-zinc-300 px-2 py-1 text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <input
              name="label"
              defaultValue={criterion.label}
              required
              className="w-48 rounded border border-zinc-300 px-2 py-1 text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <input
              name="description"
              defaultValue={criterion.description}
              className="min-w-64 flex-1 rounded border border-zinc-300 px-2 py-1 text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <button
              type="submit"
              className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
            >
              Save
            </button>
            <button
              type="submit"
              formAction={deleteCriterion.bind(null, criterion.id)}
              className="text-sm text-red-600 hover:underline"
            >
              Delete
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
