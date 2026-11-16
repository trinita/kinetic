"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/admin/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  const field =
    "border-border bg-bg focus:border-accent mt-1 w-full rounded-xl border px-4 py-3 text-base outline-none focus-visible:outline-none";
  return (
    <form action={action} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-sm font-semibold">Nama pengguna</span>
        <input name="username" required autoComplete="username" autoCapitalize="none" className={field} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Kata sandi</span>
        <input name="password" type="password" required autoComplete="current-password" className={field} />
      </label>
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-red-700 dark:text-red-400">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-accent-strong text-on-accent-strong w-full rounded-full px-6 py-3 font-semibold hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Memeriksa…" : "Masuk"}
      </button>
    </form>
  );
}
