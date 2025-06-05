"use client";

import { useState } from 'react';
import { Title, Container, Card, Text, Button, Group, Textarea, Paper, Tabs, ActionIcon, Menu, Grid, Badge, Select } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconMicrophone, IconCheck, IconDotsVertical, IconEdit, IconTrash, IconDownload, IconSearch, IconMoodSmile, IconMoodSad, IconMoodNeutral } from '@tabler/icons-react';
import { RichTextEditor } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

interface JournalEntry {
  id: string;
  date: Date;
  title: string;
  content: string;
  mood: 'positive' | 'neutral' | 'negative';
  tags: string[];
}

export default function JournalPage() {
  const [date, setDate] = useState<Date | null>(new Date());
  const [activeTab, setActiveTab] = useState<string | null>('write');
  const [isRecording, setIsRecording] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([
    {
      id: '1',
      date: new Date(2025, 4, 20),
      title: 'Project Planning Session',
      content: 'Had a productive planning session for the Command Dashboard project. Excited about the potential of this tool to organize my life and work.',
      mood: 'positive',
      tags: ['work', 'planning']
    },
    {
      id: '2',
      date: new Date(2025, 4, 21),
      title: 'Reflections on Health',
      content: 'Noticed my energy levels are higher when I maintain a consistent sleep schedule. Need to be more disciplined about bedtime.',
      mood: 'neutral',
      tags: ['health', 'reflection']
    }
  ]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      Highlight,
      Placeholder.configure({ placeholder: 'Write your thoughts here...' }),
    ],
    content: '',
  });

  const journalForm = useForm({
    initialValues: {
      title: '',
      mood: 'neutral' as 'positive' | 'neutral' | 'negative',
      tags: '',
    },
  });

  const handleJournalSubmit = (values: typeof journalForm.values) => {
    // This will be connected to MongoDB in a later step
    if (!editor) return;

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: date || new Date(),
      title: values.title,
      content: editor.getHTML(),
      mood: values.mood,
      tags: values.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
    };

    setEntries([newEntry, ...entries]);
    journalForm.reset();
    editor.commands.setContent('');

    notifications.show({
      title: 'Journal Entry Saved',
      message: 'Your thoughts have been recorded',
      color: 'green',
      icon: <IconCheck size="1.1rem" />,
    });
  };

  const deleteEntry = (id: string) => {
    setEntries(entries.filter(entry => entry.id !== id));
    notifications.show({
      title: 'Entry Deleted',
      message: 'Journal entry has been removed',
      color: 'red',
    });
  };

  const toggleVoiceRecording = () => {
    // Voice recording functionality will be implemented in a later step
    setIsRecording(!isRecording);
    if (isRecording) {
      notifications.show({
        title: 'Voice Recording Stopped',
        message: 'Your voice input has been processed',
        color: 'blue',
      });
      // Simulate adding transcribed text to editor
      editor?.commands.insertContent('Voice transcription would appear here. ');
    } else {
      notifications.show({
        title: 'Voice Recording Started',
        message: 'Speak now to record your thoughts',
        color: 'blue',
      });
    }
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'positive': return <IconMoodSmile size="1.1rem" color="green" />;
      case 'negative': return <IconMoodSad size="1.1rem" color="red" />;
      default: return <IconMoodNeutral size="1.1rem" color="gray" />;
    }
  };

  return (
    <Container size="lg">
      <Title order={1} mb="md">Emotion & Thought Journal</Title>

      <Tabs value={activeTab} onChange={setActiveTab} mb="xl">
        <Tabs.List>
          <Tabs.Tab value="write">Write</Tabs.Tab>
          <Tabs.Tab value="entries">Past Entries</Tabs.Tab>
          <Tabs.Tab value="insights">AI Insights</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {activeTab === 'write' && (
        <form onSubmit={journalForm.onSubmit(handleJournalSubmit)}>
          <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
            <Group justify="apart" mb="md">
              <Group>
                <DatePickerInput
                  value={date}
                  onChange={(value: string) => setDate(value ? new Date(value) : null)}
                  label="Entry Date"
                  placeholder="Pick a date"
                  maw={200}
                />
                <Select
                  label="Mood"
                  placeholder="How are you feeling?"
                  data={[
                    { value: 'positive', label: 'Positive' },
                    { value: 'neutral', label: 'Neutral' },
                    { value: 'negative', label: 'Negative' },
                  ]}
                  {...journalForm.getInputProps('mood')}
                />
              </Group>
              <Button
                variant={isRecording ? "filled" : "outline"}
                color={isRecording ? "red" : "blue"}
                onClick={toggleVoiceRecording}
                leftSection={<IconMicrophone size="1.1rem" />}
              >
                {isRecording ? "Stop Recording" : "Voice Input"}
              </Button>
            </Group>

            <Textarea
              label="Title"
              placeholder="Give your entry a title"
              required
              mb="md"
              {...journalForm.getInputProps('title')}
            />

            <Text w={500} mb="xs">Content</Text>
            <RichTextEditor editor={editor} mb="md">
              <RichTextEditor.Toolbar sticky stickyOffset={60}>
                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.Bold />
                  <RichTextEditor.Italic />
                  <RichTextEditor.Underline />
                  <RichTextEditor.Strikethrough />
                  <RichTextEditor.Highlight />
                  <RichTextEditor.ClearFormatting />
                </RichTextEditor.ControlsGroup>

                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.H1 />
                  <RichTextEditor.H2 />
                  <RichTextEditor.H3 />
                  <RichTextEditor.H4 />
                </RichTextEditor.ControlsGroup>

                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.Blockquote />
                  <RichTextEditor.Hr />
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

            <Textarea
              label="Tags"
              placeholder="personal, work, health (comma separated)"
              mb="md"
              {...journalForm.getInputProps('tags')}
            />

            <Button type="submit" fullWidth mt="md">
              Save Journal Entry
            </Button>
          </Card>
        </form>
      )}

      {activeTab === 'entries' && (
        <>
          <Group justify="apart" mb="md">
            <Title order={2}>Journal Entries</Title>
            <Group>
              <Button variant="outline" leftSection={<IconSearch size="1.1rem" />}>
                Search
              </Button>
              <Button variant="outline" leftSection={<IconDownload size="1.1rem" />}>
                Export
              </Button>
            </Group>
          </Group>

          {entries.map((entry) => (
            <Paper key={entry.id} withBorder p="md" radius="md" mb="xl">
              <Group justify="apart" mb="xs">
                <Group>
                  <Title order={3}>{entry.title}</Title>
                  {getMoodIcon(entry.mood)}
                </Group>
                <Group>
                  <Text size="sm" color="dimmed">
                    {entry.date.toLocaleDateString()}
                  </Text>
                  <Menu position="bottom-end">
                    <Menu.Target>
                      <ActionIcon>
                        <IconDotsVertical size="1.1rem" />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item><IconEdit size="1.1rem" />Edit</Menu.Item>
                      <Menu.Item><IconDownload size="1.1rem" />Export</Menu.Item>
                      <Menu.Item
                        color="red"
                        onClick={() => deleteEntry(entry.id)}
                      >
                        <IconTrash size="1.1rem" />
                        Delete
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
              </Group>

              <Text mb="md" dangerouslySetInnerHTML={{ __html: entry.content }} />

              <Group gap="xs">
                {entry.tags.map((tag) => (
                  <Badge key={tag} size="sm" variant="outline">
                    {tag}
                  </Badge>
                ))}
              </Group>
            </Paper>
          ))}

          {entries.length === 0 && (
            <Text color="dimmed" ta="center" py="xl">
              No journal entries yet. Start writing to see your entries here.
            </Text>
          )}
        </>
      )}

      {activeTab === 'insights' && (
        <Grid>
          <Grid.Col span={12}>
            <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
              <Title order={2} mb="md">Emotional Patterns</Title>
              <Text c="dimmed" mb="md">
                Gemini-powered analysis of your emotional patterns based on journal entries.
              </Text>
              <Paper withBorder p="md" radius="md" mb="md">
                <Text fw={500}>Mood Trends</Text>
                <Text>
                  Your entries show a generally positive outlook, with 65% positive entries, 25% neutral, and 10% negative over the past month.
                </Text>
              </Paper>
              <Paper withBorder p="md" radius="md">
                <Text fw={500}>Common Themes</Text>
                <Text>
                  Work-related entries tend to be more positive when they involve planning and creativity, while health-related entries show more neutral tones.
                </Text>
              </Paper>
            </Card>
          </Grid.Col>

          <Grid.Col span={12}>
            <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
              <Title order={2} mb="md">Writing Insights</Title>
              <Text c="dimmed" mb="md">
                Analysis of your writing style and patterns.
              </Text>
              <Paper withBorder p="md" radius="md">
                <Text fw={500}>Expression Style</Text>
                <Text>
                  Your writing is concise and analytical. You tend to focus on facts and observations rather than emotional expressions. Consider exploring more emotional vocabulary to deepen your self-reflection.
                </Text>
              </Paper>
            </Card>
          </Grid.Col>

          <Grid.Col span={12}>
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Title order={2} mb="md">Mental Wellness Insights</Title>
              <Text c="dimmed" mb="md">
                Patterns related to mental wellbeing detected in your journal.
              </Text>
              <Paper withBorder p="md" radius="md">
                <Text fw={500}>Stress Indicators</Text>
                <Text>
                  Work-related entries from Tuesday and Wednesday show potential signs of stress. Consider implementing more breaks or mindfulness practices during busy workdays.
                </Text>
              </Paper>
            </Card>
          </Grid.Col>
        </Grid>
      )}
    </Container>
  );
}
