"use client";

import { useEffect, useState } from 'react';
import { TextInput, Button, Paper, Title, Text, Container, Group, Textarea, Card, Grid, Timeline, ActionIcon, Loader, Alert } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconMicrophone, IconX, IconAlertCircle } from '@tabler/icons-react';
import { getWeeklyOverview, saveMorningPlan, saveEveningPlan, fetchDailyAIInsights } from './actions';
import { DailySummary, ErrorSummary, AIInsight } from "@/types/schemas";
import { useAuth } from '@/lib/auth-context';

interface Insight {
  title: string;
  description: string;
}

export default function DailyPlannerPage() {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | null>(new Date());
  const [isRecording, setIsRecording] = useState(false);
  const [weeklyOverview, setWeeklyOverview] = useState<DailySummary[] | ErrorSummary[]>([]);
  const [loadingWeeklySummary, setLoadingWeeklySummary] = useState(false);
  const [isSubmittingMorning, setIsSubmittingMorning] = useState(false);
  const [isSubmittingEvening, setIsSubmittingEvening] = useState(false);
  const [aiInsights, setAiInsights] = useState<Insight[] | null>(null);
  const [isLoadingAIInsights, setIsLoadingAIInsights] = useState(false);
  const [aiInsightsError, setAiInsightsError] = useState<string | null>(null);

  const morningForm = useForm({
    initialValues: {
      priority1: '',
      priority2: '',
      priority3: '',
      morningNotes: '',
    },
  });

  const eveningForm = useForm({
    initialValues: {
      accomplishments: '',
      challenges: '',
      tomorrowFocus: '',
      reflectionNotes: '',
    },
  });

  const handleMorningSubmit = async (values: typeof morningForm.values) => {
    if (!user) {
      notifications.show({
        title: 'Authentication Error',
        message: 'You must be logged in to save your morning plan.',
        color: 'red',
        icon: <IconX size="1.1rem" />,
      });
      return;
    }
    if (!date) {
      notifications.show({
        title: 'Date Error',
        message: 'Please select a date to save your morning plan.',
        color: 'red',
        icon: <IconX size="1.1rem" />,
      });
      return;
    }

    setIsSubmittingMorning(true);
    setAiInsights(null); // Clear previous insights
    setAiInsightsError(null); // Clear previous errors
    try {
      const result = await saveMorningPlan(user.uid, date.toISOString(), values);
      if (result.success) {
        notifications.show({
          title: 'Morning Plan Saved',
          message: result.message || 'Your morning priorities have been saved successfully.',
          color: 'green',
          icon: <IconCheck size="1.1rem" />,
        });
        // morningForm.reset();
        triggerAIInsightsFetch();
      } else {
        notifications.show({
          title: 'Save Failed',
          message: result.message || 'Could not save your morning plan. Please try again.',
          color: 'red',
          icon: <IconX size="1.1rem" />,
        });
      }
    } catch (error) {
      console.error('Error submitting morning plan:', error);
      notifications.show({
        title: 'Error',
        message: 'An unexpected error occurred. Please try again.',
        color: 'red',
        icon: <IconX size="1.1rem" />,
      });
    } finally {
      setIsSubmittingMorning(false);
    }
  };

  const handleEveningSubmit = async (values: typeof eveningForm.values) => {
    if (!user) {
      notifications.show({
        title: 'Authentication Error',
        message: 'You must be logged in to save your evening reflection.',
        color: 'red',
        icon: <IconX size="1.1rem" />,
      });
      return;
    }
    if (!date) {
      notifications.show({
        title: 'Date Error',
        message: 'Please select a date to save your evening reflection.',
        color: 'red',
        icon: <IconX size="1.1rem" />,
      });
      return;
    }

    setIsSubmittingEvening(true);
    setAiInsights(null); // Clear previous insights
    setAiInsightsError(null); // Clear previous errors
    try {
      const result = await saveEveningPlan(user.uid, date.toISOString(), values);
      if (result.success) {
        notifications.show({
          title: 'Evening Reflection Saved',
          message: result.message || 'Your evening reflection has been saved successfully.',
          color: 'green',
          icon: <IconCheck size="1.1rem" />,
        });
        // eveningForm.reset();
        triggerAIInsightsFetch();
      } else {
        notifications.show({
          title: 'Save Failed',
          message: result.message || 'Could not save your evening reflection. Please try again.',
          color: 'red',
          icon: <IconX size="1.1rem" />,
        });
      }
    } catch (error) {
      console.error('Error submitting evening reflection:', error);
      notifications.show({
        title: 'Error',
        message: 'An unexpected error occurred. Please try again.',
        color: 'red',
        icon: <IconX size="1.1rem" />,
      });
    } finally {
      setIsSubmittingEvening(false);
    }
  };

  const triggerAIInsightsFetch = async () => {
    if (!user || !date) {
      setAiInsightsError("User or date not available to fetch insights.");
      return;
    }
    setIsLoadingAIInsights(true);
    setAiInsightsError(null);
    try {
      const insightResult = await fetchDailyAIInsights(user.uid, date.toISOString());
      if (insightResult.success && insightResult.insights) {
        setAiInsights(insightResult.insights);
      } else {
        setAiInsights([]); // Set to empty array to indicate no insights found or error
        setAiInsightsError(insightResult.message || "Failed to fetch AI insights.");
        notifications.show({
            title: 'AI Insights Error',
            message: insightResult.message || "Could not retrieve AI insights at this time.",
            color: 'orange',
            icon: <IconAlertCircle size="1.1rem" />,
        });
      }
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      setAiInsights([]);
      setAiInsightsError("An unexpected error occurred while fetching AI insights.");
       notifications.show({
            title: 'AI Insights Error',
            message: "An unexpected error occurred while fetching AI insights.",
            color: 'red',
            icon: <IconX size="1.1rem" />,
        });
    } finally {
      setIsLoadingAIInsights(false);
    }
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
    } else {
      notifications.show({
        title: 'Voice Recording Started',
        message: 'Speak now to record your input',
        color: 'blue',
      });
    }
  };

  const handleDateChange = (value: any) => {
    if (typeof value === 'string') {
      setDate(value ? new Date(value) : null);
    } else {
      setDate(value);
    }
  };

  const getTodayIndex = () => {
    return new Date().getDay(); // Returns 0-6 (Sunday-Saturday)
  };

  useEffect(() => {
    if (!date) return;

    setLoadingWeeklySummary(true);
    const dateString = date.toISOString().split('T')[0];

    getWeeklyOverview(dateString)
      .then(setWeeklyOverview)
      .catch(error => {
        console.error('Error fetching weekly overview:', error);
        setWeeklyOverview([{
          title: 'Error',
          description: 'Failed to load weekly overview. Please try again later.'
        }]);
      })
      .finally(() => setLoadingWeeklySummary(false));
  }, [date]);

  return (
    <Container size="lg" mt="80">
      <Title order={1} mb="md">Daily Planner & Review</Title>

      <Group justify="space-between" mb="xl">
        <DatePickerInput
          value={date}
          onChange={handleDateChange}
          label="Select Date"
          placeholder="Pick a date"
          mx="auto"
          maw={400}
        />
      </Group>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
            <Title order={2} mb="md">Morning Focus</Title>
            <form onSubmit={morningForm.onSubmit(handleMorningSubmit)}>
              <TextInput
                label="Priority 1"
                placeholder="Your most important task today"
                required
                mb="md"
                {...morningForm.getInputProps('priority1')}
              />
              <TextInput
                label="Priority 2"
                placeholder="Your second priority"
                mb="md"
                {...morningForm.getInputProps('priority2')}
              />
              <TextInput
                label="Priority 3"
                placeholder="Your third priority"
                mb="md"
                {...morningForm.getInputProps('priority3')}
              />
              <Group justify="right" mb="md">
                <ActionIcon
                  onClick={toggleVoiceRecording}
                  variant={isRecording ? "filled" : "outline"}
                  color={isRecording ? "red" : "blue"}
                  size="xl"
                  radius="xl"
                  aria-label={isRecording ? "Stop Recording" : "Start Recording"}
                >
                  <IconMicrophone size="1.5rem" />
                </ActionIcon>
              </Group>
              <Textarea
                label="Additional Notes"
                placeholder="Any other thoughts for the day"
                minRows={3}
                mb="md"
                {...morningForm.getInputProps('morningNotes')}
              />
              <Button type="submit" fullWidth mt="md" loading={isSubmittingMorning}>
                Save Morning Plan
              </Button>
            </form>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
            <Title order={2} mb="md">Evening Reflection</Title>
            <form onSubmit={eveningForm.onSubmit(handleEveningSubmit)}>
              <Textarea
                label="Today's Accomplishments"
                placeholder="What did you accomplish today?"
                minRows={2}
                mb="md"
                {...eveningForm.getInputProps('accomplishments')}
              />
              <Textarea
                label="Challenges Faced"
                placeholder="What challenges did you encounter?"
                minRows={2}
                mb="md"
                {...eveningForm.getInputProps('challenges')}
              />
              <Textarea
                label="Tomorrow's Focus"
                placeholder="What will you focus on tomorrow?"
                minRows={2}
                mb="md"
                {...eveningForm.getInputProps('tomorrowFocus')}
              />
              <Group justify="right" mb="md">
                <ActionIcon
                  onClick={toggleVoiceRecording}
                  variant={isRecording ? "filled" : "outline"}
                  color={isRecording ? "red" : "blue"}
                  size="xl"
                  radius="xl"
                  aria-label={isRecording ? "Stop Recording" : "Start Recording"}
                >
                  <IconMicrophone size="1.5rem" />
                </ActionIcon>
              </Group>
              <Textarea
                label="Reflection Notes"
                placeholder="Any other reflections on your day"
                minRows={3}
                mb="md"
                {...eveningForm.getInputProps('reflectionNotes')}
              />
              <Button type="submit" fullWidth mt="md" loading={isSubmittingEvening}>
                Save Evening Reflection
              </Button>
            </form>
          </Card>
        </Grid.Col>
      </Grid>

      <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
        <Title order={2} mb="md">AI Insights</Title>
        {isLoadingAIInsights && (
          <Group justify="center" mt="md">
            <Loader />
            <Text>Generating insights...</Text>
          </Group>
        )}
        {!isLoadingAIInsights && aiInsightsError && (
          <Alert icon={<IconAlertCircle size="1rem" />} title="Insights Error" color="red" mt="md">
            {aiInsightsError}
          </Alert>
        )}
        {!isLoadingAIInsights && !aiInsightsError && aiInsights && aiInsights.length > 0 && (
          aiInsights.map((insight, index) => (
            <Paper withBorder p="md" radius="md" mt={index > 0 ? "md" : undefined} key={index}>
              <Text fw={500}>{insight.title}</Text>
              <Text size="sm" c="dimmed">{insight.description}</Text>
            </Paper>
          ))
        )}
        {!isLoadingAIInsights && !aiInsightsError && (!aiInsights || aiInsights.length === 0) && (
          <Text color="dimmed" mt="md">
            No insights available yet. Save your morning or evening plan to generate new insights.
          </Text>
        )}
      </Card>

      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Title order={2} mb="md">Weekly Overview</Title>
        <Timeline active={getTodayIndex()} bulletSize={24} lineWidth={2}>
          {weeklyOverview.map((item, idx) => {
            // Check if the item is a DailySummary (has 'day' property)
            if ('day' in item) {
              return (
                <Timeline.Item key={item.day} title={item.day}>
                  <Text c="dimmed" size="sm">{item.summary}</Text>
                  <Text size="xs" mt={4}>Focus: {item.focus}</Text>
                </Timeline.Item>
              );
            }
            // Handle ErrorSummary case
            return (
              <Timeline.Item key={idx} title={item.title} color="red">
                <Text c="dimmed" size="sm">{item.description}</Text>
              </Timeline.Item>
            );
          })}
        </Timeline>
      </Card>
    </Container>
  );
}

