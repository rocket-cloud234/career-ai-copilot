"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    dob: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // -----------------------------------------
  // Handle input changes
  // -----------------------------------------

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  // -----------------------------------------
  // Submit registration
  // -----------------------------------------

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Check password match
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Check minimum password length
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed.");
      }

      setSuccess("Account created successfully.");

      // Redirect after successful registration
      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#090909] text-white flex items-center justify-center px-6 py-8">
      <div className="w-full max-w-[720px]">

        {/* Signup Card */}
        <div className="border border-[#252525] bg-[#101010] rounded-2xl p-8 md:p-9 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">

          {/* Header */}
          <div className="mb-7">
            <h1 className="text-2xl font-semibold tracking-tight">
              Create your account
            </h1>

            <p className="text-sm text-[#777] mt-2">
              Start building your career journey with CareerAI.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name + DOB */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Full Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm text-[#aaa] mb-2"
                >
                  Full name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Your name"
                  autoComplete="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="
                    w-full h-11 px-4
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

              {/* Date of Birth */}
              <div>
                <label
                  htmlFor="dob"
                  className="block text-sm text-[#aaa] mb-2"
                >
                  Date of birth
                </label>

                <input
                  id="dob"
                  name="dob"
                  type="date"
                  autoComplete="bday"
                  value={form.dob}
                  onChange={handleChange}
                  required
                  className="
                    w-full h-11 px-4
                    rounded-xl
                    bg-[#151515]
                    border border-[#292929]
                    text-white
                    outline-none
                    transition
                    focus:border-[#555]
                    focus:bg-[#171717]
                    [color-scheme:dark]
                  "
                />
              </div>

            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm text-[#aaa] mb-2"
              >
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                required
                className="
                  w-full h-11 px-4
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

            {/* Password + Confirm Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

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
                    placeholder="Create a password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="
                      w-full h-11 px-4 pr-14
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

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => !prev)
                    }
                    className="
                      absolute right-3 top-1/2
                      -translate-y-1/2
                      text-xs text-[#666]
                      hover:text-white
                      transition
                    "
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm text-[#aaa] mb-2"
                >
                  Confirm password
                </label>

                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                    className="
                      w-full h-11 px-4 pr-14
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

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((prev) => !prev)
                    }
                    className="
                      absolute right-3 top-1/2
                      -translate-y-1/2
                      text-xs text-[#666]
                      hover:text-white
                      transition
                    "
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="rounded-xl border border-green-900/50 bg-green-950/20 px-4 py-3 text-sm text-green-400">
                {success}
              </div>
            )}

            {/* Create Account */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full h-11
                rounded-xl
                bg-white
                text-black
                font-medium
                text-sm
                hover:bg-[#e8e8e8]
                disabled:opacity-50
                disabled:cursor-not-allowed
                active:scale-[0.99]
                transition
              "
            >
              {loading ? "Creating account..." : "Create account"}
            </button>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="h-px bg-[#292929] flex-1" />

            <span className="text-[11px] text-[#555]">
              OR
            </span>

            <div className="h-px bg-[#292929] flex-1" />
          </div>

          {/* Login */}
          <p className="text-center text-sm text-[#666]">
            Already have an account?{" "}

            <Link
              href="/login"
              className="text-white hover:underline"
            >
              Sign in
            </Link>
          </p>

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#444] mt-5">
          CareerAI can make mistakes. Verify important information.
        </p>

      </div>
    </main>
  );
}
