"use client";

import { useAuth } from '@/lib/auth-context';
import { ActionIcon, Box, Button, Card, Container, Grid, Group, MultiSelect, NumberInput, Slider, Tabs, Text, TextInput, Timeline, Title, Tooltip } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { Icon360View, IconApple, IconCheck, IconHeartRateMonitor, IconMicrophone, IconMoon, IconPill } from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import AIHealthInsightsSection from './AIHealthInsightsSection';
// Utility to ensure a Date object
function ensureDate(d: Date | string | null | undefined): Date | null {
  if (!d) return null;
  if (d instanceof Date) return d;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
}

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
  const { user } = useAuth();
  const [date, setDate] = useState<Date | null>(new Date());
  const [activeTab, setActiveTab] = useState<string | null>('daily');
  const [isRecording, setIsRecording] = useState(false);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);

  // Fetch health logs for the selected week and user
  useEffect(() => {
    if (!user?.uid || !date) {
      setTrendData([]);
      return;
    }
    setTrendLoading(true);
    const safeDate = ensureDate(date);
    fetch(`/api/healthlog/week?userId=${user.uid}&date=${safeDate ? safeDate.toISOString() : ''}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.logs)) {
          // Map logs to chart data format
          setTrendData(data.logs.map((log: any) => ({
            date: log.date ? new Date(log.date).toLocaleDateString() : '',
            mood: log.mood,
            energy: log.energy,
            pain: log.pain
          })));
        } else {
          setTrendData([]);
        }
      })
      .catch(() => setTrendData([]))
      .finally(() => setTrendLoading(false));
  }, [user, date]);

  // Fetch last 10 health logs for the user, sorted descending by date
  const fetchRecentLogs = useCallback(() => {
    if (!user?.uid) {
      setRecentLogs([]);
      return;
    }
    setRecentLoading(true);
    fetch(`/api/healthlog/recent?userId=${user.uid}&limit=10`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.logs)) {
          // Sort logs descending by date
          const sorted = [...data.logs].sort((a, b) => {
            const da = a.date ? new Date(a.date).getTime() : 0;
            const db = b.date ? new Date(b.date).getTime() : 0;
            return db - da;
          });
          setRecentLogs(sorted);
        } else {
          setRecentLogs([]);
        }
      })
      .catch(() => setRecentLogs([]))
      .finally(() => setRecentLoading(false));
  }, [user]);

  useEffect(() => {
    if (activeTab === 'daily') fetchRecentLogs();
  }, [activeTab, fetchRecentLogs]);

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

  const handleDailySubmit = async (values: typeof dailyForm.values) => {
    if (!user?.uid) {
      notifications.show({
        title: 'Not Authenticated',
        message: 'You must be logged in to save health data.',
        c: 'red',
      });
      return;
    }
    try {
      // Always use the selected date
      const safeDate = ensureDate(date);
      const res = await fetch('/api/healthlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, ...values, date: safeDate ? safeDate.toISOString() : undefined }),
      });
      const data = await res.json();
      if (data.success) {
        notifications.show({
          title: 'Health Data Saved',
          message: 'Your health metrics have been recorded',
          c: 'green',
          icon: <IconCheck size="1.1rem" />,
        });
        fetchRecentLogs(); // Refresh recent logs after save
      } else {
        notifications.show({
          title: 'Save Failed',
          message: data.error || 'Could not save health data',
          c: 'red',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Save Failed',
        message: 'Could not save health data',
        c: 'red',
      });
    }
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
                  <Tooltip label={isRecording ? "Stop Recording" : "Voice Input"}>
                    <ActionIcon
                      variant={isRecording ? "filled" : "outline"}
                      color={isRecording ? "red" : "blue"}
                      size="xl"
                      radius="xl"
                      onClick={toggleVoiceRecording}
                      aria-label={isRecording ? "Stop Recording" : "Voice Input"}
                      style={{ boxShadow: isRecording ? '0 0 0 2px #fa5252' : '0 0 0 1px #228be6', transition: 'box-shadow 0.2s' }}
                    >
                      <IconMicrophone size="1.5rem" />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>

          <Button type="submit" fullWidth mt="md" mb="xl">
            Save Health Data
          </Button>

          {/* Show last 10 entries */}
          <Card shadow="sm" p="md" radius="md" withBorder mt="xl">
            <Title order={3} mb="md">Last 10 Entries</Title>
            {recentLoading ? (
              <Text>Loading recent entries...</Text>
            ) : recentLogs.length === 0 ? (
              <Text c="dimmed">No recent entries found.</Text>
            ) : (
              <Box style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: 4 }}>Date</th>
                      <th style={{ textAlign: 'left', padding: 4 }}>Mood</th>
                      <th style={{ textAlign: 'left', padding: 4 }}>Energy</th>
                      <th style={{ textAlign: 'left', padding: 4 }}>Pain</th>
                      <th style={{ textAlign: 'left', padding: 4 }}>Sleep</th>
                      <th style={{ textAlign: 'left', padding: 4 }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogs.map((log, idx) => (
                      <tr key={log._id || idx} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: 4 }}>{log.date ? new Date(log.date).toLocaleDateString() : ''}</td>
                        <td style={{ padding: 4 }}>{log.mood ?? '-'}</td>
                        <td style={{ padding: 4 }}>{log.energy ?? '-'}</td>
                        <td style={{ padding: 4 }}>{log.pain ?? '-'}</td>
                        <td style={{ padding: 4 }}>{log.sleep ?? '-'}</td>
                        <td style={{ padding: 4 }}>{log.notes ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}
          </Card>
        </form>
      )}

      {activeTab === 'trends' && (
        <>
          <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
            <Title order={2} mb="md">Wellness Trends</Title>
            <Box h={300}>
              {trendLoading ? (
                <Group justify="center" mt="md"><Text>Loading trends...</Text></Group>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData}
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
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="mood" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="energy" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="pain" stroke="#ff7300" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Card>
          <AIHealthInsightsSection date={date} />
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Title order={2} mb="md">Health Timeline</Title>
            {recentLogs.length === 0 ? (
              <Text c="dimmed">No health entries to display in timeline.</Text>
            ) : (
              <Timeline active={0} bulletSize={24} lineWidth={2}>
                {recentLogs.slice(0, 5).map((log, index) => {
                  // Determine icon based on notable metrics
                  let icon = <IconHeartRateMonitor size={12} />;
                  let primaryMetric = `Mood: ${log.mood}/10, Energy: ${log.energy}/10`;
                  let secondaryInfo = '';

                  if (log.sleep && log.sleep >= 8) {
                    icon = <IconMoon size={12} />;
                    primaryMetric = `Sleep: ${log.sleep}h, Mood: ${log.mood}/10`;
                  } else if (log.pain && log.pain >= 6) {
                    icon = <IconHeartRateMonitor size={12} />;
                    primaryMetric = `Higher pain day (${log.pain}/10)`;
                  } else if (log.supplements && log.supplements.length > 0) {
                    icon = <IconPill size={12} />;
                    primaryMetric = `Supplements: ${log.supplements.join(', ')}`;
                  } else if (log.nutrition && log.nutrition.includes('vegetables') && log.nutrition.includes('fruits')) {
                    icon = <IconApple size={12} />;
                    primaryMetric = 'Nutrition focus day';
                  } else if (log.w) {
                    icon = <Icon360View size={12} />;
                    primaryMetric = `Weight: ${log.w}kg`;
                  }

                  // Build secondary info
                  if (log.supplements && log.supplements.length > 0 && !primaryMetric.includes('Supplements')) {
                    secondaryInfo = `Supplements: ${log.supplements.join(', ')}`;
                  } else if (log.nutrition && log.nutrition.length > 0 && !primaryMetric.includes('Nutrition')) {
                    secondaryInfo = `Nutrition: ${log.nutrition.join(', ')}`;
                  } else if (log.notes && log.notes.trim()) {
                    secondaryInfo = log.notes;
                  } else if (log.w && !primaryMetric.includes('Weight')) {
                    secondaryInfo = `Weight: ${log.w}kg`;
                  }

                  const logDate = log.date ? new Date(log.date) : new Date();
                  const dateTitle = logDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <Timeline.Item key={log._id || index} title={dateTitle} bullet={icon}>
                      <Text c="dimmed" size="sm">{primaryMetric}</Text>
                      {secondaryInfo && <Text size="xs" mt={4}>{secondaryInfo}</Text>}
                    </Timeline.Item>
                  );
                })}
              </Timeline>
            )}
          </Card>
        </>
      )}
    </Container>
  );
}
