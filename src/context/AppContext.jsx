// context/AppContext.jsx
'use client'
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

export const AppContext = createContext();

export const useAppContext = () => {
    return useContext(AppContext);
}

export const AppContextProvider = (props) => {
    const currency = process.env.NEXT_PUBLIC_CURRENCY;
    const router = useRouter();

    const { user } = useUser();
    const { getToken } = useAuth();

    const [userRole, setUserRole] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Role definitions
    const ROLES = {
        PATIENT: 'patient',
        DOCTOR: 'doctor',
        HOSPITAL_ADMIN: 'hospital_admin',
        ADMIN: 'admin'
    };

    // Get user role from Clerk metadata
    useEffect(() => {
        const fetchUserRole = async () => {
            if (user) {
                const roleFromClerk = user.publicMetadata?.role || user.unsafeMetadata?.role;
                const roleFromStorage = localStorage.getItem('userRole');
                
                const finalRole = roleFromClerk || roleFromStorage;
                setUserRole(finalRole);
                
                if (finalRole) {
                    localStorage.setItem('userRole', finalRole);
                }
            } else {
                setUserRole(null);
                localStorage.removeItem('userRole');
            }
            setIsLoading(false);
        };

        fetchUserRole();
    }, [user]);

    // Update user role in Clerk metadata
    const updateUserRole = async (role) => {
        try {
            if (user) {
                await user.update({
                    unsafeMetadata: {
                        ...user.unsafeMetadata,
                        role: role
                    }
                });
                setUserRole(role);
                localStorage.setItem('userRole', role);
            }
        } catch (error) {
            console.error('Error updating user role:', error);
        }
    };

    // Role-based navigation
    const navigateToDashboard = () => {
        switch(userRole) {
            case ROLES.PATIENT:
                router.push('/patient/dashboard');
                break;
            case ROLES.DOCTOR:
                router.push('/doctor/dashboard');
                break;
            case ROLES.HOSPITAL_ADMIN:
                router.push('/hospital-admin/dashboard');
                break;
            case ROLES.ADMIN:
                router.push('/admin/dashboard');
                break;
            default:
                router.push('/');
        }
    };

    // Navigate to role-specific landing page
    const navigateToRolePage = () => {
        switch(userRole) {
            case ROLES.PATIENT:
                router.push('/patient');
                break;
            case ROLES.DOCTOR:
                router.push('/doctor');
                break;
            case ROLES.HOSPITAL_ADMIN:
                router.push('/hospital-admin');
                break;
            case ROLES.ADMIN:
                router.push('/admin');
                break;
            default:
                router.push('/');
        }
    };

    // Check if user has specific role
    const hasRole = (role) => {
        return userRole === role;
    };

    // Check if user has any of the specified roles
    const hasAnyRole = (roles) => {
        return roles.includes(userRole);
    };

    // Check if user is admin (has access to everything)
    const isAdmin = () => {
        return userRole === ROLES.ADMIN;
    };

    // Get role display name
    const getRoleDisplayName = () => {
        switch(userRole) {
            case ROLES.PATIENT:
                return 'Patient';
            case ROLES.DOCTOR:
                return 'Doctor';
            case ROLES.HOSPITAL_ADMIN:
                return 'Hospital Admin';
            case ROLES.ADMIN:
                return 'Super Admin';
            default:
                return 'Guest';
        }
    };

    const value = {
        user, 
        getToken,
        currency, 
        router,
        userRole,
        setUserRole,
        updateUserRole,
        navigateToDashboard,
        navigateToRolePage,
        hasRole,
        hasAnyRole,
        isAdmin,
        getRoleDisplayName,
        isLoading,
        ROLES
    };

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );
}
