"use client";

import { useAuth } from '@/lib/auth-context';
import { debugEmailVerification, logDebugInfo } from '@/lib/debug-auth';
import { Alert, Button, Code, Container, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { sendEmailVerification } from 'firebase/auth';
import { useEffect, useState } from 'react';

export default function DebugEmailVerificationPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [debugInfo, setDebugInfo] = useState<any>(null);

    useEffect(() => {
        const loadDebugInfo = async () => {
            const info = await debugEmailVerification();
            setDebugInfo(info);
            logDebugInfo(info);
        };
        loadDebugInfo();
    }, []);

    const handleSendTestEmail = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const actionCodeSettings = {
                url: `${window.location.origin}/auth/action?mode=verifyEmail&debug=true`,
                handleCodeInApp: true,
            };

            console.log('Sending verification email with settings:', actionCodeSettings);

            await sendEmailVerification(user, actionCodeSettings);
            notifications.show({
                title: 'Test Email Sent',
                message: 'Check your email for the verification link and inspect the URL structure.',
                color: 'blue',
            });
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to send test email.',
                color: 'red',
            });
            console.error('Error sending test email:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container size={800} my={60}>
            <Paper withBorder shadow="md" p={40} radius="md">
                <Title order={2} mb="lg">
                    🐛 Email Verification Debug Tool
                </Title>

                <Alert color="blue" mb="lg">
                    This page helps debug email verification issues. Check the browser console for detailed logs.
                </Alert>

                <Stack gap="md">
                    <div>
                        <Text fw={500} mb="xs">Current Page URL:</Text>
                        <Code block>{debugInfo?.currentUrl || 'Loading...'}</Code>
                    </div>

                    <div>
                        <Text fw={500} mb="xs">Firebase Auth Domain:</Text>
                        <Code>{debugInfo?.authDomain || 'Loading...'}</Code>
                    </div>

                    <div>
                        <Text fw={500} mb="xs">User Status:</Text>
                        <Text size="sm" c={user ? 'green' : 'red'}>
                            {user ? `Logged in as: ${user.email}` : 'Not logged in'}
                        </Text>
                        <Text size="sm" c={user?.emailVerified ? 'green' : 'orange'}>
                            Email verified: {user?.emailVerified ? 'Yes' : 'No'}
                        </Text>
                    </div>

                    {debugInfo?.searchParams && Object.keys(debugInfo.searchParams).length > 0 && (
                        <div>
                            <Text fw={500} mb="xs">URL Parameters:</Text>
                            <Code block>
                                {JSON.stringify(debugInfo.searchParams, null, 2)}
                            </Code>
                        </div>
                    )}

                    {debugInfo?.actionCodeInfo && (
                        <div>
                            <Text fw={500} mb="xs">Action Code Info:</Text>
                            <Code block>
                                {JSON.stringify(debugInfo.actionCodeInfo, null, 2)}
                            </Code>
                        </div>
                    )}

                    {debugInfo?.error && (
                        <Alert color="red">
                            <Text fw={500}>Action Code Error:</Text>
                            <Text size="sm">{debugInfo.error}</Text>
                        </Alert>
                    )}

                    <Group justify="center" gap="md">
                        {user && !user.emailVerified && (
                            <Button
                                onClick={handleSendTestEmail}
                                loading={loading}
                                variant="light"
                            >
                                Send Test Verification Email
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => window.location.reload()}>
                            Refresh Debug Info
                        </Button>
                    </Group>

                    <Alert color="yellow" mt="lg">
                        <Text fw={500} mb="xs">Troubleshooting Steps:</Text>
                        <Text size="sm" mb="xs">1. Check Firebase Console → Authentication → Templates</Text>
                        <Text size="sm" mb="xs">2. Verify Action URL is set to: {window.location.origin}/auth/action</Text>
                        <Text size="sm" mb="xs">3. Ensure your domain is in Authorized domains</Text>
                        <Text size="sm">4. Check browser console for detailed error messages</Text>
                    </Alert>
                </Stack>
            </Paper>
        </Container>
    );
}
