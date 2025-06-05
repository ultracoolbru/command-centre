"use client";

import { TextInput, Button, Paper, Title, Text, Container, Group, Anchor } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm({
    initialValues: {
      email: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, values.email);
      setEmailSent(true);
      notifications.show({
        title: 'Success',
        message: 'Password reset email sent. Please check your inbox.',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to send reset email. Please try again.',
        color: 'red',
      });
      console.error('Password reset error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" fw={900}>
        Reset Your Password
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Enter your email to receive a password reset link
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        {emailSent ? (
          <>
            <Text ta="center" mb="md">
              Reset email sent! Check your inbox and follow the instructions.
            </Text>
            <Button
              component={Link}
              href="/auth/login"
              fullWidth
            >
              Back to Login
            </Button>
          </>
        ) : (
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <TextInput
              label="Email"
              placeholder="you@example.com"
              required
              {...form.getInputProps('email')}
            />
            <Button fullWidth mt="xl" type="submit" loading={loading}>
              Send Reset Link
            </Button>
          </form>
        )}

        <Group justify="center" mt="lg">
          <Anchor component={Link} href="/auth/login" size="sm">
            Remember your password? Login
          </Anchor>
        </Group>
      </Paper>
    </Container>
  );
}
