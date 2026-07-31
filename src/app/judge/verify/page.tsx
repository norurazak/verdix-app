"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { EMAIL_STORAGE_KEY } from "../email-storage";

export default function JudgeVerifyPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"working" | "needEmail" | "error">(
    "working",
  );
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      if (!isSignInWithEmailLink(auth, window.location.href)) {
        setStatus("error");
        setErrorMessage("This isn't a valid sign-in link.");
        return;
      }
      const storedEmail = window.localStorage.getItem(EMAIL_STORAGE_KEY);
      if (storedEmail) {
        await completeSignIn(storedEmail);
      } else {
        setStatus("needEmail");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function completeSignIn(emailToUse: string) {
    setStatus("working");
    try {
      const credential = await signInWithEmailLink(
        auth,
        emailToUse,
        window.location.href,
      );
      window.localStorage.removeItem(EMAIL_STORAGE_KEY);
      const idToken = await credential.user.getIdToken();
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) throw new Error("session failed");
      router.push("/judge");
      router.refresh();
    } catch {
      setStatus("error");
      setErrorMessage("This link is invalid or has expired. Request a new one.");
    }
  }

  function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    void completeSignIn(email.trim());
  }

  if (status === "needEmail") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <form
          onSubmit={handleEmailSubmit}
          className="w-full max-w-sm space-y-4 rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
            Confirm your email
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Opened this link on a different device? Enter your email to
            confirm.
          </p>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <button
            type="submit"
            className="w-full rounded bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
          >
            Continue
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="max-w-sm space-y-2 rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
        {status === "error" ? (
          <>
            <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
              Sign-in failed
            </h1>
            <p className="text-sm text-red-600">{errorMessage}</p>
            <a
              href="/judge/login"
              className="text-sm text-zinc-600 underline dark:text-zinc-400"
            >
              Request a new link
            </a>
          </>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Signing you in…
          </p>
        )}
      </div>
    </div>
  );
}
