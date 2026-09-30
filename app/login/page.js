"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier,
          password,
          remember,
        }),
      });

      // Safely handle non-JSON responses
      const contentType = response.headers.get("content-type");

      let data = {};

      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();

        throw new Error(
          text || "The server returned an unexpected response."
        );
      }

      if (!response.ok) {
        throw new Error(data.error || "Unable to sign in.");
      }

      // Login successful.
      // The API should already have created the HTTP-only cookie.
      router.replace("/");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#090909] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-[420px]">

        {/* Login Card */}
        <div className="border border-[#252525] bg-[#101010] rounded-2xl p-7 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">

          {/* Header */}
          <div className="mb-7">
            <h2 className="text-xl font-semibold">
              Welcome back
            </h2>

            <p className="text-sm text-[#777] mt-2">
              Sign in to continue your career journey.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >

            {/* Email */}
            <div>
              <label
                htmlFor="identifier"
                className="block text-sm text-[#aaa] mb-2"
              >
                Email
              </label>

              <input
                id="identifier"
                name="identifier"
                type="email"
                value={identifier}
                onChange={(e) =>
                  setIdentifier(e.target.value)
                }
                placeholder="you@example.com"
                autoComplete="username"
                required
                className="
                  w-full h-12 px-4
                  rounded-xl
                  bg-[#151515]
                  border border-[#292929]
                  text-white
                  placeholder:text-[#555]
                  outline-none
                  transition
                  focus:border-[#555]
                  focus:bg-[#171717]
                "
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm text-[#aaa] mb-2"
              >
                Password
              </label>

              <div className="relative">

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="
                    w-full h-12 px-4 pr-16
                    rounded-xl
                    bg-[#151515]
                    border border-[#292929]
                    text-white
                    placeholder:text-[#555]
                    outline-none
                    transition
                    focus:border-[#555]
                    focus:bg-[#171717]

                    [&::-ms-reveal]:hidden
                    [&::-ms-clear]:hidden
                  "
                />

                {/* Custom Show / Hide button */}
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((prev) => !prev)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    text-[#666]
                    hover:text-white
                    transition
                    text-sm
                    select-none
                  "
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>
            </div>

            {/* Remember */}
            <div className="flex items-center gap-2">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) =>
                  setRemember(e.target.checked)
                }
                className="w-4 h-4 accent-white cursor-pointer"
              />

              <label
                htmlFor="remember"
                className="text-sm text-[#777] cursor-pointer"
              >
                Remember me
              </label>
            </div>

            {/* Sign In */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full h-12
                rounded-xl
                bg-white
                text-black
                font-medium
                text-sm
                hover:bg-[#e8e8e8]
                active:scale-[0.99]
                transition
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="h-px bg-[#292929] flex-1" />

            <span className="text-xs text-[#555]">
              OR
            </span>

            <div className="h-px bg-[#292929] flex-1" />
          </div>

          {/* Signup */}
          <p className="text-center text-sm text-[#666]">
            Don't have an account?{" "}

            <Link
              href="/signup"
              className="text-white hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#444] mt-6">
          CareerAI can make mistakes. Verify important
          information.
        </p>

      </div>
    </main>
  );
}
