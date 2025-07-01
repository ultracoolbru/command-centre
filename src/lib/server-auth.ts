/**
 * Server-side authentication utilities for Firebase Auth
 * 
 * IMPORTANT: Firebase Auth is primarily client-side. For server actions,
 * the recommended pattern is to pass the user ID from the client component
 * where the user context is available.
 * 
 * For production apps, consider implementing Firebase Admin SDK for
 * server-side token verification.
 */

/**
 * Validate that a user ID is provided from the client
 * This is the primary method for server actions with Firebase Auth
 */
export function validateUserId(userIdFromClient?: string): {
    isValid: boolean;
    userId: string | null;
    error?: string
} {
    if (!userIdFromClient) {
        return {
            isValid: false,
            userId: null,
            error: "User ID is required. Please ensure you're logged in."
        };
    }

    // Basic validation - ensure it's a non-empty string
    if (typeof userIdFromClient !== 'string' || userIdFromClient.trim() === '') {
        return {
            isValid: false,
            userId: null,
            error: "Invalid user ID format."
        };
    }

    // Basic Firebase UID format validation (Firebase UIDs are typically 28 characters)
    const cleanUserId = userIdFromClient.trim();
    if (cleanUserId.length < 10) {
        return {
            isValid: false,
            userId: null,
            error: "Invalid user ID format."
        };
    }

    return {
        isValid: true,
        userId: cleanUserId
    };
}

/**
 * Enhanced user validation with better error messages
 */
export function getValidatedUserId(userIdFromClient?: string): {
    isValid: boolean;
    userId: string | null;
    error?: string
} {
    const validation = validateUserId(userIdFromClient);

    if (!validation.isValid) {
        return {
            isValid: false,
            userId: null,
            error: validation.error || "Authentication required. Please log in and try again."
        };
    }

    return validation;
}

/**
 * Utility to check if we're in development mode
 */
export function isDevelopmentMode(): boolean {
    return process.env.NODE_ENV === 'development';
}
