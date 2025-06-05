"use client";

import { useState, useRef, useEffect } from 'react';
import { askGemini } from "./actions";
import ReactMarkdown from "react-markdown";
import {
  getProductivityInsights,
  getHealthInsights,
  getJournalInsights,
  getWeeklySummaryInsights,
} from "./insightActions";
import { useAuth } from "@/lib/auth-context";
import { Title, Container, Card, Text, Button, Group, TextInput, Textarea, Grid, Paper, Tabs, Badge, ActionIcon, Progress, Timeline, Menu, Switch, Select } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconBulb, IconCheck, IconBrain, IconRobot, IconMicrophone, IconChartLine, IconMessage, IconDeviceAnalytics } from '@tabler/icons-react';

export default function AIPage() {
  const [activeTab, setActiveTab] = useState<string | null>('insights');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<string>("");
  const recognitionRef = useRef<any>(null);
  const [date, setDate] = useState<Date | null>(new Date());

  const queryForm = useForm({
    initialValues: {
      query: '',
      context: 'all',
    },
  });

  const [geminiResponse, setGeminiResponse] = useState<string>("");
  const [loadingGemini, setLoadingGemini] = useState<boolean>(false);

  // Insights state
  const [productivityInsight, setProductivityInsight] = useState<string>("");
  const [loadingProductivity, setLoadingProductivity] = useState(false);
  const [healthInsight, setHealthInsight] = useState<string>("");
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [journalInsight, setJournalInsight] = useState<string>("");
  const [loadingJournal, setLoadingJournal] = useState(false);
  const [weeklySummaryInsight, setWeeklySummaryInsight] = useState<string>("");
  const [loadingWeeklySummary, setLoadingWeeklySummary] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid) return;
    setLoadingProductivity(true);
    setLoadingHealth(true);
    setLoadingJournal(true);
    setLoadingWeeklySummary(true);
    getProductivityInsights(date, user.uid)
      .then(setProductivityInsight)
      .finally(() => setLoadingProductivity(false));
    getHealthInsights(date, user.uid)
      .then(setHealthInsight)
      .finally(() => setLoadingHealth(false));
    getJournalInsights(date, user.uid)
      .then(setJournalInsight)
      .finally(() => setLoadingJournal(false));
    getWeeklySummaryInsights(date, user.uid)
      .then(setWeeklySummaryInsight)
      .finally(() => setLoadingWeeklySummary(false));
  }, [date, user]);

  const handleQuerySubmit = async (values: typeof queryForm.values) => {
    setLoadingGemini(true);
    setGeminiResponse("");
    try {
      notifications.show({
        title: 'Query Sent',
        message: 'Your question has been sent to Gemini',
        color: 'blue',
        icon: <IconCheck size="1.1rem" />,
      });
      // Call the server action to ask Gemini
      const response = await askGemini(values.query, values.context);
      setGeminiResponse(response);
    } catch (error) {
      setGeminiResponse("Sorry, there was an error contacting Gemini.");
    } finally {
      setLoadingGemini(false);
      queryForm.reset();
    }
  };

  const toggleVoiceRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setRecordingStatus("");
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      notifications.show({
        title: 'Voice Recording Stopped',
        message: 'Your voice query has been processed',
        color: 'blue',
      });
    } else {
      // Start recording
      setIsRecording(true);
      setRecordingStatus("Listening...");
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        notifications.show({
          title: 'Speech Recognition Not Supported',
          message: 'Your browser does not support speech recognition.',
          color: 'red',
        });
        setIsRecording(false);
        setRecordingStatus("");
        return;
      }
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = process.env.LANGUAGE || 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        queryForm.setFieldValue('query', transcript);
        setRecordingStatus("Transcribed. Submitting to Gemini...");
        setIsRecording(false);
        // Automatically submit to Gemini
        await handleQuerySubmit({ ...queryForm.values, query: transcript });
        setRecordingStatus("");
      };
      recognition.onerror = (event: any) => {
        notifications.show({
          title: 'Speech Recognition Error',
          message: event.error || 'An error occurred during speech recognition.',
          color: 'red',
        });
        setIsRecording(false);
        setRecordingStatus("");
      };
      recognition.onend = () => {
        setIsRecording(false);
        setRecordingStatus("");
      };
      recognitionRef.current = recognition;
      recognition.start();
      notifications.show({
        title: 'Voice Recording Started',
        message: 'Speak your question to Gemini',
        color: 'blue',
      });
    }
  };

  return (
    <Container size="lg">
      <Title order={1} mb="md">AI Insights</Title>

      <Tabs value={activeTab} onChange={setActiveTab} mb="xl">
        <Tabs.List>
          <Tabs.Tab value="insights">
            <IconBulb size="0.8rem" style={{ marginRight: 8 }} />
            Insights
          </Tabs.Tab>
          <Tabs.Tab value="ask">
            <IconBrain size="0.8rem" style={{ marginRight: 8 }} />
            Ask Gemini
          </Tabs.Tab>
          <Tabs.Tab value="settings">
            <IconRobot size="0.8rem" style={{ marginRight: 8 }} />
            AI Settings
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {activeTab === 'insights' && (
        !user?.uid ? (
          <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
            <Text c="red">Please log in to view your AI insights.</Text>
          </Card>
        ) : (
          <>
            <Group justify="space-between" mb="xl">
              <DatePickerInput
                value={date}
                onChange={(value: string) => setDate(value ? new Date(value) : null)}
                label="View Insights For"
                placeholder="Pick a date"
                mx="auto"
                maw={400}
              />
            </Group>
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
                  <Group mb="md">
                    <IconChartLine size="1.5rem" />
                    <Title order={2}>Productivity Insights</Title>
                  </Group>
                  <Paper withBorder p="md" radius="md" mb="md">
                    <Text fw={500}>Productivity Insights</Text>
                    {loadingProductivity ? (
                      <Text size="sm" c="dimmed">Loading productivity insights...</Text>
                    ) : (
                      <ReactMarkdown>{productivityInsight || 'No insights yet.'}</ReactMarkdown>
                    )}
                  </Paper>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
                  <Group mb="md">
                    <IconDeviceAnalytics size="1.5rem" />
                    <Title order={2}>Health Correlations</Title>
                  </Group>
                  <Paper withBorder p="md" radius="md" mb="md">
                    <Text fw={500}>Health Correlations</Text>
                    {loadingHealth ? (
                      <Text size="sm" c="dimmed">Loading health insights...</Text>
                    ) : (
                      <ReactMarkdown>{healthInsight || 'No insights yet.'}</ReactMarkdown>
                    )}
                  </Paper>
                </Card>
              </Grid.Col>
              <Grid.Col span={12}>
                <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
                  <Group mb="md">
                    <IconMessage size="1.5rem" />
                    <Title order={2}>Journal Analysis</Title>
                  </Group>
                  <Paper withBorder p="md" radius="md">
                    <Text fw={500}>Journal Analysis</Text>
                    {loadingJournal ? (
                      <Text size="sm" c="dimmed">Loading journal insights...</Text>
                    ) : (
                      <ReactMarkdown>{journalInsight || 'No insights yet.'}</ReactMarkdown>
                    )}
                  </Paper>
                </Card>
              </Grid.Col>
              <Grid.Col span={12}>
                <Card shadow="sm" p="lg" radius="md" withBorder>
                  <Title order={2} mb="md">Weekly Summary</Title>
                  {loadingWeeklySummary ? (
                    <Text size="sm" c="dimmed">Loading weekly summary...</Text>
                  ) : (
                    <ReactMarkdown>{weeklySummaryInsight || 'No summary yet.'}</ReactMarkdown>
                  )}
                </Card>
              </Grid.Col>
            </Grid>
          </>
        )
      )}

      {activeTab === 'ask' && (
        <>
          <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
            <Title order={2} mb="md">Ask Gemini</Title>
            <form onSubmit={queryForm.onSubmit(handleQuerySubmit)}>
              <Textarea
                label="Your Question"
                placeholder="Ask anything about your data, patterns, or for suggestions..."
                minRows={3}
                required
                mb="md"
                {...queryForm.getInputProps('query')}
              />

              <Select
                label="Context"
                placeholder="Select data context"
                data={[
                  { value: 'all', label: 'All Data' },
                  { value: 'health', label: 'Health Data Only' },
                  { value: 'tasks', label: 'Tasks & Goals Only' },
                  { value: 'journal', label: 'Journal Entries Only' },
                  { value: 'violt', label: 'Violt Development Only' },
                ]}
                mb="md"
                {...queryForm.getInputProps('context')}
              />

              <Group justify="space-between" mt="md">
                <Button
                  variant={isRecording ? "filled" : "outline"}
                  color={isRecording ? "red" : "blue"}
                  onClick={toggleVoiceRecording}
                  leftSection={<IconMicrophone size="1.1rem" />}
                  disabled={loadingGemini}
                >
                  {isRecording ? "Stop Recording" : "Voice Input"}
                </Button>
                {recordingStatus && (
                  <Text c="blue" size="sm">{recordingStatus}</Text>
                )}
                <Button type="submit">Ask Gemini</Button>
              </Group>
            </form>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Title order={2} mb="md">Response</Title>
            <Paper withBorder p="md" radius="md" mb="md">
              <Text fw={500} mb="xs">Question</Text>
              <Text style={{ fontStyle: 'italic' }} mb="md">
                {queryForm.values.query || 'No question asked yet.'}
              </Text>
              <Text fw={500} mb="xs">Gemini's Response</Text>
              {loadingGemini ? (
                <Text c="dimmed">Loading response from Gemini...</Text>
              ) : (
                <ReactMarkdown>{geminiResponse || 'No response yet.'}</ReactMarkdown>
              )}
            </Paper>
          </Card>
        </>
      )}

      {activeTab === 'settings' && (
        <>
          <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
            <Title order={2} mb="md">AI Configuration</Title>

            <Paper withBorder p="md" radius="md" mb="xl">
              <Group justify="space-between" mb="md">
                <Text fw={500}>Gemini API Connection</Text>
                <Badge color="green">Connected</Badge>
              </Group>
              <Text size="sm" mb="md">
                Your dashboard is connected to Gemini API for AI-powered insights and assistance.
              </Text>
              <Button variant="outline">Reconnect API</Button>
            </Paper>

            <Title order={3} mb="md">Module Settings</Title>

            <Paper withBorder p="md" radius="md" mb="md">
              <Group justify="space-between">
                <div>
                  <Text fw={500}>Daily Planner Insights</Text>
                  <Text size="sm" c="dimmed">
                    Allow Gemini to analyze and suggest improvements to your daily planning
                  </Text>
                </div>
                <Switch defaultChecked />
              </Group>
            </Paper>

            <Paper withBorder p="md" radius="md" mb="md">
              <Group justify="space-between">
                <div>
                  <Text fw={500}>Health Pattern Detection</Text>
                  <Text size="sm" c="dimmed">
                    Enable AI to identify patterns and correlations in your health data
                  </Text>
                </div>
                <Switch defaultChecked />
              </Group>
            </Paper>

            <Paper withBorder p="md" radius="md" mb="md">
              <Group justify="space-between">
                <div>
                  <Text fw={500}>Journal Sentiment Analysis</Text>
                  <Text size="sm" c="dimmed">
                    Allow Gemini to analyze emotional patterns in your journal entries
                  </Text>
                </div>
                <Switch defaultChecked />
              </Group>
            </Paper>
            <Paper withBorder p="md" radius="md" mb="md">
              <Group justify="space-between">
                <div>
                  <Text fw={500}>Daily Planner Insights</Text>
                  <Text size="sm" c="dimmed">
                    Allow Gemini to analyze and suggest improvements to your daily planning
                  </Text>
                </div>
                <Switch defaultChecked />
              </Group>
            </Paper>

            <Paper withBorder p="md" radius="md" mb="md">
              <Group justify="space-between">
                <div>
                  <Text fw={500}>Health Pattern Detection</Text>
                  <Text size="sm" c="dimmed">
                    Enable AI to identify patterns and correlations in your health data
                  </Text>
                </div>
                <Switch defaultChecked />
              </Group>
            </Paper>

            <Paper withBorder p="md" radius="md" mb="md">
              <Group justify="space-between">
                <div>
                  <Text fw={500}>Journal Sentiment Analysis</Text>
                  <Text size="sm" c="dimmed">
                    Allow Gemini to analyze emotional patterns in your journal entries
                  </Text>
                </div>
                <Switch defaultChecked />
              </Group>
            </Paper>

            <Paper withBorder p="md" radius="md" mb="md">
              <Group justify="space-between">
                <div>
                  <Text fw={500}>Task Prioritization Assistance</Text>
                  <Text size="sm" c="dimmed">
                    Get AI suggestions for task prioritization based on your patterns
                  </Text>
                </div>
                <Switch defaultChecked />
              </Group>
            </Paper>

            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text fw={500}>Violt Development Insights</Text>
                  <Text size="sm" c="dimmed">
                    Enable AI suggestions for your Violt development projects
                  </Text>
                </div>
                <Switch defaultChecked />
              </Group>
            </Paper>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Title order={2} mb="md">Privacy Settings</Title>

            <Paper withBorder p="md" radius="md" mb="md">
              <Group justify="space-between">
                <div>
                  <Text fw={500}>Data Retention</Text>
                  <Text size="sm" c="dimmed">
                    Control how long your data is stored for AI analysis
                  </Text>
                </div>
                <Select
                  defaultValue="90"
                  data={[
                    { value: '30', label: '30 days' },
                    { value: '90', label: '90 days' },
                    { value: '180', label: '180 days' },
                    { value: '365', label: '1 year' },
                    { value: 'unlimited', label: 'Unlimited' },
                  ]}
                  style={{ width: 120 }}
                />
              </Group>
            </Paper>

            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text fw={500}>Data Processing Location</Text>
                  <Text size="sm" c="dimmed">
                    Choose where your data is processed
                  </Text>
                </div>
                <Select
                  defaultValue="cloud"
                  data={[
                    { value: 'local', label: 'Local Only' },
                    { value: 'cloud', label: 'Cloud' },
                  ]}
                  style={{ width: 120 }}
                />
              </Group>
            </Paper>
          </Card>
        </>
      )}
    </Container>
  );
}
