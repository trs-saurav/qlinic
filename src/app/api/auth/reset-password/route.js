import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import connectDB from "@/config/db"
import User from "@/models/user"
import PasswordResetToken from "@/models/PasswordResetToken"

export async function POST(req) {
  try {
    const { token, email, password } = await req.json()

    if (!token || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await connectDB()

    // 1. Find the user
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    // 2. Find the token record
    const resetToken = await PasswordResetToken.findOne({ userId: user._id })
    if (!resetToken) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
    }

    // 3. Verify token hash (since we hashed it in forgot-password route)
    const isValidToken = await bcrypt.compare(token, resetToken.token)
    if (!isValidToken) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
    }

    // 4. Check expiration
    if (resetToken.expiresAt < new Date()) {
      await PasswordResetToken.deleteOne({ _id: resetToken._id })
      return NextResponse.json({ error: "Token expired" }, { status: 400 })
    }

    // 5. Update password (pre-save hook in User model will hash it)
    user.password = password
    await user.save()

    // 6. Delete used token
    await PasswordResetToken.deleteOne({ _id: resetToken._id })

    return NextResponse.json({ message: "Password reset successfully" })

  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}