import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import type { Profile } from "@/types/firestore";

export const SESSION_COOKIE_NAME = "session";
export const SESSION_EXPIRES_IN_MS = 60 * 60 * 24 * 5 * 1000; // 5 days

export type SessionUser = Profile & { uid: string };

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const profileSnap = await adminDb.collection("profiles").doc(decoded.uid).get();
    if (!profileSnap.exists) return null;
    return { uid: decoded.uid, ...(profileSnap.data() as Profile) };
  } catch {
    return null;
  }
}

/** Server Components/Actions call this to gate admin-only pages and mutations. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    redirect("/login");
  }
  return user;
}

/** Server Components/Actions call this to gate judge-only pages and mutations. */
export async function requireJudge(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/judge/login");
  }
  if (user.role !== "judge") {
    redirect("/judge/login?denied=1");
  }
  return user;
}
