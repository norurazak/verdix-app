import Link from "next/link";
import { adminDb } from "@/lib/firebase/admin";
import type { EventSettings, Rubric } from "@/types/firestore";
import { createRubric, deleteRubric, setActiveRubric } from "./actions";

export default async function RubricsPage() {
  const [rubricsSnap, settingsSnap] = await Promise.all([
    adminDb.collection("rubrics").orderBy("name").get(),
    adminDb.collection("settings").doc("event").get(),
  ]);

  const rubrics = rubricsSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Rubric),
  }));
  const activeRubricId =
    (settingsSnap.data() as EventSettings | undefined)?.activeRubricId ?? null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-4 text-lg font-semibold text-black dark:text-zinc-50">
          Rubrics
        </h1>
        <p className="mb-4 text-sm text-zinc-500">
          Teams are scored against whichever rubric is active. Keep a library
          of rubrics here and switch the active one per event.
        </p>
        <form action={createRubric} className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label
              htmlFor="name"
              className="block text-sm text-zinc-600 dark:text-zinc-400"
            >
              Name
            </label>
            <input
              id="name"
              name="name"
              required
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>
          <button
            type="submit"
            className="rounded bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
          >
            Add rubric
          </button>
        </form>
      </div>

      <div className="space-y-2">
        {rubrics.length === 0 && (
          <p className="text-sm text-zinc-500">No rubrics yet.</p>
        )}
        {rubrics.map((rubric) => {
          const isActive = rubric.id === activeRubricId;
          return (
            <div
              key={rubric.id}
              className="flex items-center justify-between border-b border-zinc-100 py-2 dark:border-zinc-900"
            >
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/rubrics/${rubric.id}`}
                  className="text-black hover:underline dark:text-zinc-50"
                >
                  {rubric.name}
                </Link>
                {isActive && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-900 dark:text-green-200">
                    Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                {!isActive && (
                  <form action={setActiveRubric.bind(null, rubric.id)}>
                    <button
                      type="submit"
                      className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
                    >
                      Set active
                    </button>
                  </form>
                )}
                <form action={deleteRubric.bind(null, rubric.id)}>
                  <button
                    type="submit"
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
