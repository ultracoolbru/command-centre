"use client";

import { useEffect, useState } from 'react';
import { TextInput, Button, Paper, Title, Text, Container, Group, Textarea, Card, Grid, Timeline, ActionIcon } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconMicrophone } from '@tabler/icons-react';
import { getWeeklyOverview } from './actions';
import { DailySummary, ErrorSummary } from "@/types/schemas";

export default function DailyPlannerPage() {
  const [date, setDate] = useState<Date | null>(new Date());
  const [isRecording, setIsRecording] = useState(false);
  const [weeklyOverview, setWeeklyOverview] = useState<DailySummary[] | ErrorSummary[]>([]);
  const [loadingWeeklySummary, setLoadingWeeklySummary] = useState(false);

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

  const handleMorningSubmit = (values: typeof morningForm.values) => {
    // This will be connected to MongoDB in a later step
    notifications.show({
      title: 'Morning Plan Saved',
      message: 'Your morning priorities have been saved',
      color: 'green',
      icon: <IconCheck size="1.1rem" />,
    });
    console.log('Morning values:', values);
  };

  const handleEveningSubmit = (values: typeof eveningForm.values) => {
    // This will be connected to MongoDB in a later step
    notifications.show({
      title: 'Evening Reflection Saved',
      message: 'Your evening reflection has been saved',
      color: 'green',
      icon: <IconCheck size="1.1rem" />,
    });
    console.log('Evening values:', values);
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
              <Button type="submit" fullWidth mt="md">
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
              <Button type="submit" fullWidth mt="md">
                Save Evening Reflection
              </Button>
            </form>
          </Card>
        </Grid.Col>
      </Grid>

      <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
        <Title order={2} mb="md">AI Insights</Title>
        <Text color="dimmed" mb="md">
          Gemini-powered insights will appear here after you've used the planner for a few days.
        </Text>
        <Paper withBorder p="md" radius="md">
          <Text style={{ fontStyle: 'italic' }}>
            "Based on your patterns, you're most productive in the mornings. Consider scheduling your most important tasks before noon."
          </Text>
        </Paper>
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
function setLoadingWeeklySummary(arg0: boolean) {
  throw new Error('Function not implemented.');
}

