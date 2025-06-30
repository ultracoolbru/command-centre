"use client";

import { useAuth } from '@/lib/auth-context';
import { debugEmailVerification, getErrorMessage, logDebugInfo } from '@/lib/debug-auth';
import { auth } from '@/lib/firebase';
import { Alert, Button, Container, Group, Loader, Paper, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconInfoCircle, IconX } from '@tabler/icons-react';
import { applyActionCode, checkActionCode } from 'firebase/auth';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { updateEmailVerificationStatus } from './actions'; // Server action to update MongoDB

type ActionState = 'loading' | 'success' | 'error' | 'invalid';

function AuthActionContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const [actionState, setActionState] = useState<ActionState>('loading');
    const [actionType, setActionType] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const handleAuthAction = async () => {
            // Debug information
            const debugInfo = await debugEmailVerification();
            logDebugInfo(debugInfo);

            const mode = searchParams.get('mode');
            const actionCode = searchParams.get('oobCode');

            console.log('Auth action params:', { mode, actionCode, url: window.location.href });

            if (!mode || !actionCode) {
                console.error('Missing required parameters:', { mode, actionCode });
                setActionState('invalid');
                return;
            }

            try {
                // Check what the action code is for
                const info = await checkActionCode(auth, actionCode);
                console.log('Action code info:', info);
                setActionType(mode);

                switch (mode) {
                    case 'verifyEmail':
                        await handleEmailVerification(actionCode, info.data.email || undefined);
                        break;
                    case 'resetPassword':
                        // Handle password reset - redirect to password reset form
                        router.push(`/auth/reset-password?oobCode=${actionCode}`);
                        break;
                    case 'recoverEmail':
                        // Handle email recovery
                        await applyActionCode(auth, actionCode);
                        setActionState('success');
                        break;
                    default:
                        setActionState('invalid');
                }
            } catch (error) {
                console.error('Auth action error:', error);

                // Enhanced error handling with specific Firebase error codes
                let errorMessage = 'An error occurred';
                if (error instanceof Error) {
                    const errorCode = error.message.includes('auth/')
                        ? error.message.split(' ')[0]
                        : error.message;
                    errorMessage = getErrorMessage(errorCode) || error.message;
                }

                setErrorMessage(errorMessage);
                setActionState('error');
            }
        };

        const handleEmailVerification = async (actionCode: string, email?: string) => {
            try {
                console.log('Starting email verification process...');

                // Apply the email verification code
                await applyActionCode(auth, actionCode);
                console.log('Email verification code applied successfully');

                // Get the current user after verification
                const currentUser = auth.currentUser;
                if (currentUser) {
                    console.log('Current user found, reloading user data...');
                    // Reload user to get updated email verification status
                    await currentUser.reload();

                    // Update MongoDB with the verification status
                    const updateResult = await updateEmailVerificationStatus(currentUser.uid, true);

                    if (updateResult.success) {
                        console.log('MongoDB update successful');
                        notifications.show({
                            title: 'Email Verified!',
                            message: 'Your email has been successfully verified. You can now log in.',
                            color: 'green',
                            icon: <IconCheck size="1.1rem" />
                        });
                    } else {
                        console.error('Failed to update MongoDB verification status:', updateResult.message);
                        // Still show success to user since Firebase verification worked
                        notifications.show({
                            title: 'Email Verified!',
                            message: 'Your email has been verified. Please try logging in.',
                            color: 'green',
                            icon: <IconCheck size="1.1rem" />
                        });
                    }
                } else {
                    console.log('No current user found, showing generic success message');
                    notifications.show({
                        title: 'Email Verified!',
                        message: 'Your email has been verified. Please log in to continue.',
                        color: 'green',
                        icon: <IconCheck size="1.1rem" />
                    });
                }

                setActionState('success');
            } catch (error) {
                console.error('Email verification error:', error);

                // Provide more specific error messages based on the error code
                if (error instanceof Error) {
                    if (error.message.includes('invalid-action-code')) {
                        throw new Error('This verification link is invalid or has expired. Please request a new verification email.');
                    } else if (error.message.includes('expired-action-code')) {
                        throw new Error('This verification link has expired. Please request a new verification email.');
                    } else if (error.message.includes('user-disabled')) {
                        throw new Error('This user account has been disabled. Please contact support.');
                    }
                }

                throw error;
            }
        };

        handleAuthAction();
    }, [searchParams, router]);

    const getContent = () => {
        switch (actionState) {
            case 'loading':
                return (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: 30 }}>
                            <Loader size="lg" style={{ margin: '0 auto 20px' }} />
                            <Title order={2}>Processing...</Title>
                        </div>
                        <Text ta="center" c="dimmed">
                            Please wait while we process your request.
                        </Text>
                    </>
                );

            case 'success':
                return (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: 30 }}>
                            <IconCheck size={64} style={{ margin: '0 auto 20px', color: 'var(--mantine-color-green-6)' }} />
                            <Title order={2}>
                                {actionType === 'verifyEmail' && 'Email Verified!'}
                                {actionType === 'recoverEmail' && 'Email Recovered!'}
                                {actionType === 'resetPassword' && 'Password Reset'}
                            </Title>
                        </div>

                        <Alert
                            variant="light"
                            color="green"
                            title="Success"
                            icon={<IconCheck size="1rem" />}
                            mb="lg"
                        >
                            {actionType === 'verifyEmail' && 'Your email address has been successfully verified. You can now log in to your account.'}
                            {actionType === 'recoverEmail' && 'Your email address has been successfully recovered.'}
                        </Alert>

                        <Group justify="center" gap="md">
                            <Button component={Link} href="/auth/login">
                                Go to Login
                            </Button>
                            <Button variant="light" component={Link} href="/">
                                Home
                            </Button>
                        </Group>
                    </>
                );

            case 'error':
                return (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: 30 }}>
                            <IconX size={64} style={{ margin: '0 auto 20px', color: 'var(--mantine-color-red-6)' }} />
                            <Title order={2}>Error</Title>
                        </div>

                        <Alert
                            variant="light"
                            color="red"
                            title="Action Failed"
                            icon={<IconX size="1rem" />}
                            mb="lg"
                        >
                            <Text size="sm" mb="sm">
                                {errorMessage || 'The action could not be completed. The link may be expired or invalid.'}
                            </Text>
                            <Text size="xs" c="dimmed">
                                If you continue to experience issues, please try requesting a new verification email.
                            </Text>
                        </Alert>

                        <Group justify="center" gap="md">
                            <Button component={Link} href="/auth/login">
                                Go to Login
                            </Button>
                            <Button variant="light" component={Link} href="/auth/register">
                                Register
                            </Button>
                        </Group>

                        <Group justify="center" gap="md" mt="md">
                            <Button
                                component={Link}
                                href="/auth/debug"
                                variant="outline"
                                size="xs"
                            >
                                🐛 Debug This Error
                            </Button>
                        </Group>
                    </>
                );

            case 'invalid':
                return (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: 30 }}>
                            <IconInfoCircle size={64} style={{ margin: '0 auto 20px', color: 'var(--mantine-color-yellow-6)' }} />
                            <Title order={2}>Invalid Link</Title>
                        </div>

                        <Alert
                            variant="light"
                            color="yellow"
                            title="Invalid Action"
                            icon={<IconInfoCircle size="1rem" />}
                            mb="lg"
                        >
                            <Text size="sm" mb="sm">
                                The link you followed is invalid or has expired. This can happen if:
                            </Text>
                            <Text size="xs" mb="xs">• The link is older than 1 hour</Text>
                            <Text size="xs" mb="xs">• The link has already been used</Text>
                            <Text size="xs" mb="sm">• The link was not properly formatted</Text>
                            <Text size="sm">
                                Please request a new verification email or try again.
                            </Text>
                        </Alert>

                        <Group justify="center" gap="md">
                            <Button component={Link} href="/auth/verify-email">
                                Request New Email
                            </Button>
                            <Button variant="light" component={Link} href="/auth/login">
                                Go to Login
                            </Button>
                        </Group>

                        <Group justify="center" gap="md" mt="md">
                            <Button
                                component={Link}
                                href="/auth/debug"
                                variant="outline"
                                size="xs"
                            >
                                🐛 Debug This Issue
                            </Button>
                        </Group>
                    </>
                );
        }
    };

    return (
        <Container size={480} my={60}>
            <Paper withBorder shadow="md" p={40} radius="md">
                {getContent()}
            </Paper>
        </Container>
    );
}

export default function AuthActionPage() {
    return (
        <Suspense fallback={
            <Container size={480} my={60}>
                <Paper withBorder shadow="md" p={40} radius="md">
                    <div style={{ textAlign: 'center' }}>
                        <Loader size="lg" style={{ margin: '0 auto 20px' }} />
                        <Text c="dimmed">Loading...</Text>
                    </div>
                </Paper>
            </Container>
        }>
            <AuthActionContent />
        </Suspense>
    );
}
