import { adminDb } from "@/lib/firebase/admin";
import type { Track } from "@/types/firestore";
import { createTrack, updateTrack, deleteTrack } from "./actions";

export default async function TracksPage() {
  const snap = await adminDb.collection("tracks").orderBy("name").get();
  const tracks = snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Track),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-4 text-lg font-semibold text-black dark:text-zinc-50">
          Tracks
        </h1>
        <form action={createTrack} className="flex flex-wrap items-end gap-3">
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
          <div className="space-y-1">
            <label
              htmlFor="minJudgesRequired"
              className="block text-sm text-zinc-600 dark:text-zinc-400"
            >
              Min judges to be eligible
            </label>
            <input
              id="minJudgesRequired"
              name="minJudgesRequired"
              type="number"
              min={1}
              defaultValue={2}
              className="w-40 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>
          <button
            type="submit"
            className="rounded bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
          >
            Add track
          </button>
        </form>
      </div>

      <div className="space-y-2">
        {tracks.length === 0 && (
          <p className="text-sm text-zinc-500">No tracks yet.</p>
        )}
        {tracks.map((track) => (
          <div
            key={track.id}
            className="flex flex-wrap items-center gap-3 border-b border-zinc-100 py-2 dark:border-zinc-900"
          >
            <form
              action={updateTrack.bind(null, track.id)}
              className="flex items-center gap-3"
            >
              <input
                name="name"
                defaultValue={track.name}
                required
                className="rounded border border-zinc-300 px-2 py-1 text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
              <input
                name="minJudgesRequired"
                type="number"
                min={1}
                defaultValue={track.minJudgesRequired}
                className="w-24 rounded border border-zinc-300 px-2 py-1 text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
              <button
                type="submit"
                className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
              >
                Save
              </button>
            </form>
            <form action={deleteTrack.bind(null, track.id)}>
              <button
                type="submit"
                className="text-sm text-red-600 hover:underline"
              >
                Delete
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
