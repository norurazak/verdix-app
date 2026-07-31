const inputClass =
  "w-full rounded border border-zinc-300 px-3 py-2 text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
const labelClass = "block text-sm text-zinc-600 dark:text-zinc-400";

export function JudgeForm({
  tracks,
  defaultValues,
  submitLabel,
}: {
  tracks: { id: string; name: string }[];
  defaultValues?: { name?: string; email?: string; trackIds?: string[] };
  submitLabel: string;
}) {
  const selected = new Set(defaultValues?.trackIds ?? []);

  return (
    <div className="grid max-w-md gap-4">
      <div className="space-y-1">
        <label className={labelClass} htmlFor="name">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={defaultValues?.email}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass} htmlFor="password">
          Password (optional)
        </label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Leave blank to keep magic-link-only sign-in"
          minLength={6}
          className={inputClass}
        />
        <p className="text-xs text-zinc-500">
          Judges normally sign in via a magic link emailed to them. Set a
          password here as a fallback if email delivery is unreliable — the
          judge can then sign in with either method.
        </p>
      </div>

      <div className="space-y-1">
        <span className={labelClass}>Assigned track(s)</span>
        <div className="space-y-1">
          {tracks.length === 0 && (
            <p className="text-sm text-zinc-500">No tracks yet.</p>
          )}
          {tracks.map((track) => (
            <label
              key={track.id}
              className="flex items-center gap-2 text-sm text-black dark:text-zinc-50"
            >
              <input
                type="checkbox"
                name="trackIds"
                value={track.id}
                defaultChecked={selected.has(track.id)}
              />
              {track.name}
            </label>
          ))}
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
