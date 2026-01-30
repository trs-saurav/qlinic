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

    const userData = session?.user || null
    const userRole = session?.user?.role || null
    const isLoading = status === 'loading'

    const ROLES = {
        USER: 'user',
        PATIENT: 'patient',
        DOCTOR: 'doctor',
        HOSPITAL_ADMIN: 'hospital_admin',
        ADMIN: 'admin',
    }

    // --- HELPER: Absolute URL Generation ---
    const getAbsoluteDashboardURL = (role) => {
        const isDevelopment = process.env.NODE_ENV === 'development';
        const mainDomain = "qlinichealth.com";
        const protocol = isDevelopment ? "http" : "https";
        const port = isDevelopment ? ":3000" : "";

        const roleToSubdomain = {
            [ROLES.USER]: 'user',
            [ROLES.PATIENT]: 'user',
            [ROLES.DOCTOR]: 'doctor',
            [ROLES.HOSPITAL_ADMIN]: 'hospital', // Maps hospital_admin to 'hospital' subdomain
            [ROLES.ADMIN]: 'admin'
        };

        const sub = roleToSubdomain[role];
        if (!sub) return `${protocol}://${mainDomain}${port}/`;
        
        return `${protocol}://${sub}.${mainDomain}${port}/`;
    };

    const updateUserRole = async (role) => {
        try {
            const response = await fetch('/api/user/set-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role })
            })

            if (response.ok) {
                await update({ role })
            }
        } catch (error) {
            console.error('Error updating user role:', error)
            throw error
        }
    }

    // ✅ FIXED: Navigate using window.location for cross-subdomain support
    const navigateToDashboard = () => {
        if (!userRole) {
            window.location.href = "/";
            return;
        }
        // Redirect to the absolute subdomain root
        window.location.href = getAbsoluteDashboardURL(userRole);
    }

    const hasRole = (role) => userRole === role
    const hasAnyRole = (roles) => roles.includes(userRole)
    const isAdmin = () => userRole === ROLES.ADMIN
    const isAdminOrSubAdmin = () => userRole === ROLES.ADMIN

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
        user: session?.user,
        userData,
        session,
        currency,
        router,
        userRole,
        updateUserRole,
        navigateToDashboard,
        hasRole,
        hasAnyRole,
        isAdmin,
        isAdminOrSubAdmin,
        getRoleDisplayName,
        isLoading,
        isAuthenticated: status === 'authenticated',
        ROLES
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}