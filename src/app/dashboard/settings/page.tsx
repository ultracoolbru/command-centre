"use client";

import { useAuth } from '@/lib/auth-context';
import { ActionIcon, Badge, Button, Card, Container, Grid, Group, Modal, Paper, PasswordInput, Select, Switch, Tabs, Text, TextInput, Title, Tooltip } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconEye, IconEyeOff, IconKey, IconSettings, IconTrash, IconUser } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { deleteApiKey, getSettings, getUserApiKeys, saveApiKey, updateSettings } from './actions';

interface ApiKey {
    id: string;
    name: string;
    keyType: 'openai' | 'gemini' | 'anthropic' | 'other';
    createdAt: string;
    lastUsed?: string;
}

interface UserSettings {
    language: string;
    theme: string;
    voiceLanguage: string;
    notifications: {
        email: boolean;
        push: boolean;
        dailyReminders: boolean;
        aiInsights: boolean;
    };
    privacy: {
        shareData: boolean;
        analytics: boolean;
    };
    ai: {
        defaultProvider: string;
        enableContextMemory: boolean;
        maxContextLength: number;
    };
}

export default function SettingsPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<string | null>('general');
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [apiKeyModalOpened, setApiKeyModalOpened] = useState(false);
    const [showApiKeys, setShowApiKeys] = useState<{ [key: string]: boolean }>({});

    // Form for general settings
    const settingsForm = useForm<UserSettings>({
        initialValues: {
            language: 'en',
            theme: 'light',
            voiceLanguage: 'en-US',
            notifications: {
                email: true,
                push: true,
                dailyReminders: true,
                aiInsights: true,
            },
            privacy: {
                shareData: false,
                analytics: true,
            },
            ai: {
                defaultProvider: 'gemini',
                enableContextMemory: true,
                maxContextLength: 4000,
            },
        },
    });

    // Form for adding API keys
    const apiKeyForm = useForm({
        initialValues: {
            name: '',
            keyType: 'openai' as 'openai' | 'gemini' | 'anthropic' | 'other',
            apiKey: '',
        },
        validate: {
            name: (value) => (value.trim() === '' ? 'API key name is required' : null),
            apiKey: (value) => (value.trim() === '' ? 'API key is required' : null),
        },
    });

    // Load user settings and API keys on component mount
    useEffect(() => {
        const loadUserData = async () => {
            if (user?.uid) {
                setIsLoading(true);
                try {
                    // Load settings
                    const settingsResult = await getSettings(user.uid);
                    if (settingsResult.success && settingsResult.settings) {
                        setSettings(settingsResult.settings);
                        settingsForm.setValues(settingsResult.settings);
                    }

                    // Load API keys
                    const apiKeysResult = await getUserApiKeys(user.uid);
                    if (apiKeysResult.success && apiKeysResult.apiKeys) {
                        setApiKeys(apiKeysResult.apiKeys);
                    }
                } catch (error) {
                    console.error('Error loading user data:', error);
                    notifications.show({
                        title: 'Error',
                        message: 'Failed to load settings',
                        color: 'red',
                    });
                } finally {
                    setIsLoading(false);
                }
            }
        };

        loadUserData();
    }, [user?.uid]);

    const handleSettingsSubmit = async (values: UserSettings) => {
        if (!user?.uid) {
            notifications.show({
                title: 'Error',
                message: 'You must be logged in to save settings',
                color: 'red',
            });
            return;
        }

        try {
            const result = await updateSettings(user.uid, values);

            if (result.success) {
                setSettings(values);
                notifications.show({
                    title: 'Settings Saved',
                    message: 'Your settings have been updated successfully',
                    color: 'green',
                    icon: <IconCheck size="1.1rem" />,
                });
            } else {
                notifications.show({
                    title: 'Error',
                    message: result.message || 'Failed to save settings',
                    color: 'red',
                });
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            notifications.show({
                title: 'Error',
                message: 'An unexpected error occurred',
                color: 'red',
            });
        }
    };

    const handleApiKeySubmit = async (values: typeof apiKeyForm.values) => {
        if (!user?.uid) {
            notifications.show({
                title: 'Error',
                message: 'You must be logged in to save API keys',
                color: 'red',
            });
            return;
        }

        try {
            const result = await saveApiKey(user.uid, values);

            if (result.success && result.apiKey) {
                setApiKeys([result.apiKey, ...apiKeys]);
                setApiKeyModalOpened(false);
                apiKeyForm.reset();
                notifications.show({
                    title: 'API Key Saved',
                    message: 'Your API key has been saved securely',
                    color: 'green',
                    icon: <IconCheck size="1.1rem" />,
                });
            } else {
                notifications.show({
                    title: 'Error',
                    message: result.message || 'Failed to save API key',
                    color: 'red',
                });
            }
        } catch (error) {
            console.error('Error saving API key:', error);
            notifications.show({
                title: 'Error',
                message: 'An unexpected error occurred',
                color: 'red',
            });
        }
    };

    const handleDeleteApiKey = async (keyId: string) => {
        if (!user?.uid) {
            notifications.show({
                title: 'Error',
                message: 'You must be logged in to delete API keys',
                color: 'red',
            });
            return;
        }

        try {
            const result = await deleteApiKey(user.uid, keyId);

            if (result.success) {
                setApiKeys(apiKeys.filter(key => key.id !== keyId));
                notifications.show({
                    title: 'API Key Deleted',
                    message: 'The API key has been removed',
                    color: 'red',
                });
            } else {
                notifications.show({
                    title: 'Error',
                    message: result.message || 'Failed to delete API key',
                    color: 'red',
                });
            }
        } catch (error) {
            console.error('Error deleting API key:', error);
            notifications.show({
                title: 'Error',
                message: 'An unexpected error occurred',
                color: 'red',
            });
        }
    };

    const toggleApiKeyVisibility = (keyId: string) => {
        setShowApiKeys(prev => ({
            ...prev,
            [keyId]: !prev[keyId]
        }));
    };

    const maskApiKey = (key: string, show: boolean) => {
        if (show) return key;
        return key.substring(0, 8) + '•'.repeat(Math.max(0, key.length - 8));
    };

    if (!user) {
        return (
            <Container size="lg">
                <Text color="dimmed" ta="center" py="xl">
                    Please log in to access your settings.
                </Text>
            </Container>
        );
    }

    return (
        <Container size="lg">
            <Title order={1} mb="md">Settings</Title>

            <Tabs value={activeTab} onChange={setActiveTab} mb="xl">
                <Tabs.List>
                    <Tabs.Tab value="general" leftSection={<IconSettings size="0.8rem" />}>General</Tabs.Tab>
                    <Tabs.Tab value="profile" leftSection={<IconUser size="0.8rem" />}>Profile</Tabs.Tab>
                    <Tabs.Tab value="api-keys" leftSection={<IconKey size="0.8rem" />}>API Keys</Tabs.Tab>
                </Tabs.List>

                {/* General Settings Tab */}
                <Tabs.Panel value="general">
                    <Card shadow="sm" p="lg" radius="md" withBorder>
                        <Title order={2} mb="md">General Settings</Title>
                        <form onSubmit={settingsForm.onSubmit(handleSettingsSubmit)}>
                            <Grid>
                                <Grid.Col span={{ base: 12, md: 6 }}>
                                    <Select
                                        label="Language"
                                        placeholder="Select your language"
                                        data={[
                                            { value: 'en', label: 'English' },
                                            { value: 'es', label: 'Spanish' },
                                            { value: 'fr', label: 'French' },
                                            { value: 'de', label: 'German' },
                                            { value: 'it', label: 'Italian' },
                                            { value: 'pt', label: 'Portuguese' },
                                            { value: 'zh', label: 'Chinese' },
                                            { value: 'ja', label: 'Japanese' },
                                        ]}
                                        mb="md"
                                        {...settingsForm.getInputProps('language')}
                                    />
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, md: 6 }}>
                                    <Select
                                        label="Theme"
                                        placeholder="Select your theme"
                                        data={[
                                            { value: 'light', label: 'Light' },
                                            { value: 'dark', label: 'Dark' },
                                            { value: 'auto', label: 'Auto (System)' },
                                        ]}
                                        mb="md"
                                        {...settingsForm.getInputProps('theme')}
                                    />
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, md: 6 }}>
                                    <Select
                                        label="Voice Recognition Language"
                                        placeholder="Select voice language"
                                        data={[
                                            { value: 'en-US', label: 'English (US)' },
                                            { value: 'en-GB', label: 'English (UK)' },
                                            { value: 'es-ES', label: 'Spanish' },
                                            { value: 'fr-FR', label: 'French' },
                                            { value: 'de-DE', label: 'German' },
                                            { value: 'it-IT', label: 'Italian' },
                                            { value: 'pt-BR', label: 'Portuguese (Brazil)' },
                                            { value: 'zh-CN', label: 'Chinese (Simplified)' },
                                            { value: 'ja-JP', label: 'Japanese' },
                                        ]}
                                        mb="md"
                                        {...settingsForm.getInputProps('voiceLanguage')}
                                    />
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, md: 6 }}>
                                    <Select
                                        label="Default AI Provider"
                                        placeholder="Select AI provider"
                                        data={[
                                            { value: 'gemini', label: 'Google Gemini' },
                                            { value: 'openai', label: 'OpenAI GPT' },
                                            { value: 'anthropic', label: 'Anthropic Claude' },
                                        ]}
                                        mb="md"
                                        {...settingsForm.getInputProps('ai.defaultProvider')}
                                    />
                                </Grid.Col>
                            </Grid>

                            <Title order={3} mt="xl" mb="md">Notifications</Title>
                            <Grid>
                                <Grid.Col span={{ base: 12, md: 6 }}>
                                    <Switch
                                        label="Email Notifications"
                                        description="Receive important updates via email"
                                        mb="md"
                                        {...settingsForm.getInputProps('notifications.email', { type: 'checkbox' })}
                                    />
                                    <Switch
                                        label="Push Notifications"
                                        description="Receive browser notifications"
                                        mb="md"
                                        {...settingsForm.getInputProps('notifications.push', { type: 'checkbox' })}
                                    />
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, md: 6 }}>
                                    <Switch
                                        label="Daily Reminders"
                                        description="Get reminded about your daily tasks"
                                        mb="md"
                                        {...settingsForm.getInputProps('notifications.dailyReminders', { type: 'checkbox' })}
                                    />
                                    <Switch
                                        label="AI Insights"
                                        description="Receive AI-generated insights"
                                        mb="md"
                                        {...settingsForm.getInputProps('notifications.aiInsights', { type: 'checkbox' })}
                                    />
                                </Grid.Col>
                            </Grid>

                            <Title order={3} mt="xl" mb="md">Privacy & Data</Title>
                            <Grid>
                                <Grid.Col span={{ base: 12, md: 6 }}>
                                    <Switch
                                        label="Share Anonymous Data"
                                        description="Help improve the app with anonymous usage data"
                                        mb="md"
                                        {...settingsForm.getInputProps('privacy.shareData', { type: 'checkbox' })}
                                    />
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, md: 6 }}>
                                    <Switch
                                        label="Analytics"
                                        description="Enable analytics to improve your experience"
                                        mb="md"
                                        {...settingsForm.getInputProps('privacy.analytics', { type: 'checkbox' })}
                                    />
                                </Grid.Col>
                            </Grid>

                            <Title order={3} mt="xl" mb="md">AI Settings</Title>
                            <Grid>
                                <Grid.Col span={{ base: 12, md: 6 }}>
                                    <Switch
                                        label="Enable Context Memory"
                                        description="Allow AI to remember conversation context"
                                        mb="md"
                                        {...settingsForm.getInputProps('ai.enableContextMemory', { type: 'checkbox' })}
                                    />
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, md: 6 }}>
                                    <Select
                                        label="Max Context Length"
                                        placeholder="Select context length"
                                        data={[
                                            { value: '2000', label: '2,000 tokens' },
                                            { value: '4000', label: '4,000 tokens' },
                                            { value: '8000', label: '8,000 tokens' },
                                            { value: '16000', label: '16,000 tokens' },
                                        ]}
                                        mb="md"
                                        {...settingsForm.getInputProps('ai.maxContextLength')}
                                    />
                                </Grid.Col>
                            </Grid>

                            <Group justify="flex-end" mt="xl">
                                <Button type="submit" loading={isLoading}>
                                    Save Settings
                                </Button>
                            </Group>
                        </form>
                    </Card>
                </Tabs.Panel>

                {/* Profile Tab */}
                <Tabs.Panel value="profile">
                    <Card shadow="sm" p="lg" radius="md" withBorder>
                        <Title order={2} mb="md">Profile Information</Title>
                        <Paper p="md" withBorder mb="md">
                            <Text size="sm" c="dimmed" mb={4}>Email</Text>
                            <Text>{user.email}</Text>
                        </Paper>
                        <Paper p="md" withBorder mb="md">
                            <Text size="sm" c="dimmed" mb={4}>User ID</Text>
                            <Text size="xs" style={{ fontFamily: 'monospace' }}>{user.uid}</Text>
                        </Paper>
                        <Paper p="md" withBorder mb="md">
                            <Text size="sm" c="dimmed" mb={4}>Account Created</Text>
                            <Text>{user.metadata?.creationTime || 'Unknown'}</Text>
                        </Paper>
                        <Paper p="md" withBorder>
                            <Text size="sm" c="dimmed" mb={4}>Last Sign In</Text>
                            <Text>{user.metadata?.lastSignInTime || 'Unknown'}</Text>
                        </Paper>
                    </Card>
                </Tabs.Panel>

                {/* API Keys Tab */}
                <Tabs.Panel value="api-keys">
                    <Card shadow="sm" p="lg" radius="md" withBorder>
                        <Group justify="space-between" mb="md">
                            <Title order={2}>API Keys</Title>
                            <Button
                                leftSection={<IconKey size="1rem" />}
                                onClick={() => setApiKeyModalOpened(true)}
                            >
                                Add API Key
                            </Button>
                        </Group>

                        {isLoading ? (
                            <Text color="dimmed" ta="center" py="xl">
                                Loading API keys...
                            </Text>
                        ) : apiKeys.length === 0 ? (
                            <Text color="dimmed" ta="center" py="xl">
                                No API keys found. Add your first API key to get started!
                            </Text>
                        ) : (
                            <div>
                                {apiKeys.map((apiKey) => (
                                    <Paper key={apiKey.id} p="md" withBorder mb="md">
                                        <Group justify="space-between">
                                            <div style={{ flex: 1 }}>
                                                <Group gap="xs" mb={4}>
                                                    <Text fw={500}>{apiKey.name}</Text>
                                                    <Badge color="blue" size="sm">
                                                        {apiKey.keyType}
                                                    </Badge>
                                                </Group>
                                                <Text size="sm" c="dimmed" mb={4}>
                                                    Created: {new Date(apiKey.createdAt).toLocaleDateString()}
                                                </Text>
                                                {apiKey.lastUsed && (
                                                    <Text size="sm" c="dimmed" mb={4}>
                                                        Last used: {new Date(apiKey.lastUsed).toLocaleDateString()}
                                                    </Text>
                                                )}
                                                <Group gap="xs">
                                                    <Text size="xs" style={{ fontFamily: 'monospace' }}>
                                                        {maskApiKey(apiKey.id, showApiKeys[apiKey.id] || false)}
                                                    </Text>
                                                    <Tooltip label={showApiKeys[apiKey.id] ? "Hide key" : "Show key"}>
                                                        <ActionIcon
                                                            size="sm"
                                                            variant="subtle"
                                                            onClick={() => toggleApiKeyVisibility(apiKey.id)}
                                                        >
                                                            {showApiKeys[apiKey.id] ? <IconEyeOff size="0.8rem" /> : <IconEye size="0.8rem" />}
                                                        </ActionIcon>
                                                    </Tooltip>
                                                </Group>
                                            </div>
                                            <ActionIcon
                                                color="red"
                                                variant="subtle"
                                                onClick={() => handleDeleteApiKey(apiKey.id)}
                                            >
                                                <IconTrash size="1rem" />
                                            </ActionIcon>
                                        </Group>
                                    </Paper>
                                ))}
                            </div>
                        )}
                    </Card>
                </Tabs.Panel>
            </Tabs>

            {/* Add API Key Modal */}
            <Modal
                opened={apiKeyModalOpened}
                onClose={() => {
                    setApiKeyModalOpened(false);
                    apiKeyForm.reset();
                }}
                title="Add API Key"
                size="md"
            >
                <form onSubmit={apiKeyForm.onSubmit(handleApiKeySubmit)}>
                    <TextInput
                        label="API Key Name"
                        placeholder="e.g., OpenAI Production Key"
                        required
                        mb="md"
                        {...apiKeyForm.getInputProps('name')}
                    />
                    <Select
                        label="API Provider"
                        placeholder="Select the API provider"
                        required
                        data={[
                            { value: 'openai', label: 'OpenAI' },
                            { value: 'gemini', label: 'Google Gemini' },
                            { value: 'anthropic', label: 'Anthropic Claude' },
                            { value: 'other', label: 'Other' },
                        ]}
                        mb="md"
                        {...apiKeyForm.getInputProps('keyType')}
                    />
                    <PasswordInput
                        label="API Key"
                        placeholder="Enter your API key"
                        required
                        mb="md"
                        {...apiKeyForm.getInputProps('apiKey')}
                    />
                    <Text size="xs" c="dimmed" mb="md">
                        Your API key will be encrypted and stored securely. It will only be accessible to you.
                    </Text>
                    <Group justify="flex-end">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setApiKeyModalOpened(false);
                                apiKeyForm.reset();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">
                            Save API Key
                        </Button>
                    </Group>
                </form>
            </Modal>
        </Container>
    );
}
