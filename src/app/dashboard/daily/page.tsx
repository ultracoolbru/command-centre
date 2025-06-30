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
    const today = new Date();
    // Check if the selected `date` is in the current week.
    // To do this, compare the week number and year.
    if (date) {
      const currentWeek = getWeek(today);
      const selectedWeek = getWeek(date);
      if (currentWeek === selectedWeek && today.getFullYear() === date.getFullYear()) {
        return today.getDay(); // 0 (Sun) - 6 (Sat)
      }
    }
    return -1; // Don't activate any bullet if not current week
  };

  // Helper function to get week number
  const getWeek = (d: Date) => {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    // Sunday in current week decides the year.
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    // January 4 is always in week 1.
    const week1 = new Date(date.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  }


  useEffect(() => {
    if (!date || !user) { // Also check for user
      if (!user && !loadingWeeklySummary) { // Prevent setting error if user is just loading
           // setWeeklyOverview([{ title: "Authentication", description: "Please log in to see your weekly overview." }]);
      }
      return;
    }

    setLoadingWeeklySummary(true);
    const dateString = date.toISOString().split('T')[0];

    // Pass user.uid to getWeeklyOverview
    getWeeklyOverview(dateString, user.uid)
      .then(data => {
        if (data.length > 0 && 'day' in data[0] && data[0].day) {
          // We have successfully fetched and processed daily summaries
          setWeeklyOverview(data as DailySummary[]);
        } else if (data.length > 0) {
          // We likely have an array of ErrorSummary
          setWeeklyOverview(data as ErrorSummary[]);
          console.warn("Received ErrorSummary or unexpected data for weekly overview:", data);
        } else {
          // Empty array - could be no data or an issue
          setWeeklyOverview([{ title: "Info", description: "No weekly data processed or available." }]);
           console.warn("Received empty data for weekly overview:", data);
        }
      })
      .catch(error => {
        console.error('Error fetching weekly overview:', error);
        setWeeklyOverview([{
          title: 'Fetch Error',
          description: 'Failed to load weekly overview due to a network or system error.'
        }]);
      })
      .finally(() => setLoadingWeeklySummary(false));
  }, [date, user]); // Add user to dependency array

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
        {loadingWeeklySummary && (
          <Group justify="center" mt="md">
            <Loader />
            <Text>Loading weekly overview...</Text>
          </Group>
        )}
        {!loadingWeeklySummary && weeklyOverview.length === 0 && (
            <Text color="dimmed" mt="md">No weekly overview data available for the selected week.</Text>
        )}
        {!loadingWeeklySummary && weeklyOverview.length > 0 && (
            <Timeline active={getTodayIndex()} bulletSize={24} lineWidth={2}>
            {weeklyOverview.map((item, idx) => {
                if ('day' in item && item.day) { // Ensure item.day is present
                return (
                    <Timeline.Item key={`${item.day}-${idx}`} title={item.day}>
                    <Text c="dimmed" size="sm">{item.summary}</Text>
                    <Text size="xs" mt={4}>Focus: {item.focus}</Text>
                    </Timeline.Item>
                );
                }
                // Handle ErrorSummary or other non-day items
                const errorItem = item as ErrorSummary;
                return (
                    <Timeline.Item key={`error-${idx}`} title={errorItem.title || "Info"} color="red">
                    <Text c="dimmed" size="sm">{errorItem.description || "No details."}</Text>
                    </Timeline.Item>
                );
            })}
            </Timeline>
        )}
      </Card>
    </Container>
  );
}

