// config/inngest.js
import { Inngest } from "inngest";
import { clerkClient } from '@clerk/nextjs/server';
import connectDB from "./db";
import User from "@/models/user";

export const inngest = new Inngest({ id: "QLINIC" });

// Function to create user and set role
export const syncUserCreation = inngest.createFunction(
    {
        id: 'sync-user-from-clerk'
    },
    { 
        event: 'clerk/user.created'
    },
    async ({ event, step }) => {
        // Step 1: Update Clerk publicMetadata with role
        await step.run("update-clerk-metadata", async () => {
            try {
                const { id, unsafe_metadata } = event.data;
                const role = unsafe_metadata?.role || 'patient';

                await clerkClient.users.updateUserMetadata(id, {
                    publicMetadata: {
                        role: role
                    }
                });

                console.log(`✅ Clerk metadata updated for user ${id} with role: ${role}`);
                return { success: true, role };
            } catch (error) {
                console.error('❌ Error updating Clerk metadata:', error);
                throw error;
            }
        });

        // Step 2: Save user to MongoDB
        await step.run("save-to-mongodb", async () => {
            try {
                const { id, first_name, last_name, email_addresses, image_url, unsafe_metadata } = event.data;
                const role = unsafe_metadata?.role || 'patient';
                
                const userData = {
                    clerkId: id,
                    email: email_addresses[0]?.email_address,
                    firstName: first_name || '',
                    lastName: last_name || '',
                    role: role,
                    profileImage: image_url || '',
                    isActive: true,
                    lastLogin: new Date()
                };
                
                await connectDB();
                
                // Check if user already exists
                const existingUser = await User.findOne({ clerkId: id });
                if (existingUser) {
                    console.log(`ℹ️ User ${id} already exists in MongoDB`);
                    return { exists: true, user: existingUser };
                }

                const createdUser = await User.create(userData);
                
                console.log('✅ User created in MongoDB:', createdUser._id);
                
                return {
                    success: true,
                    userId: createdUser._id,
                    clerkId: id,
                    role: role,
                    message: 'User created successfully'
                };
            } catch (error) {
                console.error('❌ Error in syncUserCreation:', error);
                throw error;
            }
        });

        // Step 3: Send welcome email (optional)
        await step.run("send-welcome-email", async () => {
            try {
                const { email_addresses, first_name } = event.data;
                const email = email_addresses[0]?.email_address;
                
                if (email) {
                    // TODO: Implement your email sending logic here
                    console.log(`📧 Welcome email would be sent to: ${email}`);
                    return { emailSent: true };
                }
                
                return { emailSent: false, reason: 'No email address' };
            } catch (emailError) {
                console.error('❌ Failed to send welcome email:', emailError);
                return { emailSent: false, error: emailError.message };
            }
        });

        return { success: true };
    }
);

// Function to update user
export const syncUserUpdate = inngest.createFunction(
    {
        id: 'update-user-from-clerk'
    },
    {
        event: 'clerk/user.updated'
    },
    async ({ event, step }) => {
        await step.run("update-mongodb-user", async () => {
            try {
                const { id, first_name, last_name, email_addresses, image_url } = event.data;
                
                const userData = {
                    email: email_addresses[0]?.email_address,
                    firstName: first_name || '',
                    lastName: last_name || '',
                    profileImage: image_url || '',
                    lastLogin: new Date()
                };
                
                await connectDB();
                const updatedUser = await User.findOneAndUpdate(
                    { clerkId: id },
                    userData,
                    { new: true }
                );
                
                if (updatedUser) {
                    console.log('✅ User updated in MongoDB:', updatedUser._id);
                    return {
                        success: true,
                        userId: updatedUser._id,
                        message: 'User updated successfully'
                    };
                } else {
                    console.log(`⚠️ User ${id} not found in MongoDB`);
                    return {
                        success: false,
                        message: 'User not found'
                    };
                }
            } catch (error) {
                console.error('❌ Error in syncUserUpdate:', error);
                throw error;
            }
        });

        return { success: true };
    }
);

// Function to delete user
export const syncUserDeletion = inngest.createFunction( 
    {
        id: 'delete-user-from-clerk'
    },
    {
        event: 'clerk/user.deleted'
    },
    async ({ event, step }) => {
        await step.run("soft-delete-mongodb-user", async () => {
            try {
                const { id } = event.data;
                await connectDB();
                
                // Soft delete - mark as inactive
                const deletedUser = await User.findOneAndUpdate(
                    { clerkId: id },
                    { 
                        isActive: false,
                        deletedAt: new Date()
                    },
                    { new: true }
                );
                
                if (deletedUser) {
                    console.log('✅ User soft deleted in MongoDB:', deletedUser._id);
                    return {
                        success: true,
                        userId: deletedUser._id,
                        message: 'User deleted successfully'
                    };
                } else {
                    console.log(`⚠️ User ${id} not found in MongoDB`);
                    return {
                        success: false,
                        message: 'User not found'
                    };
                }
            } catch (error) {
                console.error('❌ Error in syncUserDeletion:', error);
                throw error;
            }
        });

        return { success: true };
    }
);
