'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'

export const AppContext = createContext()

export const useAppContext = () => {
    return useContext(AppContext)
}

export const AppContextProvider = (props) => {
    const currency = process.env.NEXT_PUBLIC_CURRENCY
    const router = useRouter()

    const { data: session, status, update } = useSession()
    const [userData, setUserData] = useState(null)
    const [userRole, setUserRole] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    // Role definitions
    const ROLES = {
        PATIENT: 'patient',
        DOCTOR: 'doctor',
        HOSPITAL_ADMIN: 'hospital_admin',
        ADMIN: 'admin',
        SUB_ADMIN: 'sub_admin'
    }

    // Fetch user data from database
    useEffect(() => {
        const fetchUserData = async () => {
            if (status === 'authenticated' && session?.user) {
                try {
                    const response = await fetch('/api/user/sync')
                    if (response.ok) {
                        const data = await response.json()
                        setUserData(data.user)
                        setUserRole(data.user.role)
                    } else {
                        // Fallback to session role
                        setUserRole(session.user.role)
                    }
                } catch (error) {
                    console.error('Failed to fetch user data:', error)
                    setUserRole(session.user.role)
                } finally {
                    setIsLoading(false)
                }
            } else if (status === 'unauthenticated') {
                setUserData(null)
                setUserRole(null)
                setIsLoading(false)
            }
        }

        fetchUserData()
    }, [session, status])

    // Get authentication token (for API calls)
    const getToken = async () => {
        if (session?.user) {
            // Auth.js uses JWT tokens stored in the session
            return session.user.id
        }
        return null
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
                setUserRole(role)
                
                // Update session with new role
                await update({ role })
                
                // Refresh user data
                const syncResponse = await fetch('/api/user/sync')
                if (syncResponse.ok) {
                    const data = await syncResponse.json()
                    setUserData(data.user)
                }
            }
        } catch (error) {
            console.error('Error updating user role:', error)
            throw error
        }
    }

    // Refresh user data from database
    const refreshUserData = async () => {
        if (session?.user) {
            try {
                const response = await fetch('/api/user/sync')
                if (response.ok) {
                    const data = await response.json()
                    setUserData(data.user)
                    setUserRole(data.user.role)
                }
            } catch (error) {
                console.error('Failed to refresh user data:', error)
            }
        }
    }

    // Role-based navigation
    const navigateToDashboard = () => {
        switch(userRole) {
            case ROLES.PATIENT:
                router.push('/patient/dashboard')
                break
            case ROLES.DOCTOR:
                router.push('/doctor/dashboard')
                break
            case ROLES.HOSPITAL_ADMIN:
                router.push('/hospital-admin/dashboard')
                break
            case ROLES.ADMIN:
                router.push('/admin/dashboard')
                break
            case ROLES.SUB_ADMIN:
                router.push('/sub-admin/dashboard')
                break
            default:
                router.push('/')
        }
    }

    // Navigate to role-specific landing page
    const navigateToRolePage = () => {
        switch(userRole) {
            case ROLES.PATIENT:
                router.push('/patient')
                break
            case ROLES.DOCTOR:
                router.push('/doctor')
                break
            case ROLES.HOSPITAL_ADMIN:
                router.push('/hospital-admin')
                break
            case ROLES.ADMIN:
                router.push('/admin')
                break
            case ROLES.SUB_ADMIN:
                router.push('/sub-admin')
                break
            default:
                router.push('/')
        }
    }

    // Check if user has specific role
    const hasRole = (role) => {
        return userRole === role
    }

    // Check if user has any of the specified roles
    const hasAnyRole = (roles) => {
        return roles.includes(userRole)
    }

    // Check if user is admin (has access to everything)
    const isAdmin = () => {
        return userRole === ROLES.ADMIN
    }

    // Check if user is admin or sub-admin
    const isAdminOrSubAdmin = () => {
        return userRole === ROLES.ADMIN || userRole === ROLES.SUB_ADMIN
    }

    // Get role display name
    const getRoleDisplayName = () => {
        switch(userRole) {
            case ROLES.PATIENT:
                return 'Patient'
            case ROLES.DOCTOR:
                return 'Doctor'
            case ROLES.HOSPITAL_ADMIN:
                return 'Hospital Admin'
            case ROLES.ADMIN:
                return 'Super Admin'
            case ROLES.SUB_ADMIN:
                return 'Sub Admin'
            default:
                return 'Guest'
        }
    }

    const value = {
        // Session data
        user: session?.user,
        userData,
        session,
        
        // Auth functions
        getToken,
        
        // App config
        currency,
        router,
        
        // Role management
        userRole,
        setUserRole,
        updateUserRole,
        refreshUserData,
        
        // Navigation helpers
        navigateToDashboard,
        navigateToRolePage,
        
        // Permission checks
        hasRole,
        hasAnyRole,
        isAdmin,
        isAdminOrSubAdmin,
        getRoleDisplayName,
        
        // Loading states
        isLoading: status === 'loading' || isLoading,
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
