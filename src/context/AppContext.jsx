'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { createContext, useContext } from 'react'

export const AppContext = createContext()

export const useAppContext = () => {
    return useContext(AppContext)
}

export const AppContextProvider = (props) => {
    const currency = process.env.NEXT_PUBLIC_CURRENCY
    const router = useRouter()

    const { data: session, status, update } = useSession()

    // ✅ Use session data directly - no API calls needed
    const userData = session?.user || null
    const userRole = session?.user?.role || null
    const isLoading = status === 'loading'

    // Role definitions
    const ROLES = {
        USER: 'user',
        PATIENT: 'patient',
        DOCTOR: 'doctor',
        HOSPITAL_ADMIN: 'hospital_admin',
        ADMIN: 'admin',
    }

    // Update user role in database and session
    const updateUserRole = async (role) => {
        try {
            const response = await fetch('/api/user/set-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role })
            })

            if (response.ok) {
                // Update session with new role
                await update({ role })
            }
        } catch (error) {
            console.error('Error updating user role:', error)
            throw error
        }
    }

    // Role-based navigation
    const navigateToDashboard = () => {
        const roleMap = {
            [ROLES.USER]: '/user',
            [ROLES.PATIENT]: '/user',
            [ROLES.DOCTOR]: '/doctor',
            [ROLES.HOSPITAL_ADMIN]: '/hospital',
            [ROLES.ADMIN]: '/admin',
        }
        router.push(roleMap[userRole] || '/')
    }

    // Check if user has specific role
    const hasRole = (role) => userRole === role
    const hasAnyRole = (roles) => roles.includes(userRole)
    const isAdmin = () => userRole === ROLES.ADMIN
    const isAdminOrSubAdmin = () => userRole === ROLES.ADMIN

    // Get role display name
    const getRoleDisplayName = () => {
        const names = {
            [ROLES.USER]: 'User',
            [ROLES.PATIENT]: 'Patient',
            [ROLES.DOCTOR]: 'Doctor',
            [ROLES.HOSPITAL_ADMIN]: 'Hospital Admin',
            [ROLES.ADMIN]: 'Super Admin',
        }
        return names[userRole] || 'Guest'
    }

    const value = {
        // Session data - directly from NextAuth
        user: session?.user,
        userData,
        session,
        
        // App config
        currency,
        router,
        
        // Role management
        userRole,
        updateUserRole,
        
        // Navigation helpers
        navigateToDashboard,
        
        // Permission checks
        hasRole,
        hasAnyRole,
        isAdmin,
        isAdminOrSubAdmin,
        getRoleDisplayName,
        
        // Loading states
        isLoading,
        isAuthenticated: status === 'authenticated',
        
        // Constants
        ROLES
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}
