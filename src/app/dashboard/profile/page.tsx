"use client";

import { getUserProfile } from '@/app/auth/login/actions';
import { useAuth } from '@/lib/auth-context';
import { uploadProfilePhoto } from '@/lib/photo-upload';
import { Alert, Avatar, Button, Container, Divider, FileInput, Group, Paper, Select, Stack, Switch, Text, TextInput, Textarea, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconInfoCircle, IconPhoto, IconTrash, IconUpload } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { updateUserAvatar, updateUserProfile } from './actions';

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
    const [photoUploading, setPhotoUploading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const router = useRouter();

    const form = useForm({
        initialValues: {
            firstName: '',
            lastName: '',
            displayName: '',
            bio: '',
            timezone: '',
            emailNotificationsEnabled: true,
            telegramId: '',
            telegramUsername: '',
            telegramFirstName: '',
            telegramLastName: '',
            avatarUrl: '',
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
                        emailNotificationsEnabled: profile.emailNotificationsEnabled ?? true,
                        telegramId: profile.telegramId || '',
                        telegramUsername: profile.telegramUsername || '',
                        telegramFirstName: profile.telegramFirstName || '',
                        telegramLastName: profile.telegramLastName || '',
                        avatarUrl: profile.avatarUrl || '',
                    });
                    setAvatarUrl(profile.avatarUrl || null);
                }
            } catch (error) {
                console.error('Error loading profile:', error);
            } finally {
                setInitialLoading(false);
            }
        };

        loadProfile();
    }, [user]);

    const handlePhotoUpload = async (file: File | null) => {
        if (!file || !user) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            notifications.show({
                title: 'Invalid File',
                message: 'Please select an image file.',
                color: 'red',
            });
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            notifications.show({
                title: 'File Too Large',
                message: 'Please select an image smaller than 5MB.',
                color: 'red',
            });
            return;
        }

        setPhotoUploading(true);
        try {
            // Step 1: Upload photo to Firebase Storage (this will replace old ones)
            const uploadResult = await uploadProfilePhoto(file, user.uid, avatarUrl || undefined);

            if (uploadResult.success && uploadResult.avatarUrl) {
                // Step 2: Update MongoDB with the new avatar URL
                const dbResult = await updateUserAvatar(user.uid, uploadResult.avatarUrl);

                if (dbResult.success) {
                    // Step 3: Update local state
                    setAvatarUrl(uploadResult.avatarUrl);
                    form.setFieldValue('avatarUrl', uploadResult.avatarUrl);

                    notifications.show({
                        title: 'Photo Updated!',
                        message: 'Your profile photo has been uploaded and saved successfully.',
                        color: 'green',
                    });
                } else {
                    notifications.show({
                        title: 'Database Update Failed',
                        message: dbResult.message || 'Photo uploaded but failed to save to profile.',
                        color: 'orange',
                    });
                }
            } else {
                notifications.show({
                    title: 'Upload Failed',
                    message: uploadResult.message || 'Failed to upload photo.',
                    color: 'red',
                });
            }
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to upload photo. Please try again.',
                color: 'red',
            });
            console.error('Photo upload error:', error);
        } finally {
            setPhotoUploading(false);
        }
    };

    const handlePhotoDelete = async () => {
        if (!user || !avatarUrl) return;

        setPhotoUploading(true);
        try {
            // Step 1: Delete from Firebase Storage
            const { deleteProfilePhoto, deletePhotoByUrl } = await import('@/lib/photo-upload');

            // Try to delete by specific URL first, then fallback to deleting all user photos
            let deleteResult;
            if (avatarUrl.includes('firebasestorage.googleapis.com')) {
                deleteResult = await deletePhotoByUrl(avatarUrl);
                if (!deleteResult.success) {
                    console.log('URL-based delete failed, trying folder-based delete');
                    deleteResult = await deleteProfilePhoto(user.uid);
                }
            } else {
                deleteResult = await deleteProfilePhoto(user.uid);
            }

            if (deleteResult.success) {
                // Step 2: Update MongoDB to remove avatar URL
                const dbResult = await updateUserAvatar(user.uid, null);

                if (dbResult.success) {
                    // Step 3: Update local state
                    setAvatarUrl(null);
                    form.setFieldValue('avatarUrl', '');

                    notifications.show({
                        title: 'Photo Deleted!',
                        message: 'Your profile photo has been removed successfully.',
                        color: 'green',
                    });
                } else {
                    notifications.show({
                        title: 'Database Update Failed',
                        message: dbResult.message || 'Photo deleted but failed to update profile.',
                        color: 'orange',
                    });
                }
            } else {
                notifications.show({
                    title: 'Delete Failed',
                    message: deleteResult.message || 'Failed to delete photo.',
                    color: 'red',
                });
            }
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to delete photo. Please try again.',
                color: 'red',
            });
            console.error('Photo delete error:', error);
        } finally {
            setPhotoUploading(false);
        }
    };

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
                emailNotificationsEnabled: values.emailNotificationsEnabled,
                telegramId: values.telegramId || undefined,
                telegramUsername: values.telegramUsername || undefined,
                telegramFirstName: values.telegramFirstName || undefined,
                telegramLastName: values.telegramLastName || undefined,
                avatarUrl: avatarUrl || undefined,
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
                    This information helps us personalize insights and features.
                </Alert>

                <Stack mb="lg">
                    <Text size="sm" fw={500}>Profile Photo</Text>
                    <Group>
                        <Avatar
                            src={avatarUrl}
                            size={80}
                            radius="md"
                            alt="Profile photo"
                        >
                            <IconPhoto size="2rem" />
                        </Avatar>
                        <Stack gap="xs">
                            <Group gap="xs">
                                <FileInput
                                    placeholder="Choose profile photo"
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                    leftSection={<IconUpload size="1rem" />}
                                    disabled={photoUploading}
                                    style={{ flex: 1 }}
                                />
                                {avatarUrl && (
                                    <Button
                                        variant="outline"
                                        color="red"
                                        size="sm"
                                        onClick={handlePhotoDelete}
                                        disabled={photoUploading}
                                        leftSection={<IconTrash size="1rem" />}
                                    >
                                        Delete
                                    </Button>
                                )}
                            </Group>
                            <Text size="xs" c="dimmed">
                                Max file size: 5MB. Supported formats: JPG, PNG, GIF
                            </Text>
                        </Stack>
                    </Group>
                </Stack>

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
                        mb="md"
                        {...form.getInputProps('timezone')}
                    />

                    <Divider my="lg" label="Notification Preferences" labelPosition="center" />

                    <Switch
                        label="Email Notifications"
                        description="Receive important updates and reminders via email"
                        mb="lg"
                        {...form.getInputProps('emailNotificationsEnabled', { type: 'checkbox' })}
                    />

                    <Divider my="lg" label="Telegram Integration (Optional)" labelPosition="center" />

                    <Group grow mb="md">
                        <TextInput
                            label="Telegram ID"
                            placeholder="Your Telegram user ID"
                            description="Numeric ID for Telegram bot integration"
                            {...form.getInputProps('telegramId')}
                        />
                        <TextInput
                            label="Telegram Username"
                            placeholder="@username"
                            description="Your Telegram username (without @)"
                            {...form.getInputProps('telegramUsername')}
                        />
                    </Group>

                    <Group grow mb="xl">
                        <TextInput
                            label="Telegram First Name"
                            placeholder="First name on Telegram"
                            {...form.getInputProps('telegramFirstName')}
                        />
                        <TextInput
                            label="Telegram Last Name"
                            placeholder="Last name on Telegram"
                            {...form.getInputProps('telegramLastName')}
                        />
                    </Group>

                    <Group justify="flex-end" mb="md">
                        <Button
                            variant="outline"
                            color="red"
                            onClick={handlePhotoDelete}
                            disabled={photoUploading}
                        >
                            {photoUploading ? 'Deleting...' : 'Remove Photo'}
                        </Button>
                    </Group>

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
