import { Inngest } from "inngest";
import connectDB from "./db";
import User from "@/models/user";

export const inngest = new Inngest({ id: "QLINIC" });

// User sync functions remain unchanged...
export const syncUserCreation = inngest.createFunction(
    {
        id: 'sync-user-from-clerk'
    },
    { 
        event: 'clerk/user.created'
    },
    async ({event}) => {
        try {
            const {id, first_name, last_name, email_addresses, image_url} = event.data;
            
            const userData = {
                _id: id,
                email: email_addresses[0]?.email_address,
                name: `${first_name || ''} ${last_name || ''}`.trim(),
                firstName: first_name,
                lastName: last_name,
                imageUrl: image_url,
                emailAddresses: email_addresses
            };
            
            await connectDB();
            const createdUser = await User.create(userData);
            
            // Send welcome email
            if (userData.email) {
                try {
                    await sendWelcomeEmail(userData.email, userData.name);
                    console.log('✅ Welcome email sent to new user:', userData.email);
                } catch (emailError) {
                    console.error('❌ Failed to send welcome email:', emailError);
                }
            }
            
            return {
                success: true,
                userId: createdUser._id,
                message: 'User created successfully'
            };
        } catch (error) {
            console.error('Error in syncUserCreation:', error);
            throw error;
        }
    }
);

export const syncUserUpdate = inngest.createFunction(
    {
        id: 'update-user-from-clerk'
    },
    {
        event: 'clerk/user.updated'
    },
    async ({event}) => {
        try {
            const {id, first_name, last_name, email_addresses, image_url} = event.data;
            
            const userData = {
                email: email_addresses[0]?.email_address,
                name: `${first_name || ''} ${last_name || ''}`.trim(),
                firstName: first_name,
                lastName: last_name,
                imageUrl: image_url,
                emailAddresses: email_addresses,
                updatedAt: new Date()
            };
            
            await connectDB();
            const updatedUser = await User.findByIdAndUpdate(id, userData, { new: true });
            
            return {
                success: true,
                userId: updatedUser?._id,
                message: 'User updated successfully'
            };
        } catch (error) {
            console.error('Error in syncUserUpdate:', error);
            throw error;
        }
    }
);

export const syncUserDeletion = inngest.createFunction( 
    {
        id: 'delete-user-from-clerk'
    },
    {
        event: 'clerk/user.deleted'
    },
    async ({event}) => {
        try {
            const {id} = event.data;
            await connectDB();
            
            await Order.updateMany(
                { userId: id },
                { 
                    $set: { 
                        userId: 'deleted-user',
                        userDeleted: true,
                        deletedAt: new Date()
                    }
                }
            );
            
            await User.findByIdAndDelete(id);
            
            return {
                success: true,
                userId: id,
                message: 'User deleted successfully'
            };
        } catch (error) {
            console.error('Error in syncUserDeletion:', error);
            throw error;
        }
    }
);