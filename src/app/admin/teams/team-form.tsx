import type { Team } from "@/types/firestore";

const inputClass =
  "w-full rounded border border-zinc-300 px-3 py-2 text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
const labelClass = "block text-sm text-zinc-600 dark:text-zinc-400";

export function TeamForm({
  tracks,
  defaultValues,
  submitLabel,
}: {
  tracks: { id: string; name: string }[];
  defaultValues?: Partial<Team>;
  submitLabel: string;
}) {
  return (
    <div className="grid max-w-2xl gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className={labelClass} htmlFor="teamName">
            Team name
          </label>
          <input
            id="teamName"
            name="teamName"
            required
            defaultValue={defaultValues?.teamName}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass} htmlFor="trackId">
            Track
          </label>
          <select
            id="trackId"
            name="trackId"
            required
            defaultValue={defaultValues?.trackId ?? ""}
            className={inputClass}
          >
            <option value="" disabled>
              Select a track
            </option>
            {tracks.map((track) => (
              <option key={track.id} value={track.id}>
                {track.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className={labelClass} htmlFor="teamLeaders">
            Team leaders
          </label>
          <input
            id="teamLeaders"
            name="teamLeaders"
            defaultValue={defaultValues?.teamLeaders}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass} htmlFor="studentId">
            Student ID
          </label>
          <input
            id="studentId"
            name="studentId"
            defaultValue={defaultValues?.studentId}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className={labelClass} htmlFor="university">
            University
          </label>
          <input
            id="university"
            name="university"
            defaultValue={defaultValues?.university}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass} htmlFor="faculty">
            Faculty
          </label>
          <input
            id="faculty"
            name="faculty"
            defaultValue={defaultValues?.faculty}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass} htmlFor="programme">
            Programme
          </label>
          <input
            id="programme"
            name="programme"
            defaultValue={defaultValues?.programme}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className={labelClass} htmlFor="industries">
            Industries (comma-separated)
          </label>
          <input
            id="industries"
            name="industries"
            defaultValue={defaultValues?.industries?.join(", ")}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass} htmlFor="stage">
            Stage
          </label>
          <input
            id="stage"
            name="stage"
            defaultValue={defaultValues?.stage}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className={labelClass} htmlFor="valueProposition">
          Value proposition
        </label>
        <textarea
          id="valueProposition"
          name="valueProposition"
          rows={3}
          defaultValue={defaultValues?.valueProposition}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className={labelClass} htmlFor="videoLink">
            Video link (optional)
          </label>
          <input
            id="videoLink"
            name="videoLink"
            type="url"
            defaultValue={defaultValues?.videoLink ?? ""}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass} htmlFor="deckLink">
            Deck link
          </label>
          <input
            id="deckLink"
            name="deckLink"
            type="url"
            required
            defaultValue={defaultValues?.deckLink}
            className={inputClass}
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-fit rounded bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
      >
        {submitLabel}
      </button>
    </div>
  );
}
