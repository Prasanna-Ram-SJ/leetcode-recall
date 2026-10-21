"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  validateEmail,
  validateUsername,
  validatePassword,
  normalizeUsername,
} from "@/lib/auth-helpers";
import {
  Mail,
  Lock,
  User,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  MailWarning,
} from "lucide-react";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Email validation
    const emailVal = validateEmail(email);
    if (!emailVal.isValid) {
      setError(emailVal.error || "Please enter a valid email address.");
      return;
    }

    // Mode-specific validation
    if (mode === "signup") {
      const userVal = validateUsername(username);
      if (!userVal.isValid) {
        setError(userVal.error || "Invalid username.");
        return;
      }

      const passVal = validatePassword(password);
      if (!passVal.isValid) {
        setError(passVal.error || "Password must be at least 8 characters.");
        return;
      }
    } else if (mode === "login") {
      const passVal = validatePassword(password);
      if (!passVal.isValid) {
        setError(passVal.error || "Password must be at least 8 characters.");
        return;
      }
    }

    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "signup") {
        // Detect device IANA timezone
        let userTz = "UTC";
        try {
          userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
        } catch {
          userTz = "UTC";
        }

        const normalized = normalizeUsername(username);

        // 1. Sign up user with metadata
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              username: username.trim(),
              username_normalized: normalized,
              timezone: userTz,
            },
          },
        });

        if (signUpErr) {
          if (
            signUpErr.message.toLowerCase().includes("already registered") ||
            signUpErr.message.toLowerCase().includes("unique")
          ) {
            setError("An account with this email address already exists.");
          } else {
            setError(signUpErr.message);
          }
          setLoading(false);
          return;
        }

        // 2. Sign in user to ensure session is active (for email confirmation off)
        if (!signUpData.session) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

          if (signInErr) {
            setError(signInErr.message);
            setLoading(false);
            return;
          }
        }

        // 3. Upsert profile record
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (currentUser) {
          await supabase.from("profiles").upsert({
            id: currentUser.id,
            username: username.trim(),
            username_normalized: normalized,
            timezone: userTz,
          });
        }

        // 4. Open dashboard directly
        router.push("/dashboard");
        router.refresh();
        return;
      } else if (mode === "login") {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInErr) {
          setError("Incorrect email address or password.");
          setLoading(false);
          return;
        }

        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-7 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none">
        {/* Toggle between Login and Sign Up (only when not in forgot password mode) */}
        {mode !== "forgot" && (
          <div className="flex p-1 bg-slate-100 dark:bg-zinc-800 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
                mode === "login"
                  ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
                mode === "signup"
                  ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Heading */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {mode === "login"
              ? "Welcome back"
              : mode === "signup"
              ? "Create your account"
              : "Password Reset"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            {mode === "login"
              ? "Sign in with your email and password to access your recall lists."
              : mode === "signup"
              ? "Register with your email, username, and password to start immediately."
              : "Self-service password reset information."}
          </p>
        </div>

        {/* Forgot Password Mode: Clear Explanation that Reset is Unavailable until SMTP is configured */}
        {mode === "forgot" ? (
          <div className="space-y-5">
            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 space-y-3">
              <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-300 font-bold text-sm">
                <MailWarning className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                Password Reset Unavailable
              </div>
              <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">
                Password reset via email is currently unavailable because email sending has not been configured with a custom SMTP provider in your Supabase project dashboard.
              </p>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                To recover an account, please reach out to your project administrator or configure custom SMTP settings in your Supabase Dashboard.
              </p>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className="btn-yellow px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Log In
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Username Field (Sign up only) */}
            {mode === "signup" && (
              <div>
                <label
                  htmlFor="username"
                  className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5"
                >
                  Username (Display Name)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. binary_wizard"
                    required
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                  3–24 characters: letters, numbers, or underscores.
                </p>
              </div>
            )}

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider"
                >
                  Password
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setError(null);
                    }}
                    className="text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                Minimum 8 characters.
              </p>
            </div>

            {/* Security note */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 flex items-start gap-2.5 text-xs text-slate-600 dark:text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <p>
                Passwords are encrypted and authenticated directly via Supabase Auth.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl btn-yellow text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {mode === "login" ? "Log In" : "Create Account & Start"}
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
