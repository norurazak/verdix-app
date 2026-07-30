import Link from "next/link";

export default function AdminHome() {
  return (
    <div className="space-y-2">
      <h1 className="text-lg font-semibold text-black dark:text-zinc-50">
        Dashboard
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Start by setting up{" "}
        <Link href="/admin/tracks" className="underline">
          tracks
        </Link>
        , then add{" "}
        <Link href="/admin/teams" className="underline">
          teams
        </Link>
        .
      </p>
    </div>
  );
}
