"use client";
import { useAuth } from '@/lib/auth-context';
import { ActionIcon, Badge, Box, Button, Card, Container, Grid, Group, Menu, Paper, Select, Stack, Tabs, Text, Textarea, Title } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { RichTextEditor } from '@mantine/tiptap';
import { IconArrowRight, IconBulb, IconCalendarEvent, IconCheck, IconCircle, IconDotsVertical, IconDownload, IconEdit, IconMicrophone, IconMoodNeutral, IconMoodSad, IconMoodSmile, IconNote, IconSearch, IconStar, IconTrash, IconX } from '@tabler/icons-react';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useState, useTransition } from 'react';
import {
    BulletEntry,
    createBulletEntry,
    createMultipleBulletEntries,
    deleteBulletEntry,
    getBulletEntriesForDate,
    getJournalEntriesForInsights,
    toggleEntryStatus
} from './actions';

export default function BulletJournalPage() {
    const { user } = useAuth();
    const [date, setDate] = useState<Date | null>(new Date());
    const [activeTab, setActiveTab] = useState<string | null>('daily');
    const [isRecording, setIsRecording] = useState(false);
    const [aiInsights, setAiInsights] = useState<any[]>([]);
    const [isLoadingAIInsights, setIsLoadingAIInsights] = useState(false);
    const [aiInsightsError, setAiInsightsError] = useState<string | null>(null);
    const [rapidLogContent, setRapidLogContent] = useState('');
    const [entries, setEntries] = useState<BulletEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    // Parse rapid log entries utility function
    const parseRapidLogEntries = (text: string, userId: string, date: Date): Omit<BulletEntry, '_id' | 'createdAt' | 'updatedAt'>[] => {
        const lines = text.split('\n').filter(line => line.trim());
        const entries: Omit<BulletEntry, '_id' | 'createdAt' | 'updatedAt'>[] = [];

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;

            let type: 'task' | 'event' | 'note' | 'journal' = 'note';
            let content = trimmed;
            let priority: 'low' | 'medium' | 'high' = 'medium';
            let status: 'pending' | 'completed' | 'migrated' | 'cancelled' = 'pending';

            // Parse symbols
            if (trimmed.startsWith('•')) {
                type = 'task';
                content = trimmed.substring(1).trim();
            } else if (trimmed.toLowerCase().startsWith('task')) {
                type = 'task';
                content = trimmed.substring(4).trim();
            } else if (trimmed.startsWith('x ')) {
                type = 'task';
                status = 'completed';
                content = trimmed.substring(2).trim();
            } else if (trimmed.startsWith('> ')) {
                type = 'task';
                status = 'migrated';
                content = trimmed.substring(2).trim();
            } else if (trimmed.startsWith('< ')) {
                type = 'task';
                status = 'pending';
                content = trimmed.substring(2).trim() + ' (scheduled)';
            } else if (trimmed.startsWith('o ')) {
                type = 'event';
                content = trimmed.substring(2).trim();
            } else if (trimmed.startsWith('– ') || trimmed.startsWith('- ')) {
                type = 'note';
                content = trimmed.substring(2).trim();
            } else if (trimmed.startsWith('* ')) {
                priority = 'high';
                const remaining = trimmed.substring(2).trim();
                if (remaining.startsWith('•')) {
                    type = 'task';
                    content = remaining.substring(1).trim();
                } else {
                    content = remaining;
                }
            } else if (trimmed.startsWith('! ')) {
                type = 'note';
                content = trimmed.substring(2).trim() + ' (inspiration)';
            } else if (trimmed.startsWith('( ) ')) {
                type = 'task';
                priority = 'low';
                content = trimmed.substring(4).trim() + ' (optional)';
            }

            if (content) {
                entries.push({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    userId,
                    date,
                    title: content.length > 50 ? content.substring(0, 50) + '...' : content,
                    content,
                    type,
                    status,
                    priority,
                    tags: [],
                });
            }
        });

        return entries;
    };

    // Load entries when date or user changes
    useEffect(() => {
        if (user && date) {
            loadEntriesForDate();
        }
    }, [user, date]);

    const loadEntriesForDate = async () => {
        if (!user || !date) return;

        try {
            setLoading(true);
            const dateEntries = await getBulletEntriesForDate(user.uid, date);
            setEntries(dateEntries);
        } catch (error) {
            console.error('Error loading entries:', error);
            notifications.show({
                title: 'Error',
                message: 'Failed to load entries',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link,
            Highlight,
            Placeholder.configure({ placeholder: 'Write your entry here...' }),
        ],
        content: '',
    });

    const entryForm = useForm({
        initialValues: {
            title: '',
            type: 'task' as 'task' | 'event' | 'note' | 'journal',
            mood: 'neutral' as 'positive' | 'neutral' | 'negative',
            tags: '',
            priority: 'medium' as 'low' | 'medium' | 'high',
        },
    });

    const handleEntrySubmit = async (values: typeof entryForm.values) => {
        if (!editor || !user || !date) return;

        startTransition(async () => {
            try {
                const entryData = {
                    id: Date.now().toString(),
                    userId: user.uid,
                    date: date,
                    title: values.title,
                    content: editor.getHTML(),
                    type: values.type,
                    status: 'pending' as const,
                    mood: values.type === 'journal' ? values.mood : undefined,
                    tags: values.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
                    priority: values.priority,
                };

                await createBulletEntry(entryData);
                entryForm.reset();
                editor.commands.setContent('');

                // Reload entries for the current date
                await loadEntriesForDate();

                notifications.show({
                    title: 'Entry Saved',
                    message: `Your ${values.type} has been recorded`,
                    color: 'green',
                    icon: <IconCheck size="1.1rem" />,
                });
            } catch (error) {
                notifications.show({
                    title: 'Error',
                    message: 'Failed to save entry',
                    color: 'red',
                });
            }
        });
    };

    const handleToggleEntryStatus = async (entryId: string, currentStatus: string) => {
        startTransition(async () => {
            try {
                await toggleEntryStatus(entryId, currentStatus);
                // Reload entries for the current date
                await loadEntriesForDate();
            } catch (error) {
                notifications.show({
                    title: 'Error',
                    message: 'Failed to update entry status',
                    color: 'red',
                });
            }
        });
    };

    const handleDeleteEntry = async (entryId: string) => {
        startTransition(async () => {
            try {
                await deleteBulletEntry(entryId);
                // Reload entries for the current date
                await loadEntriesForDate();

                notifications.show({
                    title: 'Entry Deleted',
                    message: 'Bullet journal entry has been removed',
                    color: 'red',
                });
            } catch (error) {
                notifications.show({
                    title: 'Error',
                    message: 'Failed to delete entry',
                    color: 'red',
                });
            }
        });
    };

    const toggleVoiceRecording = () => {
        setIsRecording(!isRecording);
        if (isRecording) {
            notifications.show({
                title: 'Voice Recording Stopped',
                message: 'Your voice input has been processed',
                color: 'blue',
            });
        } else {
            notifications.show({
                title: 'Voice Recording Started',
                message: 'Speak now to record your input',
                color: 'blue',
            });
        }
    };

    const fetchAIInsights = async () => {
        if (!date || !user) return;

        setIsLoadingAIInsights(true);
        setAiInsightsError(null);

        try {
            const oneWeekAgo = new Date(date);
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            const journalEntries = await getJournalEntriesForInsights(user.uid, oneWeekAgo);

            if (journalEntries.length === 0) {
                setAiInsightsError('No journal entries found for the past week. Please add some journal entries first.');
                return;
            }

            // Simulate AI insights generation (replace with actual API call)
            const mockInsights = [
                {
                    title: 'Productivity Pattern',
                    description: 'You tend to be most productive in the morning hours, with task completion rates highest between 9-11 AM.',
                },
                {
                    title: 'Mood Trends',
                    description: 'Your mood shows positive correlation with completed tasks and physical activity.',
                },
                {
                    title: 'Goal Progress',
                    description: 'You\'re making steady progress on your work projects but could benefit from more regular breaks.',
                }
            ];

            setAiInsights(mockInsights);
        } catch (error) {
            setAiInsightsError('Failed to generate AI insights. Please try again.');
        } finally {
            setIsLoadingAIInsights(false);
        }
    };

    const exportEntries = (format: 'json' | 'csv' | 'markdown') => {
        let content = '';
        let filename = '';

        switch (format) {
            case 'json':
                content = JSON.stringify(entries, null, 2);
                filename = `journal-entries-${new Date().toISOString().split('T')[0]}.json`;
                break;
            case 'csv':
                const csvHeaders = 'Date,Type,Title,Content,Status,Priority,Tags,Mood\n';
                const csvRows = entries.map(entry =>
                    `"${new Date(entry.date).toLocaleDateString()}","${entry.type}","${entry.title}","${entry.content.replace(/"/g, '""')}","${entry.status}","${entry.priority}","${entry.tags.join('; ')}","${entry.mood || ''}"`
                ).join('\n');
                content = csvHeaders + csvRows;
                filename = `journal-entries-${new Date().toISOString().split('T')[0]}.csv`;
                break;
            case 'markdown':
                content = entries.map(entry =>
                    `## ${entry.title}\n\n**Date:** ${new Date(entry.date).toLocaleDateString()}\n**Type:** ${entry.type}\n**Status:** ${entry.status}\n**Priority:** ${entry.priority}\n${entry.mood ? `**Mood:** ${entry.mood}\n` : ''}${entry.tags.length > 0 ? `**Tags:** ${entry.tags.join(', ')}\n` : ''}\n\n${entry.content}\n\n---\n\n`
                ).join('');
                filename = `journal-entries-${new Date().toISOString().split('T')[0]}.md`;
                break;
        }

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        notifications.show({
            title: 'Export Complete',
            message: `Your entries have been exported as ${format.toUpperCase()}`,
            color: 'green',
            icon: <IconDownload size="1.1rem" />,
        });
    };

    const getEntryIcon = (type: string, status: string) => {
        if (type === 'task') {
            return status === 'completed' ? <IconCheck size={16} color="green" /> :
                status === 'cancelled' ? <IconX size={16} color="red" /> :
                    status === 'migrated' ? <IconArrowRight size={16} color="orange" /> :
                        <IconCircle size={16} />;
        } else if (type === 'event') {
            return <IconCalendarEvent size={16} color="blue" />;
        } else if (type === 'note') {
            return <IconNote size={16} color="gray" />;
        } else if (type === 'journal') {
            return <IconStar size={16} color="purple" />;
        }
        return <IconCircle size={16} />;
    };

    const getMoodIcon = (mood?: string) => {
        if (mood === 'positive') return <IconMoodSmile size={16} color="green" />;
        if (mood === 'negative') return <IconMoodSad size={16} color="red" />;
        if (mood === 'neutral') return <IconMoodNeutral size={16} color="gray" />;
        return null;
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'red';
            case 'medium': return 'orange';
            case 'low': return 'gray';
            default: return 'gray';
        }
    };

    const filteredEntries = entries; // Already filtered by date when loaded

    const handleRapidLogSubmit = async () => {
        if (!rapidLogContent.trim() || !user || !date) return;

        startTransition(async () => {
            try {
                const parsedEntries = parseRapidLogEntries(rapidLogContent, user.uid, date);
                await createMultipleBulletEntries(parsedEntries);
                setRapidLogContent('');

                // Reload entries for the current date
                await loadEntriesForDate();

                notifications.show({
                    title: 'Entries Added',
                    message: `${parsedEntries.length} new entries have been logged`,
                    color: 'green',
                    icon: <IconCheck size="1.1rem" />,
                });
            } catch (error) {
                notifications.show({
                    title: 'Error',
                    message: 'Failed to save rapid log entries',
                    color: 'red',
                });
            }
        });
    };

    return (
        <>
            {!user && (
                <Container>
                    <Text ta="center" mt="xl">Please log in to access your bullet journal.</Text>
                </Container>
            )}

            {user && loading && (
                <Container>
                    <Text ta="center" mt="xl">Loading your journal...</Text>
                </Container>
            )}

            {user && !loading && (
                <Container size="lg" my={40}>
                    <Title ta="center" fw={900} mb="md">
                        Journal
                    </Title>
                    <Text c="dimmed" size="sm" ta="center" mb="xl">
                        Capture tasks, events, notes, and reflections in one organized place
                    </Text>

                    <Group justify="space-between" mb="xl">
                        <DatePickerInput
                            value={date}
                            onChange={(value) => {
                                if (typeof value === 'string') {
                                    setDate(new Date(value));
                                } else {
                                    setDate(value);
                                }
                            }}
                            label="Select Date"
                            placeholder="Pick a date"
                            mx="auto"
                            maw={400}
                        />
                    </Group>

                    {/* Rapid Logging Section */}
                    <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
                        <Title order={3} mb="md">Rapid Logging</Title>
                        <Text c="dimmed" size="sm" mb="md">
                            Use official Bullet Journal symbols for quick capture
                        </Text>

                        <Grid mb="lg">
                            <Grid.Col span={{ base: 12, md: 8 }}>
                                <Textarea
                                    placeholder="• Write task  |  o Event  |  – Note  |  * Priority  |  ! Inspiration"
                                    rows={3}
                                    mb="sm"
                                    value={rapidLogContent}
                                    onChange={(e) => setRapidLogContent(e.currentTarget.value)}
                                    onKeyDown={(e) => {
                                        if (e.ctrlKey && e.key === 'Enter') {
                                            handleRapidLogSubmit();
                                        }
                                    }}
                                />
                                <Group gap="xs">
                                    <Button size="sm" onClick={handleRapidLogSubmit} loading={isPending}>
                                        Add Entry
                                    </Button>
                                    <ActionIcon
                                        variant="outline"
                                        size="lg"
                                        onClick={toggleVoiceRecording}
                                        color={isRecording ? "red" : "blue"}
                                        disabled={isPending}
                                    >
                                        <IconMicrophone size="1rem" />
                                    </ActionIcon>
                                    <Text size="xs" c="dimmed">Ctrl+Enter to submit</Text>
                                </Group>
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, md: 4 }}>
                                <Paper withBorder p="md" radius="sm">
                                    <Title order={5} mb="sm">Official BuJo Symbols</Title>
                                    <Stack gap="xs">
                                        <Group gap="sm">
                                            <Text size="sm" fw={500} w={20}>•</Text>
                                            <Text size="xs">Task - • Write product spec</Text>
                                        </Group>
                                        <Group gap="sm">
                                            <Text size="sm" fw={500} w={20}>x</Text>
                                            <Text size="xs">Complete - x Write product spec</Text>
                                        </Group>
                                        <Group gap="sm">
                                            <Text size="sm" fw={500} w={20}>{'>'}</Text>
                                            <Text size="xs">Migrated - {'>'} Write product spec</Text>
                                        </Group>
                                        <Group gap="sm">
                                            <Text size="sm" fw={500} w={20}>&lt;</Text>
                                            <Text size="xs">Scheduled - &lt; Dentist appointment</Text>
                                        </Group>
                                        <Group gap="sm">
                                            <Text size="sm" fw={500} w={20}>o</Text>
                                            <Text size="xs">Event - o Team meeting at 3PM</Text>
                                        </Group>
                                        <Group gap="sm">
                                            <Text size="sm" fw={500} w={20}>–</Text>
                                            <Text size="xs">Note - – Client prefers Tuesday</Text>
                                        </Group>
                                        <Group gap="sm">
                                            <Text size="sm" fw={500} w={20}>*</Text>
                                            <Text size="xs">Priority - * • Update investor deck</Text>
                                        </Group>
                                        <Group gap="sm">
                                            <Text size="sm" fw={500} w={20}>!</Text>
                                            <Text size="xs">Inspiration - ! "Stay curious"</Text>
                                        </Group>
                                        <Group gap="sm">
                                            <Text size="sm" fw={500} w={20}>( )</Text>
                                            <Text size="xs">Optional - ( ) Water plants</Text>
                                        </Group>
                                    </Stack>
                                </Paper>
                            </Grid.Col>
                        </Grid>
                    </Card>

                    <Tabs value={activeTab} onChange={setActiveTab} mb="xl">
                        <Tabs.List>
                            <Tabs.Tab value="daily" leftSection={<IconNote size="0.8rem" />}>Daily Entries</Tabs.Tab>
                            <Tabs.Tab value="add" leftSection={<IconCheck size="0.8rem" />}>Add Entry</Tabs.Tab>
                            <Tabs.Tab value="review" leftSection={<IconSearch size="0.8rem" />}>Review</Tabs.Tab>
                            <Tabs.Tab value="insights" leftSection={<IconBulb size="0.8rem" />}>AI Insights</Tabs.Tab>
                            <Tabs.Tab value="export" leftSection={<IconDownload size="0.8rem" />}>Export</Tabs.Tab>
                        </Tabs.List>
                    </Tabs>

                    {activeTab === 'add' && (
                        <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
                            <Title order={3} mb="md">Add New Entry</Title>
                            <form onSubmit={entryForm.onSubmit(handleEntrySubmit)}>
                                <Grid>
                                    <Grid.Col span={{ base: 12, md: 6 }}>
                                        <Select
                                            label="Entry Type"
                                            placeholder="Select type"
                                            data={[
                                                { value: 'task', label: '• Task' },
                                                { value: 'event', label: '○ Event' },
                                                { value: 'note', label: '- Note' },
                                                { value: 'journal', label: '★ Journal Entry' },
                                            ]}
                                            mb="md"
                                            {...entryForm.getInputProps('type')}
                                        />
                                        <Select
                                            label="Priority"
                                            placeholder="Select priority"
                                            data={[
                                                { value: 'low', label: 'Low' },
                                                { value: 'medium', label: 'Medium' },
                                                { value: 'high', label: 'High' },
                                            ]}
                                            mb="md"
                                            {...entryForm.getInputProps('priority')}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={{ base: 12, md: 6 }}>
                                        <Textarea
                                            label="Title/Summary"
                                            placeholder="Brief description..."
                                            rows={2}
                                            mb="md"
                                            {...entryForm.getInputProps('title')}
                                        />
                                        {entryForm.values.type === 'journal' && (
                                            <Select
                                                label="Mood"
                                                placeholder="How are you feeling?"
                                                data={[
                                                    { value: 'positive', label: '😊 Positive' },
                                                    { value: 'neutral', label: '😐 Neutral' },
                                                    { value: 'negative', label: '😞 Negative' },
                                                ]}
                                                mb="md"
                                                {...entryForm.getInputProps('mood')}
                                            />
                                        )}
                                        <Textarea
                                            label="Tags"
                                            placeholder="work, personal, health (comma separated)"
                                            rows={1}
                                            mb="md"
                                            {...entryForm.getInputProps('tags')}
                                        />
                                    </Grid.Col>
                                </Grid>

                                <Text size="sm" mb="xs">Content</Text>
                                <RichTextEditor editor={editor} mb="md">
                                    <RichTextEditor.Toolbar sticky stickyOffset={60}>
                                        <RichTextEditor.ControlsGroup>
                                            <RichTextEditor.Bold />
                                            <RichTextEditor.Italic />
                                            <RichTextEditor.Underline />
                                            <RichTextEditor.Strikethrough />
                                            <RichTextEditor.ClearFormatting />
                                            <RichTextEditor.Highlight />
                                        </RichTextEditor.ControlsGroup>
                                        <RichTextEditor.ControlsGroup>
                                            <RichTextEditor.BulletList />
                                            <RichTextEditor.OrderedList />
                                        </RichTextEditor.ControlsGroup>
                                        <RichTextEditor.ControlsGroup>
                                            <RichTextEditor.Link />
                                            <RichTextEditor.Unlink />
                                        </RichTextEditor.ControlsGroup>
                                    </RichTextEditor.Toolbar>
                                    <RichTextEditor.Content />
                                </RichTextEditor>

                                <Group justify="space-between">
                                    <ActionIcon
                                        variant={isRecording ? "filled" : "outline"}
                                        color={isRecording ? "red" : "blue"}
                                        size="lg"
                                        radius="xl"
                                        onClick={toggleVoiceRecording}
                                        style={{
                                            boxShadow: isRecording ? '0 0 0 2px #fa5252' : '0 0 0 1px #228be6',
                                            transition: 'box-shadow 0.2s'
                                        }}
                                    >
                                        <IconMicrophone size="1.2rem" />
                                    </ActionIcon>
                                    <Button type="submit" loading={isPending}>Save Entry</Button>
                                </Group>
                            </form>
                        </Card>
                    )}

                    {activeTab === 'daily' && (
                        <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
                            <Title order={3} mb="md">
                                {date ? date.toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) : 'Today\'s'} Entries
                            </Title>
                            {filteredEntries.length === 0 ? (
                                <Text c="dimmed" ta="center" py="xl">
                                    No entries for this date. Switch to the "Add Entry" tab to create one.
                                </Text>
                            ) : (
                                <Stack gap="md">
                                    {filteredEntries.map((entry) => (
                                        <Paper key={entry._id} withBorder p="md" radius="md">
                                            <Group justify="space-between" align="flex-start">
                                                <Group align="flex-start" gap="sm" style={{ flex: 1 }}>
                                                    <Box mt={4}>
                                                        <ActionIcon
                                                            variant="subtle"
                                                            size="sm"
                                                            onClick={() => handleToggleEntryStatus(entry._id!, entry.status)}
                                                            disabled={entry.type === 'note' || entry.type === 'journal' || isPending}
                                                        >
                                                            {getEntryIcon(entry.type, entry.status)}
                                                        </ActionIcon>
                                                    </Box>
                                                    <Box style={{ flex: 1 }}>
                                                        <Group gap="xs" mb="xs">
                                                            <Text size="sm" fw={500}
                                                                style={{
                                                                    textDecoration: entry.status === 'completed' ? 'line-through' : 'none',
                                                                    opacity: entry.status === 'completed' ? 0.7 : 1
                                                                }}
                                                            >
                                                                {entry.title}
                                                            </Text>
                                                            <Badge size="xs" color={getPriorityColor(entry.priority)}>
                                                                {entry.priority}
                                                            </Badge>
                                                            {entry.mood && getMoodIcon(entry.mood)}
                                                        </Group>
                                                        <div
                                                            dangerouslySetInnerHTML={{ __html: entry.content }}
                                                            style={{
                                                                fontSize: '14px',
                                                                opacity: entry.status === 'completed' ? 0.7 : 1
                                                            }}
                                                        />
                                                        {entry.tags.length > 0 && (
                                                            <Group gap="xs" mt="xs">
                                                                {entry.tags.map((tag, index) => (
                                                                    <Badge key={index} size="xs" variant="outline">
                                                                        {tag}
                                                                    </Badge>
                                                                ))}
                                                            </Group>
                                                        )}
                                                    </Box>
                                                </Group>
                                                <Menu shadow="md" width={200}>
                                                    <Menu.Target>
                                                        <ActionIcon variant="subtle" color="gray" disabled={isPending}>
                                                            <IconDotsVertical size="1rem" />
                                                        </ActionIcon>
                                                    </Menu.Target>
                                                    <Menu.Dropdown>
                                                        <Menu.Item leftSection={<IconEdit size={14} />}>
                                                            Edit
                                                        </Menu.Item>
                                                        <Menu.Item
                                                            leftSection={<IconTrash size={14} />}
                                                            color="red"
                                                            onClick={() => handleDeleteEntry(entry._id!)}
                                                        >
                                                            Delete
                                                        </Menu.Item>
                                                    </Menu.Dropdown>
                                                </Menu>
                                            </Group>
                                        </Paper>
                                    ))}
                                </Stack>
                            )}
                        </Card>
                    )}

                    {activeTab === 'review' && (
                        <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
                            <Title order={3} mb="md">Review & Analytics</Title>
                            <Grid>
                                <Grid.Col span={{ base: 12, md: 6 }}>
                                    <Paper withBorder p="md" radius="md">
                                        <Text size="sm" c="dimmed" mb="xs">Today's Progress</Text>
                                        <Text size="xl" fw={700}>
                                            {filteredEntries.filter(e => e.status === 'completed').length}/
                                            {filteredEntries.filter(e => e.type === 'task').length} tasks
                                        </Text>
                                    </Paper>
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, md: 6 }}>
                                    <Paper withBorder p="md" radius="md">
                                        <Text size="sm" c="dimmed" mb="xs">Total Entries</Text>
                                        <Text size="xl" fw={700}>{entries.length}</Text>
                                    </Paper>
                                </Grid.Col>
                            </Grid>

                            <Title order={4} mt="xl" mb="md">Recent Journal Entries</Title>
                            <Stack gap="md">
                                {entries
                                    .filter(entry => entry.type === 'journal')
                                    .slice(0, 3)
                                    .map((entry) => (
                                        <Paper key={entry._id} withBorder p="md" radius="md">
                                            <Group justify="space-between" mb="xs">
                                                <Text size="sm" fw={500}>{entry.title}</Text>
                                                <Group gap="xs">
                                                    {entry.mood && getMoodIcon(entry.mood)}
                                                    <Text size="xs" c="dimmed">
                                                        {new Date(entry.date).toLocaleDateString()}
                                                    </Text>
                                                </Group>
                                            </Group>
                                            <div
                                                dangerouslySetInnerHTML={{ __html: entry.content }}
                                                style={{ fontSize: '14px' }}
                                            />
                                        </Paper>
                                    ))}
                            </Stack>
                        </Card>
                    )}

                    {activeTab === 'insights' && (
                        <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
                            <Title order={3} mb="md">AI Insights</Title>
                            <Text c="dimmed" size="sm" mb="md">
                                Get personalized insights based on your journal entries to help you reflect and improve.
                            </Text>
                            <Group justify="space-between" mb="md">
                                <Button
                                    onClick={fetchAIInsights}
                                    loading={isLoadingAIInsights}
                                    disabled={isLoadingAIInsights}
                                >
                                    {isLoadingAIInsights ? 'Generating Insights...' : 'Generate Insights'}
                                </Button>
                            </Group>

                            {aiInsightsError && (
                                <Text c="red" size="sm" ta="center" mb="md">
                                    {aiInsightsError}
                                </Text>
                            )}

                            {aiInsights.length > 0 && (
                                <Stack gap="md">
                                    {aiInsights.map((insight, index) => (
                                        <Paper key={index} withBorder p="md" radius="md">
                                            <Text size="sm" fw={500}>{insight.title}</Text>
                                            <Text size="sm" c="dimmed">{insight.description}</Text>
                                        </Paper>
                                    ))}
                                </Stack>
                            )}
                        </Card>
                    )}

                    {activeTab === 'export' && (
                        <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
                            <Title order={3} mb="md">Export Entries</Title>
                            <Text c="dimmed" size="sm" mb="md">
                                Choose a format to export your journal entries. The file will be downloaded to your device.
                            </Text>
                            <Group gap="md">
                                <Button onClick={() => exportEntries('json')} leftSection={<IconDownload size={16} />}>
                                    Export as JSON
                                </Button>
                                <Button onClick={() => exportEntries('csv')} leftSection={<IconDownload size={16} />}>
                                    Export as CSV
                                </Button>
                                <Button onClick={() => exportEntries('markdown')} leftSection={<IconDownload size={16} />}>
                                    Export as Markdown
                                </Button>
                            </Group>
                        </Card>
                    )}
                </Container>
            )}
        </>
    );
}