"use client";

import { auth } from '@/lib/firebase'; // Your firebase auth instance
import { Anchor, Button, Container, Group, Paper, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { AuthError, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';
import { createMongoUserProfile } from './actions'; // Server action

// Schema for client-side validation
const registrationSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password should be at least 6 characters' }),
  confirmPassword: z.string().min(6, { message: 'Password should be at least 6 characters' }),
  displayName: z.string().min(1, { message: 'Display name is required' }),
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'], // path to field that will display the error
});

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // Still can be used for other navigation if needed, or removed

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
      displayName: '',
      firstName: '',
      lastName: '',
    },
    validate: zodResolver(registrationSchema),
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      // Step 1: Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const firebaseUser = userCredential.user;

      if (firebaseUser) {
        // Step 2: Send email verification
        try {
          const actionCodeSettings = {
            url: `${window.location.origin}/auth/action?mode=verifyEmail`,
            handleCodeInApp: true,
          };
          await sendEmailVerification(firebaseUser, actionCodeSettings);
          notifications.show({
            title: 'Verification Email Sent',
            message: 'A verification link has been sent to your email address.',
            color: 'blue',
          });
        } catch (verificationError) {
          console.error('Error sending verification email:', verificationError);
          notifications.show({
            title: 'Verification Email Failed',
            message: 'Could not send verification email. Please contact support if this issue persists.',
            color: 'orange',
          });
          // Continue to create MongoDB profile even if email sending fails for now
        }

        // Step 3: Create user profile in MongoDB
        const profileResult = await createMongoUserProfile({
          uid: firebaseUser.uid,
          email: values.email,
          displayName: values.displayName,
          firstName: values.firstName,
          lastName: values.lastName,
        });

        if (profileResult.success) {
          notifications.show({
            title: 'Registration Successful!',
            message: 'Please check your email to verify your account before logging in.',
            color: 'green',
            autoClose: 7000,
          });
          form.reset();
          // Navigate to verify email page
          router.push('/auth/verify-email');
        } else {
          notifications.show({
            title: 'Profile Creation Failed',
            message: profileResult.message || 'Could not save your profile information.',
            color: 'red',
          });
          // Potentially delete Firebase user if DB profile creation fails critically
          // await firebaseUser.delete(); // Requires careful consideration and error handling
        }
      }
    } catch (error) {
      let errorMessage = 'Failed to create account. Please try again.';
      if (error instanceof Error) {
        const firebaseError = error as AuthError;
        if (firebaseError.code === 'auth/email-already-in-use') {
          errorMessage = 'This email address is already in use.';
          form.setFieldError('email', errorMessage);
        } else if (firebaseError.code === 'auth/weak-password') {
          errorMessage = 'The password is too weak.';
          form.setFieldError('password', errorMessage);
        } else {
          errorMessage = firebaseError.message;
        }
      }
      notifications.show({
        title: 'Registration Error',
        message: errorMessage,
        color: 'red',
      });
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={480} my={40}>
      <Title ta="center" fw={900}>
        Create Your Account
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Get started with Command Dashboard today!
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="First Name"
              placeholder="Your first name"
              required
              {...form.getInputProps('firstName')}
            />
            <TextInput
              label="Last Name"
              placeholder="Your last name"
              required
              {...form.getInputProps('lastName')}
            />
            <TextInput
              label="Display Name"
              placeholder="How you want to be seen"
              required
              {...form.getInputProps('displayName')}
            />
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
              {...form.getInputProps('password')}
            />
            <PasswordInput
              label="Confirm Password"
              placeholder="Confirm your password"
              required
              {...form.getInputProps('confirmPassword')}
            />
          </Stack>
          <Button fullWidth mt="xl" type="submit" loading={loading}>
            Create Account
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
