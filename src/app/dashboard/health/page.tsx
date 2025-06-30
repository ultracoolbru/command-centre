"use client";

import { Box, Button, Card, Container, Grid, Group, MultiSelect, NumberInput, Paper, Slider, Tabs, Text, TextInput, Timeline, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { Icon360View, IconApple, IconCheck, IconHeartRateMonitor, IconMicrophone, IconMoon, IconPill } from '@tabler/icons-react';
import { useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// Mock data for charts
const mockMoodData = [
  { date: '05/16', mood: 7, energy: 6, pain: 3 },
  { date: '05/17', mood: 8, energy: 7, pain: 2 },
  { date: '05/18', mood: 6, energy: 5, pain: 4 },
  { date: '05/19', mood: 7, energy: 6, pain: 3 },
  { date: '05/20', mood: 9, energy: 8, pain: 1 },
  { date: '05/21', mood: 8, energy: 7, pain: 2 },
  { date: '05/22', mood: 7, energy: 6, pain: 3 },
];

export default function HealthTrackerPage() {
  const [date, setDate] = useState<Date | null>(new Date());
  const [activeTab, setActiveTab] = useState<string | null>('daily');
  const [isRecording, setIsRecording] = useState(false);

  const dailyForm = useForm({
    initialValues: {
      mood: 7,
      energy: 6,
      pain: 3,
      sleep: 7,
      w: null as number | null,
      nutrition: [],
      supplements: [],
      notes: '',
    },
    validate: {
      mood: (value) => (value === undefined || value === null ? 'Mood is required' : null),
      energy: (value) => (value === undefined || value === null ? 'Energy level is required' : null),
      pain: (value) => (value === undefined || value === null ? 'Pain level is required' : null),
      sleep: (value) => (value === undefined || value === null ? 'Sleep duration is required' : null),
    },
  });

  const handleDailySubmit = (values: typeof dailyForm.values) => {
    // This will be connected to MongoDB in a later step
    notifications.show({
      title: 'Health Data Saved',
      message: 'Your health metrics have been recorded',
      c: 'green',
      icon: <IconCheck size="1.1rem" />,
    });
    console.log('Health values:', values);
  };

  const toggleVoiceRecording = () => {
    // Voice recording functionality will be implemented in a later step
    setIsRecording(!isRecording);
    if (isRecording) {
      notifications.show({
        title: 'Voice Recording Stopped',
        message: 'Your voice input has been processed',
        c: 'blue',
      });
    } else {
      notifications.show({
        title: 'Voice Recording Started',
        message: 'Speak now to record your input',
        c: 'blue',
      });
    }
  };

  return (
    <Container size="lg">
      <Title order={1} mb="md">Health Tracker</Title>

      <Group justify="space-between" mb="xl">
        <TextInput
          value={date?.toLocaleDateString() || ''}
          label="Select Date"
          placeholder="Today's date"
          readOnly
          mx="auto"
          maw={400}
        />
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} mb="xl">
        <Tabs.List>
          <Tabs.Tab value="daily" leftSection={<IconHeartRateMonitor size="0.8rem" />}>Daily Log</Tabs.Tab>
          <Tabs.Tab value="trends" leftSection={<Icon360View size="0.8rem" />}>Trends & Analysis</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {activeTab === 'daily' && (
        <form onSubmit={dailyForm.onSubmit(handleDailySubmit)}>
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
                <Title order={2} mb="md">Wellness Metrics</Title>

                <Text w={500} mb="xs">Mood (1-10)</Text>
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  marks={[
                    { value: 1, label: '1' },
                    { value: 5, label: '5' },
                    { value: 10, label: '10' },
                  ]}
                  mb="md"
                  value={dailyForm.values.mood}
                  onChange={(value) => dailyForm.setFieldValue('mood', value)}
                />

                <Text w={500} mb="xs">Energy Level (1-10)</Text>
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  marks={[
                    { value: 1, label: '1' },
                    { value: 5, label: '5' },
                    { value: 10, label: '10' },
                  ]}
                  mb="md"
                  value={dailyForm.values.energy}
                  onChange={(value) => dailyForm.setFieldValue('energy', value)}
                />

                <Text w={500} mb="xs">Pain Level (1-10)</Text>
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  marks={[
                    { value: 1, label: '1' },
                    { value: 5, label: '5' },
                    { value: 10, label: '10' },
                  ]}
                  mb="md"
                  value={dailyForm.values.pain}
                  onChange={(value) => dailyForm.setFieldValue('pain', value)}
                />

                <Text w={500} mb="xs">Sleep Duration (hours)</Text>
                <Slider
                  min={0}
                  max={12}
                  step={0.5}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 6, label: '6' },
                    { value: 12, label: '12' },
                  ]}
                  mb="md"
                  value={dailyForm.values.sleep}
                  onChange={(value) => dailyForm.setFieldValue('sleep', value)}
                />
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
                <Title order={2} mb="md">Physical Metrics</Title>

                <NumberInput
                  label="w (kg)"
                  placeholder="Enter your w"
                  decimalScale={1}
                  min={0}
                  step={0.1}
                  mb="md"
                  value={dailyForm.values.w ?? undefined}
                  onChange={(value) => dailyForm.setFieldValue('w', value === '' ? null : Number(value))}
                />

                <MultiSelect
                  label="Nutrition"
                  placeholder="Select food groups consumed today"
                  data={[
                    { value: 'vegetables', label: 'Vegetables' },
                    { value: 'fruits', label: 'Fruits' },
                    { value: 'grains', label: 'Whole Grains' },
                    { value: 'protein', label: 'Protein' },
                    { value: 'dairy', label: 'Dairy' },
                    { value: 'processed', label: 'Processed Foods' },
                    { value: 'sugar', label: 'Sugar' },
                  ]}
                  mb="md"
                  {...dailyForm.getInputProps('nutrition')}
                />

                <MultiSelect
                  label="Supplements"
                  placeholder="Select supplements taken today"
                  data={[
                    { value: 'multivitamin', label: 'Multivitamin' },
                    { value: 'vitamin_d', label: 'Vitamin D' },
                    { value: 'omega3', label: 'Omega-3' },
                    { value: 'magnesium', label: 'Magnesium' },
                    { value: 'zinc', label: 'Zinc' },
                    { value: 'protein', label: 'Protein' },
                    { value: 'creatine', label: 'Creatine' },
                    { value: 'trt', label: 'TRT' },
                  ]}
                  mb="md"
                  {...dailyForm.getInputProps('supplements')}
                />

                <TextInput
                  label="Additional Notes"
                  placeholder="Any other health observations"
                  mb="md"
                  {...dailyForm.getInputProps('notes')}
                />

                <Group justify="flex-end" mb="md">
                  <Button
                    variant={isRecording ? "filled" : "outline"}
                    c={isRecording ? "red" : "blue"}
                    onClick={toggleVoiceRecording}
                    leftSection={<IconMicrophone size="1.1rem" />}
                  >
                    {isRecording ? "Stop Recording" : "Voice Input"}
                  </Button>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>

          <Button type="submit" fullWidth mt="md" mb="xl">
            Save Health Data
          </Button>
        </form>
      )}

      {activeTab === 'trends' && (
        <>
          <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
            <Title order={2} mb="md">Wellness Trends</Title>
            <Box h={300}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={mockMoodData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="mood" stroke="#8884d8" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="energy" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="pain" stroke="#ff7300" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
            <Title order={2} mb="md">AI Health Insights</Title>
            <Text c="dimmed" mb="md">
              Gemini-powered health insights based on your tracked data.
            </Text>
            <Paper withBorder p="md" radius="md" mb="md">
              <Text w={500}>Sleep-Mood Correlation</Text>
              <Text style={{ fontStyle: 'italic' }}>
                "Your mood scores are consistently higher on days following 7+ hours of sleep. Consider prioritizing sleep for better overall wellbeing."
              </Text>
            </Paper>
            <Paper withBorder p="md" radius="md" mb="md">
              <Text w={500}>Fibromyalgia Pattern</Text>
              <Text style={{ fontStyle: 'italic' }}>
                "Pain levels tend to increase after days with less than 6 hours of sleep or high stress. Consider sleep hygiene improvements."
              </Text>
            </Paper>
            <Paper withBorder p="md" radius="md">
              <Text w={500}>Supplement Effectiveness</Text>
              <Text style={{ fontStyle: 'italic' }}>
                "On days when you take Vitamin D and Magnesium, your energy levels are 23% higher on average."
              </Text>
            </Paper>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Title order={2} mb="md">Health Timeline</Title>
            <Timeline active={3} bulletSize={24} lineWidth={2}>
              <Timeline.Item title="May 16" bullet={<IconMoon size={12} />}>
                <Text c="dimmed" size="sm">Sleep: 7.5h, Mood: 7/10</Text>
                <Text size="xs" mt={4}>Supplements: Multivitamin, Vitamin D</Text>
              </Timeline.Item>
              <Timeline.Item title="May 17" bullet={<IconApple size={12} />}>
                <Text c="dimmed" size="sm">Nutrition focus day</Text>
                <Text size="xs" mt={4}>Added more vegetables and protein</Text>
              </Timeline.Item>
              <Timeline.Item title="May 18" bullet={<IconHeartRateMonitor size={12} />}>
                <Text c="dimmed" size="sm">Higher pain day (4/10)</Text>
                <Text size="xs" mt={4}>Possible correlation with weather change</Text>
              </Timeline.Item>
              <Timeline.Item title="May 19" bullet={<IconPill size={12} />}>
                <Text c="dimmed" size="sm">Started new supplement regimen</Text>
                <Text size="xs" mt={4}>Added Magnesium and Omega-3</Text>
              </Timeline.Item>
              <Timeline.Item title="May 20" bullet={<Icon360View size={12} />}>
                <Text c="dimmed" size="sm">w: 75.5kg</Text>
                <Text size="xs" mt={4}>Down 0.5kg from last week</Text>
              </Timeline.Item>
            </Timeline>
          </Card>
        </>
      )}
    </Container>
  );
}
