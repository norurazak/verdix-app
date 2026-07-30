export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Verdix
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Rebuild in progress — see verdix-project-spec.md.
        </p>
      </div>
    </div>
  );
}
