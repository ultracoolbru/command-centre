"use client";

import { TextInput, PasswordInput, Button, Paper, Title, Text, Container, Group, Anchor } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length >= 6 ? null : 'Password should be at least 6 characters'),
      confirmPassword: (value, values) =>
        value !== values.password ? 'Passwords do not match' : null,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setLoading(true);
      await signUp(values.email, values.password);
      notifications.show({
        title: 'Success',
        message: 'Account created successfully',
        color: 'green',
      });
      router.push('/dashboard/daily');
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to create account. Please try again.',
        color: 'red',
      });
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" fw={900}>
        Create an Account
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Join Command Dashboard to manage your life
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
          <PasswordInput
            label="Confirm Password"
            placeholder="Confirm your password"
            required
            mt="md"
            {...form.getInputProps('confirmPassword')}
          />
          <Button fullWidth mt="xl" type="submit" loading={loading}>
            Register
          </Button>
        </form>

        <Group justify="center" mt="lg">
          <Anchor component={Link} href="/auth/login" size="sm">
            Already have an account? Login
          </Anchor>
        </Group>
      </Paper>
    </Container>
  );
}
