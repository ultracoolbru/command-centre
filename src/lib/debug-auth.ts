/**
 * Debug utility for Firebase email verification issues
 */

import { auth } from '@/lib/firebase';
import { checkActionCode } from 'firebase/auth';

export interface DebugInfo {
    currentUrl: string;
    searchParams: Record<string, string | null>;
    authDomain: string;
    userId?: string;
    isUserLoggedIn: boolean;
    actionCodeInfo?: any;
    error?: string;
}

export async function debugEmailVerification(): Promise<DebugInfo> {
    const debugInfo: DebugInfo = {
        currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A',
        searchParams: {},
        authDomain: auth.config.authDomain || 'Not configured',
        userId: auth.currentUser?.uid,
        isUserLoggedIn: !!auth.currentUser,
    };

    if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        debugInfo.searchParams = {
            mode: urlParams.get('mode'),
            oobCode: urlParams.get('oobCode'),
            apiKey: urlParams.get('apiKey'),
            continueUrl: urlParams.get('continueUrl'),
        };

        // Try to check the action code if available
        const actionCode = urlParams.get('oobCode');
        if (actionCode) {
            try {
                const actionCodeInfo = await checkActionCode(auth, actionCode);
                debugInfo.actionCodeInfo = {
                    operation: actionCodeInfo.operation,
                    email: actionCodeInfo.data.email,
                    previousEmail: actionCodeInfo.data.previousEmail,
                };
            } catch (error) {
                debugInfo.error = error instanceof Error ? error.message : 'Unknown error checking action code';
            }
        }
    }

    return debugInfo;
}

export function logDebugInfo(debugInfo: DebugInfo) {
    console.group('🐛 Email Verification Debug Info');
    console.log('Current URL:', debugInfo.currentUrl);
    console.log('Auth Domain:', debugInfo.authDomain);
    console.log('User Logged In:', debugInfo.isUserLoggedIn);
    console.log('User ID:', debugInfo.userId || 'None');
    console.log('Search Params:', debugInfo.searchParams);

    if (debugInfo.actionCodeInfo) {
        console.log('Action Code Info:', debugInfo.actionCodeInfo);
    }

    if (debugInfo.error) {
        console.error('Action Code Error:', debugInfo.error);
    }

    console.groupEnd();
}

/**
 * Common Firebase Auth error codes and their meanings
 */
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
    'auth/invalid-action-code': 'The action code is invalid. This can happen if the code is malformed, expired, or has already been used.',
    'auth/expired-action-code': 'The action code has expired. Please request a new verification email.',
    'auth/invalid-continue-uri': 'The continue URL provided in the request is invalid.',
    'auth/unauthorized-continue-uri': 'The domain of the continue URL is not whitelisted.',
    'auth/user-disabled': 'The user account has been disabled by an administrator.',
    'auth/user-not-found': 'There is no user record corresponding to this identifier.',
    'auth/weak-password': 'The password is too weak.',
    'auth/email-already-in-use': 'The email address is already in use by another account.',
    'auth/operation-not-allowed': 'This operation is not allowed. You may need to enable it in the Firebase Console.',
};

export function getErrorMessage(errorCode: string): string {
    return AUTH_ERROR_MESSAGES[errorCode] || `Unknown error: ${errorCode}`;
}
