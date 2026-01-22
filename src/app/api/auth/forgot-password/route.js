// app/api/auth/forgot-password/route.js
import { NextResponse } from "next/server"
import crypto from "crypto"
import bcrypt from "bcryptjs"
import connectDB from "@/config/db"
import User from "@/models/user"
import PasswordResetToken from "@/models/PasswordResetToken"
import sendMail from "@/lib/sendMail"

export async function POST(req) {
  try {
    const { email } = await req.json()
    
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    await connectDB()
    const user = await User.findOne({ email: email.toLowerCase() })

    // Always return success to prevent email enumeration attacks
    if (user) {
      // Generate cryptographically secure random token
      const token = crypto.randomBytes(32).toString("hex")
      
      // ✅ CRITICAL FIX: Hash the token before storing
      const hashedToken = await bcrypt.hash(token, 10)

      // Delete any existing reset tokens for this user
      await PasswordResetToken.deleteMany({ userId: user._id })

      // Store hashed token with user email for validation
      await PasswordResetToken.create({
        userId: user._id,
        email: email.toLowerCase(),
        token: hashedToken, // Store hashed version only
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      })

      // Send plain token via email (never stored anywhere)
      const resetUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`

      await sendMail({
        to: email,
        subject: "Reset your Qlinic password",
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937;">
            <div style="background: #3b82f6; padding: 24px; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Qlinic</h1>
            </div>
            <div style="background: #f9fafb; padding: 32px; border-radius: 0 0 8px 8px;">
              <h2 style="color: #1f2937; margin-top: 0;">Reset your password</h2>
              <p>Hi ${user.firstName || user.email},</p>
              <p>We received a request to reset your Qlinic account password. Click the button below to create a new password:</p>
              <div style="margin: 32px 0; text-align: center;">
                <a 
                  href="${resetUrl}" 
                  style="display: inline-block; background: #3b82f6; color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;"
                >
                  Reset Password
                </a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                <strong>⏰ This link will expire in 1 hour</strong> for security reasons.
              </p>
              <p style="color: #6b7280; font-size: 14px;">
                If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                If the button doesn't work, copy and paste this link into your browser:<br/>
                <span style="word-break: break-all; color: #6b7280;">${resetUrl}</span>
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin-top: 16px;">
                © ${new Date().getFullYear()} Qlinic. All rights reserved.
              </p>
            </div>
          </div>
        `,
      })
    }

    // Always return the same response (prevents email enumeration)
    return NextResponse.json({ 
      ok: true,
      message: "If that email is registered, you'll receive reset instructions shortly." 
    })
    
  } catch (e) {
    console.error("Forgot password error:", e)
    return NextResponse.json(
      { error: "Unable to process request. Please try again later." }, 
      { status: 500 }
    )
  }
}
