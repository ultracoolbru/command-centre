import { useAuth } from '@/lib/auth-context';
import { useCallback } from 'react';

/**
 * Custom hook that provides server action wrappers with automatic user ID injection
 * This ensures that server actions always receive the authenticated user's ID
 */
export function useAuthenticatedActions() {
    const { user } = useAuth();

    /**
     * Wrapper that automatically injects the user ID into server actions
     * @param action - The server action function
     * @returns Wrapped function that includes user ID
     */
    const withAuth = useCallback(<T extends any[], R>(
        action: (userId: string, ...args: T) => R
    ) => {
        return (...args: T): R | Promise<{ success: false; message: string }> => {
            if (!user?.uid) {
                return Promise.resolve({
                    success: false,
                    message: "You must be logged in to perform this action."
                }) as any;
            }
            return action(user.uid, ...args);
        };
    }, [user?.uid]);

    /**
     * Get the current user ID, with validation
     * @returns User ID if logged in, null otherwise
     */
    const getUserId = useCallback((): string | null => {
        return user?.uid || null;
    }, [user?.uid]);

    /**
     * Check if user is authenticated
     * @returns True if user is logged in, false otherwise
     */
    const isAuthenticated = useCallback((): boolean => {
        return !!user?.uid;
    }, [user?.uid]);

    return {
        withAuth,
        getUserId,
        isAuthenticated,
        user
    };
}

/**
 * Type helper for server actions that require user ID as first parameter
 */
export type AuthenticatedAction<T extends any[], R> = (userId: string, ...args: T) => R;
