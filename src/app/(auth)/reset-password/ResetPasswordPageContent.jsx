"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";

const passwordRules = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (v) => v.length >= 8,
  },
  {
    id: "uppercase",
    label: "One uppercase letter",
    test: (v) => /[A-Z]/.test(v),
  },
  {
    id: "lowercase",
    label: "One lowercase letter",
    test: (v) => /[a-z]/.test(v),
  },
  {
    id: "number",
    label: "One number",
    test: (v) => /\d/.test(v),
  },
];

export default function ResetPasswordPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rulesState, setRulesState] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validate token presence on mount
  useEffect(() => {
    if (!token) {
      setError("This reset link is invalid or has expired.");
    }
  }, [token]);

  // Update rule flags when password changes
  useEffect(() => {
    const next = {};
    passwordRules.forEach((rule) => {
      next[rule.id] = rule.test(password);
    });
    setRulesState(next);
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("This reset link is invalid or has expired.");
      return;
    }

    // basic validations
    const unmet = passwordRules.filter((r) => !r.test(password));
    if (unmet.length > 0) {
      setError("Please meet all password requirements.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Unable to reset password. The link may have expired.");
        return;
      }

      setSubmitted(true);
      toast.success("Password reset successful!");

      // redirect to sign-in after a delay
      setTimeout(() => {
        router.push(`/sign-in?reset=success`);
      }, 2500);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const allRulesPassed = passwordRules.every((r) => r.test(password));
  const passwordsMatch = password && password === confirmPassword;

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-[#F8FAFC] dark:bg-[#020617] flex items-center justify-center">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.1, 1], x: [0, 50, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] right-[-10%] w-[80vw] h-[80vw] bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, -50, 0], y: [0, 50, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-[100px]"
        />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <Link href="/" className="inline-flex items-center gap-2 group">
            <Image
              src="/logo.png"
              alt="Qlinic"
              width={40}
              height={40}
              className="w-10 h-10 drop-shadow-sm"
            />
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Qlinic
            </span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {!submitted ? (
            <div className="border-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl shadow-sm rounded-4xl ring-1 ring-white/50 dark:ring-white/10 p-8">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 mb-4">
                  <Lock className="w-7 h-7 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                  Create New Password
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Choose a strong password for your account
                </p>
                {email && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20">
                    <span className="text-xs text-blue-700 dark:text-blue-300">{email}</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 rounded-xl bg-white/50 dark:bg-slate-800/50 border-0 ring-1 ring-slate-200 dark:ring-slate-700 px-4 pr-10 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="Enter your new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full h-11 rounded-xl bg-white/50 dark:bg-slate-800/50 border-0 ring-1 ring-slate-200 dark:ring-slate-700 px-4 pr-10 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="Re-enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {password && confirmPassword && (
                    <p
                      className={`mt-2 text-xs flex items-center gap-1 ${
                        passwordsMatch ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {passwordsMatch ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Passwords match
                        </>
                      ) : (
                        "Passwords do not match"
                      )}
                    </p>
                  )}
                </div>

                {/* Password Requirements */}
                <div className="rounded-xl bg-slate-50/50 dark:bg-slate-800/30 p-4 space-y-2">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Password must include:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {passwordRules.map((rule) => {
                      const isValid = rulesState[rule.id];
                      return (
                        <div
                          key={rule.id}
                          className="flex items-center gap-2 text-xs"
                        >
                          <div
                            className={`flex items-center justify-center w-4 h-4 rounded-full transition-all ${
                              isValid
                                ? "bg-green-500 text-white"
                                : "bg-slate-200 dark:bg-slate-700"
                            }`}
                          >
                            {isValid && (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span
                            className={
                              isValid
                                ? "text-slate-700 dark:text-slate-300"
                                : "text-slate-500 dark:text-slate-400"
                            }
                          >
                            {rule.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
                    <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !token || !allRulesPassed || !passwordsMatch}
                  className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>

              {/* Back Link */}
              <div className="mt-6 text-center">
                <Link
                  href="/sign-in"
                  className="text-sm text-slate-500 hover:text-blue-600 font-medium inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </Link>
              </div>
            </div>
          ) : (
            // Success State
            <div className="border-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl shadow-sm rounded-4xl ring-1 ring-white/50 dark:ring-white/10 p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 mb-4"
              >
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
              </motion.div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                Password Reset Successful!
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Your password has been updated successfully.
                <br />
                Redirecting you to sign in...
              </p>
              <div className="flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}