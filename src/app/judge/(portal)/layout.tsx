import Link from "next/link";
import { requireJudge } from "@/lib/auth/session";
import { LogoutButton } from "@/components/logout-button";

export default async function JudgePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireJudge();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="flex flex-col gap-3 border-b border-zinc-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-zinc-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <span className="font-semibold text-black dark:text-zinc-50">
            Verdix Judge
          </span>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <Link
              href="/judge"
              className="text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
            >
              Teams
            </Link>
            <Link
              href="/judge/rubric"
              className="text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
            >
              Rubric
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-zinc-500">{user.name}</span>
          <LogoutButton redirectTo="/judge/login" />
        </div>
      </header>
      <main className="p-4 sm:p-6">{children}</main>
    </div>
  );
}
