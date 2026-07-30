import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import LogoutButton from "./logout-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-black dark:text-zinc-50">
            Verdix Admin
          </span>
          <nav className="flex items-center gap-4 text-sm">
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
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-zinc-500">{user.name}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
