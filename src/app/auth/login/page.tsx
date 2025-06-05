"use client";

import { TextInput, PasswordInput, Button, Paper, Title, Text, Container, Group, Anchor } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
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
      await signIn(values.email, values.password);
      notifications.show({
        title: 'Success',
        message: 'You have been logged in successfully',
        color: 'green',
      });
      router.push('/dashboard/daily');
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to login. Please check your credentials.',
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
