'use server'

import { auth } from '@/auth'
import connectDB from '@/config/db'
import User from '@/models/user'

export async function updateUserRole({ role }) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Not authenticated')
  }

  if (!['user', 'doctor', 'hospital_admin'].includes(role)) {
    throw new Error('Invalid role')
  }

  await connectDB()

  const user = await User.findById(session.user.id)
  if (!user) {
    throw new Error('User not found')
  }

  // Only allow role assignment if the user is a new generic user.
  // This prevents existing users from changing their role this way.
  if (user.role !== 'user') {
    // Or if you want to be more strict, check if the user was created recently.
    // const fiveMinutes = 5 * 60 * 1000;
    // if (Date.now() - user.createdAt.getTime() > fiveMinutes) {
    //   throw new Error('Role assignment window expired');
    // }
    console.log(`User already has role: ${user.role}. Not updating to ${role}.`);
    return { success: true, message: 'Role already assigned.' };
  }

  user.role = role
  await user.save()

  console.log(`User role updated to: ${role} for user: ${user.email}`);

  return { success: true }
}
