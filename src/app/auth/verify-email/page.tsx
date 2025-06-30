"use client";

import { useAuth } from '@/lib/auth-context';
import { Alert, Button, Container, Group, Paper, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconInfoCircle, IconMail } from '@tabler/icons-react';
import { sendEmailVerification } from 'firebase/auth';
import Link from 'next/link';
import { useState } from 'react';

export default function VerifyEmailPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleResendEmail = async () => {
        if (!user) return;

        setLoading(true);
        try {
            await sendEmailVerification(user);
            notifications.show({
                title: 'Email Sent',
                message: 'A new verification email has been sent to your inbox.',
                color: 'blue',
            });
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to send verification email. Please try again later.',
                color: 'red',
            });
            console.error('Error sending verification email:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container size={480} my={60}>
            <Paper withBorder shadow="md" p={40} radius="md">
                <div style={{ textAlign: 'center', marginBottom: 30 }}>
                    <IconMail size={64} style={{ margin: '0 auto 20px', color: 'var(--mantine-color-blue-6)' }} />
                    <Title order={2} fw={700}>
                        Verify Your Email
                    </Title>
                </div>

                <Alert
                    variant="light"
                    color="blue"
                    title="Check Your Inbox"
                    icon={<IconInfoCircle size="1rem" />}
                    mb="lg"
                >
                    We&apos;ve sent a verification link to your email address. Please check your email and click the link to activate your account.
                </Alert>

                <Text c="dimmed" size="sm" ta="center" mb="xl">
                    Can&apos;t find the email? Check your spam folder or request a new verification email below.
                </Text>

                <Group justify="center" gap="md">
                    {user && (
                        <Button
                            variant="light"
                            onClick={handleResendEmail}
                            loading={loading}
                        >
                            Resend Verification Email
                        </Button>
                    )}
                    <Button component={Link} href="/auth/login">
                        Back to Login
                    </Button>
                </Group>

                <Text c="dimmed" size="xs" ta="center" mt="xl">
                    Once you&apos;ve verified your email, you can return to the login page to access your dashboard.
                </Text>
            </Paper>
        </Container>
    );
}
