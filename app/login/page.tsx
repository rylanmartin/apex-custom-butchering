"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSigningIn(true);
    setMessage("");

    const { error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (error) {
      setMessage(error.message);
      setSigningIn(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-4xl font-black">
          Admin Login
        </h1>

        <p className="mt-2 text-gray-600">
          Sign in to manage appointments and cut
          sheets.
        </p>

        <form
          onSubmit={handleLogin}
          className="mt-8 space-y-5"
        >
          <div>
            <label className="mb-2 block font-bold">
              Email
            </label>

            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-red-700"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="mb-2 block font-bold">
              Password
            </label>

            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-red-700"
              placeholder="Enter your password"
            />
          </div>

          {message && (
            <div className="rounded-lg bg-red-100 p-4 font-bold text-red-800">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={signingIn}
            className="w-full rounded-lg bg-red-700 px-5 py-3 text-lg font-bold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {signingIn
              ? "Signing In..."
              : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}