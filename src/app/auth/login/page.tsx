"use client";

import { useAuth } from '@/lib/auth-context';
import { Alert, Anchor, Button, Container, Group, Paper, PasswordInput, Text, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconInfoCircle } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { checkUserProfileCompleteness, updateUserLastLogin } from './actions';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const router = useRouter();

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length >= 6 ? null : 'Password should be at least 6 characters'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setLoading(true);
      setEmailNotVerified(false);

      // Step 1: Attempt Firebase authentication
      const signInResult = await signIn(values.email, values.password);

      if (!signInResult.success) {
        notifications.show({
          title: 'Login Failed',
          message: signInResult.message || 'Failed to login. Please check your credentials.',
          color: 'red',
        });
        return;
      }

      // Step 2: Check email verification status
      if (!signInResult.emailVerified) {
        setEmailNotVerified(true);
        notifications.show({
          title: 'Email Not Verified',
          message: 'Please verify your email address before continuing. Check your inbox for a verification link.',
          color: 'orange',
          autoClose: 8000,
        });
        return;
      }

      // Step 3: Get Firebase user UID for MongoDB operations
      // Since signIn was successful, we can get the current user
      const { auth } = await import('@/lib/firebase');
      const firebaseUser = auth.currentUser;

      if (!firebaseUser) {
        notifications.show({
          title: 'Authentication Error',
          message: 'Unable to retrieve user information. Please try again.',
          color: 'red',
        });
        return;
      }

      // Step 4: Update last login in MongoDB
      await updateUserLastLogin(firebaseUser.uid);

      // Step 5: Check profile completeness
      const profileCheck = await checkUserProfileCompleteness(firebaseUser.uid);

      if (!profileCheck.success) {
        // If we can't check profile completeness, allow login but log the issue
        console.warn('Could not check profile completeness:', profileCheck.message);
        notifications.show({
          title: 'Login Successful',
          message: 'Welcome back! Note: We encountered an issue checking your profile.',
          color: 'yellow',
        });
        router.push('/dashboard/daily');
        return;
      }

      // Step 6: Navigate based on profile completeness
      if (!profileCheck.isComplete) {
        notifications.show({
          title: 'Welcome!',
          message: 'Please complete your profile to get the most out of Command Dashboard.',
          color: 'blue',
          autoClose: 6000,
        });
        // Redirect to profile completion page
        router.push('/dashboard/profile');
      } else {
        notifications.show({
          title: 'Welcome back!',
          message: 'You have been logged in successfully.',
          color: 'green',
        });
        router.push('/dashboard/daily');
      }

    } catch (error) {
      notifications.show({
        title: 'Login Error',
        message: 'An unexpected error occurred. Please try again.',
        color: 'red',
      });
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" fw={900}>
        Welcome to Command Dashboard
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Your personal life management hub
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        {emailNotVerified && (
          <Alert
            variant="light"
            color="orange"
            title="Email Verification Required"
            icon={<IconInfoCircle size="1rem" />}
            mb="lg"
          >
            Your email address needs to be verified before you can access your dashboard.
            <Anchor component={Link} href="/auth/verify-email" size="sm" ml={4}>
              Go to verification page
            </Anchor>
          </Alert>
        )}

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="Email"
            placeholder="you@example.com"
            required
            {...form.getInputProps('email')}
          />
          <PasswordInput
            label="Password"
            placeholder="Your password"
            required
            mt="md"
            {...form.getInputProps('password')}
          />
          <Button fullWidth mt="xl" type="submit" loading={loading}>
            Sign in
          </Button>
        </form>

        <Group justify="space-between" mt="lg">
          <Anchor component={Link} href="/auth/reset-password" size="sm">
            Forgot password?
          </Anchor>
          <Anchor component={Link} href="/auth/register" size="sm">
            Don&apos;t have an account? Register
          </Anchor>
        </Group>
      </Paper>
    </Container>
  );
}
