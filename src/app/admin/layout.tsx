import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { LogoutButton } from "@/components/logout-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="flex flex-col gap-3 border-b border-zinc-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-zinc-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <span className="font-semibold text-black dark:text-zinc-50">
            Verdix Admin
          </span>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <Link
              href="/admin/tracks"
              className="text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
            >
              Tracks
            </Link>
            <Link
              href="/admin/teams"
              className="text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
            >
              Teams
            </Link>
            <Link
              href="/admin/judges"
              className="text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
            >
              Judges
            </Link>
            <Link
              href="/admin/rubrics"
              className="text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
            >
              Rubrics
            </Link>
            <Link
              href="/admin/dashboard"
              className="text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
            >
              Dashboard
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-zinc-500">{user.name}</span>
          <LogoutButton redirectTo="/login" />
        </div>
      </header>
      <main className="p-4 sm:p-6">{children}</main>
    </div>
  );
}
