"use client";

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
import { useState } from 'react';

interface BulletEntry {
    id: string;
    date: Date;
    title: string;
    content: string;
    type: 'task' | 'event' | 'note' | 'journal';
    status: 'pending' | 'completed' | 'migrated' | 'cancelled';
    mood?: 'positive' | 'neutral' | 'negative';
    tags: string[];
    priority: 'low' | 'medium' | 'high';
}

export default function BulletJournalPage() {
    const [date, setDate] = useState<Date | null>(new Date());
    const [activeTab, setActiveTab] = useState<string | null>('daily');
    const [isRecording, setIsRecording] = useState(false);
    const [aiInsights, setAiInsights] = useState<any[]>([]);
    const [isLoadingAIInsights, setIsLoadingAIInsights] = useState(false);
    const [aiInsightsError, setAiInsightsError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [entries, setEntries] = useState<BulletEntry[]>([
        {
            id: '1',
            date: new Date(2025, 6, 3),
            title: 'Complete project documentation',
            content: 'Finish writing the technical documentation for the dashboard project',
            type: 'task',
            status: 'pending',
            tags: ['work', 'documentation'],
            priority: 'high'
        },
        {
            id: '2',
            date: new Date(2025, 6, 3),
            title: 'Team meeting at 2 PM',
            content: 'Weekly standup with the development team',
            type: 'event',
            status: 'pending',
            tags: ['work', 'meeting'],
            priority: 'medium'
        },
        {
            id: '3',
            date: new Date(2025, 6, 3),
            title: 'Reflection on progress',
            content: 'Had a productive day working on the Command Dashboard project. The health tracker is coming together nicely and the AI insights are working well.',
            type: 'journal',
            status: 'completed',
            mood: 'positive',
            tags: ['reflection', 'progress'],
            priority: 'low'
        }
    ]);

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

    const handleEntrySubmit = (values: typeof entryForm.values) => {
        if (!editor) return;

        const newEntry: BulletEntry = {
            id: Date.now().toString(),
            date: date || new Date(),
            title: values.title,
            content: editor.getHTML(),
            type: values.type,
            status: 'pending',
            mood: values.type === 'journal' ? values.mood : undefined,
            tags: values.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
            priority: values.priority,
        };

        setEntries([newEntry, ...entries]);
        entryForm.reset();
        editor.commands.setContent('');

        notifications.show({
            title: 'Entry Saved',
            message: `Your ${values.type} has been recorded`,
            color: 'green',
            icon: <IconCheck size="1.1rem" />,
        });
    };

    const toggleEntryStatus = (id: string) => {
        setEntries(entries.map(entry => {
            if (entry.id === id) {
                const newStatus = entry.status === 'pending' ? 'completed' :
                    entry.status === 'completed' ? 'pending' : entry.status;
                return { ...entry, status: newStatus };
            }
            return entry;
        }));
    };

    const deleteEntry = (id: string) => {
        setEntries(entries.filter(entry => entry.id !== id));
        notifications.show({
            title: 'Entry Deleted',
            message: 'Bullet journal entry has been removed',
            color: 'red',
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
        if (!date) return;
        setIsLoadingAIInsights(true);
        setAiInsightsError(null);

        try {
            // Filter journal entries from the last week
            const oneWeekAgo = new Date(date);
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            const journalEntries = entries.filter(entry =>
                entry.type === 'journal' &&
                new Date(entry.date) >= oneWeekAgo &&
                new Date(entry.date) <= date
            );

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

    const filteredEntries = entries.filter(entry => {
        if (!date) return true;
        const entryDate = new Date(entry.date);
        const selectedDate = new Date(date);
        return entryDate.toDateString() === selectedDate.toDateString();
    });

    return (
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

                            <Button type="submit">Save Entry</Button>
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
                                <Paper key={entry.id} withBorder p="md" radius="md">
                                    <Group justify="space-between" align="flex-start">
                                        <Group align="flex-start" gap="sm" style={{ flex: 1 }}>
                                            <Box mt={4}>
                                                <ActionIcon
                                                    variant="subtle"
                                                    size="sm"
                                                    onClick={() => toggleEntryStatus(entry.id)}
                                                    disabled={entry.type === 'note' || entry.type === 'journal'}
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
                                                <ActionIcon variant="subtle" color="gray">
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
                                                    onClick={() => deleteEntry(entry.id)}
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
                                <Paper key={entry.id} withBorder p="md" radius="md">
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
    );
}