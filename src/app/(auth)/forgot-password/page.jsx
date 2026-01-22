// app/(auth)/forgot-password/page.jsx
"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Mail, Loader2, CheckCircle2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    if (!email) {
      setError("Please enter your email.")
      return
    }

    try {
      setLoading(true)
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      // Always treat as success in UI (do not reveal if user exists)
      if (!res.ok) {
        console.error("Forgot password error:", await res.text())
      }

      setSubmitted(true)
    } catch (err) {
      console.error(err)
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

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
          <div className="border-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl shadow-sm rounded-4xl ring-1 ring-white/50 dark:ring-white/10 p-8">
            {!submitted ? (
              <>
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 mb-4">
                    <Mail className="w-7 h-7 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                    Reset Your Password
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Enter your email and we'll send you a reset link
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email Input */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 rounded-xl bg-white/50 dark:bg-slate-800/50 border-0 ring-1 ring-slate-200 dark:ring-slate-700 px-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="you@hospital.com"
                      required
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
                      <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
                    </div>
                  )}

                  {/* Security Note */}
                  <div className="rounded-xl bg-slate-50/50 dark:bg-slate-800/30 p-3">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      The reset link will expire in 1 hour for your security.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending Link...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Send Reset Link
                      </>
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
              </>
            ) : (
              // Success State
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 mb-4"
                >
                  <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                </motion.div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                  Check Your Email
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  If an account exists for <span className="font-semibold text-slate-700 dark:text-slate-300">{email}</span>, 
                  we've sent a password reset link. Please check your inbox and spam folder.
                </p>

                {/* Instructions */}
                <div className="rounded-xl bg-blue-50/50 dark:bg-blue-900/20 p-4 mb-6 text-left">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Next Steps:
                  </h4>
                  <ol className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex gap-2">
                      <span className="font-semibold">1.</span>
                      <span>Check your email inbox</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold">2.</span>
                      <span>Click the reset link (expires in 1 hour)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold">3.</span>
                      <span>Create your new password</span>
                    </li>
                  </ol>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => setSubmitted(false)}
                    className="w-full h-11 rounded-xl bg-white/60 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-slate-700 hover:bg-white/80 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-medium transition-all"
                  >
                    Use Different Email
                  </button>
                  <Link
                    href="/sign-in"
                    className="block w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </div>
            )}

            {/* Help Section */}
            <div className="mt-6 pt-6 border-t border-slate-200/50 dark:border-slate-700/50 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Need help?{" "}
                <Link href="/contact" className="font-medium text-blue-600 hover:text-blue-700">
                  Contact support
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
