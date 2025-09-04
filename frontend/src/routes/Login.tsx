// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import supabase from "@/supabaseClient";

// ✅ White logo for dark background (place file in /public)
const LearnoLogo = "/learno-logo-light.png";

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, go straight to /admin
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (mounted && session) navigate("/admin", { replace: true });
      } catch (e: any) {
        console.warn("Session check failed:", e?.message || e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  // Handle magic-link callback (optional: shows friendly state)
  useEffect(() => {
    const type = params.get("type");
    if (type === "magiclink") {
      setSentTo("your email");
    }
  }, [params]);

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim();
    if (!trimmed || !/\S+@\S+\.\S+/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/admin`
              : undefined,
        },
      });
      if (error) throw error;
      setSentTo(trimmed);
    } catch (err: any) {
      setError(err?.message || "Could not send magic link. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  async function signInWithGoogle() {
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/admin`
              : undefined,
        },
      });
      if (error) throw error;
      // Redirection will happen by Supabase
    } catch (err: any) {
      setError(err?.message || "Google sign-in failed.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        {/* Brand header */}
        <div className="text-center mb-8">
          <img
            src={LearnoLogo}
            alt="Learno"
            className="mx-auto h-16 sm:h-20 md:h-24 mb-4"
          />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-sky-300">
            Sign in to Learno
          </h1>
          <p className="mt-3 text-lg md:text-xl text-slate-300">
            Access your Admin Panel and manage your eLearning content.
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl shadow-xl p-6 sm:p-8 md:p-10">
          {!sentTo ? (
            <>
              {/* Errors */}
              {error && (
                <div className="mb-6 rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={signInWithEmail} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-base md:text-lg font-medium text-slate-200 mb-2"
                  >
                    Work email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full rounded-xl bg-slate-800/70 border border-slate-700 focus:outline-none focus:ring-4 focus:ring-sky-600/30 focus:border-sky-500 px-5 py-4 text-lg md:text-xl placeholder-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-60 disabled:cursor-not-allowed px-6 py-4 text-lg md:text-xl font-semibold shadow-lg shadow-sky-900/30 transition"
                >
                  {isSending ? "Sending magic link…" : "Send magic link"}
                </button>
              </form>

              <div className="mt-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-800" />
                <span className="text-slate-400 text-sm md:text-base">or</span>
                <div className="h-px flex-1 bg-slate-800" />
              </div>

              <button
                onClick={signInWithGoogle}
                className="mt-6 w-full rounded-2xl bg-white text-slate-900 hover:bg-slate-100 px-6 py-4 text-lg md:text-xl font-semibold shadow-lg transition flex items-center justify-center gap-3"
              >
                {/* Simple G icon (no extra deps) */}
                <span
                  aria-hidden
                  className="inline-flex h-6 w-6 items-center justify-center rounded bg-white"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5">
                    <path
                      fill="#EA4335"
                      d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.7-2.6-5.7-5.7S8.9 6 12 6c1.8 0 3.1.8 3.8 1.4l2.6-2.5C17.1 3.7 14.7 2.7 12 2.7 6.9 2.7 2.7 6.9 2.7 12S6.9 21.3 12 21.3c6 0 9.9-4.2 9.9-10.1 0-.7-.1-1.2-.2-1.7H12z"
                    />
                  </svg>
                </span>
                Continue with Google
              </button>

              <p className="mt-6 text-center text-sm md:text-base text-slate-400">
                By continuing, you agree to our{" "}
                <a href="#" className="text-sky-400 hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-sky-400 hover:underline">
                  Privacy Policy
                </a>
                .
              </p>
            </>
          ) : (
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-sky-300">
                Check your inbox
              </h2>
              <p className="mt-3 text-lg md:text-xl text-slate-300">
                We sent a magic sign-in link to{" "}
                <span className="font-semibold">{sentTo}</span>.
              </p>
              <p className="mt-2 text-base md:text-lg text-slate-400">
                Click it on this device to finish signing in.
              </p>

              <button
                onClick={() => setSentTo(null)}
                className="mt-8 inline-flex rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 px-5 py-3 text-base md:text-lg"
              >
                Use a different email
              </button>
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-sm md:text-base text-slate-500">
          Trouble signing in?{" "}
          <a href="mailto:support@learno.com.au" className="text-sky-400 hover:underline">
            Contact support
          </a>
          .
        </p>
      </div>
    </div>
  );
}