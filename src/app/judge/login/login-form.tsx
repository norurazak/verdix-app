"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { sendSignInLinkToEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { isRegisteredJudge } from "./actions";
import { EMAIL_STORAGE_KEY } from "../email-storage";

export function JudgeLoginForm() {
  const searchParams = useSearchParams();
  const denied = searchParams.get("denied") === "1";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    const registered = await isRegisteredJudge(trimmedEmail);
    if (!registered) {
      setStatus("error");
      setErrorMessage(
        "This email isn't registered as a judge. Contact the organizer.",
      );
      return;
    }

    try {
      await sendSignInLinkToEmail(auth, trimmedEmail, {
        url: `${window.location.origin}/judge/verify`,
        handleCodeInApp: true,
      });
      window.localStorage.setItem(EMAIL_STORAGE_KEY, trimmedEmail);
      setStatus("sent");
    } catch {
      setStatus("error");
      setErrorMessage("Couldn't send the sign-in link. Try again.");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="max-w-sm space-y-2 rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
            Check your email
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            We sent a sign-in link to {email}. Open it on this device to
            continue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
          Verdix Judge Sign-in
        </h1>

        {denied && (
          <p className="text-sm text-red-600">
            That account doesn&apos;t have judge access. Contact the
            organizer, or sign in below with a registered judge email.
          </p>
        )}
        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

        <div className="space-y-1">
          <label
            htmlFor="email"
            className="block text-sm text-zinc-600 dark:text-zinc-400"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>

        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {status === "sending" ? "Sending…" : "Send me a sign-in link"}
        </button>
      </form>
    </div>
  );
}
