"use client";

import { getUserProfile } from '@/app/auth/login/actions';
import { useAuth } from '@/lib/auth-context';
import { Alert, Button, Container, Group, Paper, Select, Text, TextInput, Textarea, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconInfoCircle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { updateUserProfile } from './actions';

// Common timezones for the select dropdown
const timezones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Phoenix', label: 'Arizona Time (MST)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Central European Time (CET)' },
    { value: 'Asia/Tokyo', label: 'Japan Time (JST)' },
    { value: 'Asia/Shanghai', label: 'China Time (CST)' },
    { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
    { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
];

export default function ProfilePage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const router = useRouter();

    const form = useForm({
        initialValues: {
            firstName: '',
            lastName: '',
            displayName: '',
            bio: '',
            timezone: '',
        },
        validate: {
            firstName: (value) => (value.length < 1 ? 'First name is required' : null),
            bio: (value) => (value.length < 10 ? 'Please provide a brief bio (at least 10 characters)' : null),
            timezone: (value) => (!value ? 'Please select your timezone' : null),
        },
    });

    // Load existing user profile data
    useEffect(() => {
        const loadProfile = async () => {
            if (!user) return;

            try {
                const profileResult = await getUserProfile(user.uid);
                if (profileResult.success && profileResult.profile) {
                    const { profile } = profileResult;
                    form.setValues({
                        firstName: profile.firstName || '',
                        lastName: profile.lastName || '',
                        displayName: profile.displayName || '',
                        bio: profile.bio || '',
                        timezone: profile.timezone || '',
                    });
                }
            } catch (error) {
                console.error('Error loading profile:', error);
            } finally {
                setInitialLoading(false);
            }
        };

        loadProfile();
    }, [user]);

    const handleSubmit = async (values: typeof form.values) => {
        if (!user) {
            notifications.show({
                title: 'Error',
                message: 'You must be logged in to update your profile.',
                color: 'red',
            });
            return;
        }

        setLoading(true);
        try {
            const result = await updateUserProfile({
                uid: user.uid,
                firstName: values.firstName,
                lastName: values.lastName,
                displayName: values.displayName || values.firstName,
                bio: values.bio,
                timezone: values.timezone,
            });

            if (result.success) {
                notifications.show({
                    title: 'Profile Updated!',
                    message: 'Your profile has been completed successfully.',
                    color: 'green',
                });

                // Redirect to dashboard
                router.push('/dashboard/daily');
            } else {
                notifications.show({
                    title: 'Update Failed',
                    message: result.message || 'Failed to update profile.',
                    color: 'red',
                });
            }

        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to update profile. Please try again.',
                color: 'red',
            });
            console.error('Profile update error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <Container size={600} my={40}>
                <Paper withBorder shadow="md" p={30} radius="md">
                    <Text ta="center">Loading your profile...</Text>
                </Paper>
            </Container>
        );
    }

    return (
        <Container size={600} my={40}>
            <Title ta="center" fw={900} mb="md">
                Complete Your Profile
            </Title>
            <Text c="dimmed" size="sm" ta="center" mb="xl">
                Help us personalize your Command Dashboard experience
            </Text>

            <Paper withBorder shadow="md" p={30} radius="md">
                <Alert
                    variant="light"
                    color="blue"
                    title="Almost There!"
                    icon={<IconInfoCircle size="1rem" />}
                    mb="lg"
                >
                    Complete your profile to unlock the full potential of Command Dashboard.
                    This information helps us provide personalized insights and features.
                </Alert>

                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Group grow mb="md">
                        <TextInput
                            label="First Name"
                            placeholder="Your first name"
                            required
                            {...form.getInputProps('firstName')}
                        />
                        <TextInput
                            label="Last Name"
                            placeholder="Your last name"
                            {...form.getInputProps('lastName')}
                        />
                    </Group>

                    <TextInput
                        label="Display Name"
                        placeholder="How you want to be addressed"
                        description="This is how you'll appear throughout the dashboard"
                        mb="md"
                        {...form.getInputProps('displayName')}
                    />

                    <Textarea
                        label="Bio"
                        placeholder="Tell us a bit about yourself, your goals, or what you're hoping to achieve..."
                        description="A brief description to help personalize your experience"
                        required
                        minRows={3}
                        mb="md"
                        {...form.getInputProps('bio')}
                    />

                    <Select
                        label="Timezone"
                        placeholder="Select your timezone"
                        description="Used for scheduling and time-based features"
                        required
                        data={timezones}
                        searchable
                        mb="xl"
                        {...form.getInputProps('timezone')}
                    />

                    <Group justify="space-between">
                        <Button
                            variant="subtle"
                            onClick={() => router.push('/dashboard/daily')}
                            disabled={loading}
                        >
                            Skip for now
                        </Button>
                        <Button type="submit" loading={loading}>
                            Complete Profile
                        </Button>
                    </Group>
                </form>
            </Paper>
        </Container>
    );
}
