"use client";

import { useState } from 'react';
import { Title, Container, Card, Text, Button, Group, TextInput, Textarea, Grid, Paper, Tabs, Badge, ActionIcon, Switch, Select } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconBell, IconCheck, IconDownload, IconMicrophone, IconSend, IconCalendarEvent } from '@tabler/icons-react';

export default function RemindersPage() {
  const [activeTab, setActiveTab] = useState<string | null>('reminders');
  const [isRecording, setIsRecording] = useState(false);
  const [date, setDate] = useState<Date | null>(new Date());

  const reminderForm = useForm({
    initialValues: {
      title: '',
      description: '',
      date: null as Date | null,
      time: '',
      method: 'telegram',
      repeat: 'none',
    },
  });

  const exportForm = useForm({
    initialValues: {
      module: 'health',
      format: 'pdf',
      dateRange: '7',
    },
  });

  const handleReminderSubmit = (values: typeof reminderForm.values) => {
    // This will be connected to MongoDB and notification services in a later step
    notifications.show({
      title: 'Reminder Set',
      message: 'Your reminder has been scheduled',
      color: 'green',
      icon: <IconCheck size="1.1rem" />,
    });
    console.log('Reminder values:', values);
    reminderForm.reset();
  };

  const handleExportSubmit = (values: typeof exportForm.values) => {
    // This will be connected to export functionality in a later step
    notifications.show({
      title: 'Export Started',
      message: `Exporting ${values.module} data as ${values.format}`,
      color: 'blue',
      icon: <IconCheck size="1.1rem" />,
    });
    console.log('Export values:', values);
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
      // Simulate adding transcribed reminder
      reminderForm.setFieldValue('title', 'Voice transcribed reminder');
      reminderForm.setFieldValue('description', 'Details from voice input would appear here');
    } else {
      notifications.show({
        title: 'Voice Recording Started',
        message: 'Speak your reminder details',
        color: 'blue',
      });
    }
  };

  return (
    <Container size="lg">
      <Title order={1} mb="md">Reminders & Exports</Title>

      <Tabs value={activeTab} onChange={setActiveTab} mb="xl">
        <Tabs.List>
          <Tabs.Tab value="reminders" icon={<IconBell size="0.8rem" />}>Reminders</Tabs.Tab>
          <Tabs.Tab value="exports" icon={<IconDownload size="0.8rem" />}>Exports</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {activeTab === 'reminders' && (
        <>
          <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
            <Title order={2} mb="md">Set New Reminder</Title>
            <form onSubmit={reminderForm.onSubmit(handleReminderSubmit)}>
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Title"
                    placeholder="Reminder title"
                    required
                    mb="md"
                    {...reminderForm.getInputProps('title')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Group position="right" mb="md" style={{ height: '100%', alignItems: 'flex-end' }}>
                    <Button
                      variant={isRecording ? "filled" : "outline"}
                      color={isRecording ? "red" : "blue"}
                      onClick={toggleVoiceRecording}
                      leftIcon={<IconMicrophone size="1.1rem" />}
                    >
                      {isRecording ? "Stop Recording" : "Voice Input"}
                    </Button>
                  </Group>
                </Grid.Col>
              </Grid>

              <Textarea
                label="Description"
                placeholder="Additional details"
                mb="md"
                {...reminderForm.getInputProps('description')}
              />

              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <DatePickerInput
                    label="Date"
                    placeholder="Select date"
                    required
                    mb="md"
                    value={reminderForm.values.date}
                    onChange={(value) => reminderForm.setFieldValue('date', value)}
                    minDate={new Date()}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Time"
                    placeholder="e.g., 14:30"
                    required
                    mb="md"
                    {...reminderForm.getInputProps('time')}
                  />
                </Grid.Col>
              </Grid>

              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label="Notification Method"
                    placeholder="Select method"
                    data={[
                      { value: 'telegram', label: 'Telegram' },
                      { value: 'email', label: 'Email' },
                      { value: 'both', label: 'Both' },
                    ]}
                    mb="md"
                    {...reminderForm.getInputProps('method')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label="Repeat"
                    placeholder="Select frequency"
                    data={[
                      { value: 'none', label: 'Do not repeat' },
                      { value: 'daily', label: 'Daily' },
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'monthly', label: 'Monthly' },
                    ]}
                    mb="md"
                    {...reminderForm.getInputProps('repeat')}
                  />
                </Grid.Col>
              </Grid>

              <Button type="submit" fullWidth mt="md">
                Set Reminder
              </Button>
            </form>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Title order={2} mb="md">Upcoming Reminders</Title>

            <Paper withBorder p="md" radius="md" mb="md">
              <Group position="apart" mb="xs">
                <div>
                  <Text weight={500}>Weekly Health Check</Text>
                  <Text size="sm" color="dimmed">Log your weekly health metrics</Text>
                </div>
                <Badge>Tomorrow, 10:00 AM</Badge>
              </Group>
              <Group position="apart">
                <Badge color="blue" variant="outline">Telegram</Badge>
                <Badge color="gray" variant="outline">Weekly</Badge>
              </Group>
            </Paper>

            <Paper withBorder p="md" radius="md" mb="md">
              <Group position="apart" mb="xs">
                <div>
                  <Text weight={500}>Violt Team Meeting</Text>
                  <Text size="sm" color="dimmed">Discuss progress on SmartThings integration</Text>
                </div>
                <Badge>May 24, 2:00 PM</Badge>
              </Group>
              <Group position="apart">
                <Badge color="green" variant="outline">Email</Badge>
                <Badge color="gray" variant="outline">One-time</Badge>
              </Group>
            </Paper>

            <Paper withBorder p="md" radius="md">
              <Group position="apart" mb="xs">
                <div>
                  <Text weight={500}>Daily Journal Reminder</Text>
                  <Text size="sm" color="dimmed">Don't forget to write in your journal</Text>
                </div>
                <Badge>Today, 8:00 PM</Badge>
              </Group>
              <Group position="apart">
                <Badge color="purple" variant="outline">Both</Badge>
                <Badge color="gray" variant="outline">Daily</Badge>
              </Group>
            </Paper>
          </Card>
        </>
      )}

      {activeTab === 'exports' && (
        <>
          <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
            <Title order={2} mb="md">Export Data</Title>
            <form onSubmit={exportForm.onSubmit(handleExportSubmit)}>
              <Grid>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Module"
                    placeholder="Select module"
                    data={[
                      { value: 'health', label: 'Health Tracker' },
                      { value: 'tasks', label: 'Tasks & Goals' },
                      { value: 'journal', label: 'Journal' },
                      { value: 'daily', label: 'Daily Planner' },
                      { value: 'violt', label: 'Violt Development' },
                      { value: 'all', label: 'All Data' },
                    ]}
                    mb="md"
                    {...exportForm.getInputProps('module')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Format"
                    placeholder="Select format"
                    data={[
                      { value: 'pdf', label: 'PDF Report' },
                      { value: 'csv', label: 'CSV Data' },
                      { value: 'json', label: 'JSON Data' },
                      { value: 'markdown', label: 'Markdown' },
                    ]}
                    mb="md"
                    {...exportForm.getInputProps('format')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Date Range"
                    placeholder="Select range"
                    data={[
                      { value: '7', label: 'Last 7 days' },
                      { value: '30', label: 'Last 30 days' },
                      { value: '90', label: 'Last 90 days' },
                      { value: 'all', label: 'All time' },
                    ]}
                    mb="md"
                    {...exportForm.getInputProps('dateRange')}
                  />
                </Grid.Col>
              </Grid>

              <Button type="submit" fullWidth mt="md">
                Generate Export
              </Button>
            </form>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
            <Title order={2} mb="md">Recent Exports</Title>

            <Paper withBorder p="md" radius="md" mb="md">
              <Group position="apart">
                <div>
                  <Text weight={500}>Health_Report_May_2025.pdf</Text>
                  <Text size="sm" color="dimmed">Generated on May 20, 2025</Text>
                </div>
                <Button variant="light" leftIcon={<IconDownload size="1.1rem" />}>
                  Download
                </Button>
              </Group>
            </Paper>

            <Paper withBorder p="md" radius="md" mb="md">
              <Group position="apart">
                <div>
                  <Text weight={500}>Tasks_Export_Q2_2025.csv</Text>
                  <Text size="sm" color="dimmed">Generated on May 15, 2025</Text>
                </div>
                <Button variant="light" leftIcon={<IconDownload size="1.1rem" />}>
                  Download
                </Button>
              </Group>
            </Paper>

            <Paper withBorder p="md" radius="md">
              <Group position="apart">
                <div>
                  <Text weight={500}>Journal_Entries_April_2025.markdown</Text>
                  <Text size="sm" color="dimmed">Generated on May 1, 2025</Text>
                </div>
                <Button variant="light" leftIcon={<IconDownload size="1.1rem" />}>
                  Download
                </Button>
              </Group>
            </Paper>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Title order={2} mb="md">Scheduled Reports</Title>

            <Paper withBorder p="md" radius="md" mb="md">
              <Group position="apart" mb="xs">
                <div>
                  <Text weight={500}>Weekly Health Summary</Text>
                  <Text size="sm" color="dimmed">PDF report of health metrics</Text>
                </div>
                <Switch defaultChecked />
              </Group>
              <Group position="apart">
                <Badge color="blue">Every Sunday</Badge>
                <Badge color="green">Email Delivery</Badge>
              </Group>
            </Paper>

            <Paper withBorder p="md" radius="md">
              <Group position="apart" mb="xs">
                <div>
                  <Text weight={500}>Monthly Progress Report</Text>
                  <Text size="sm" color="dimmed">Comprehensive dashboard summary</Text>
                </div>
                <Switch defaultChecked />
              </Group>
              <Group position="apart">
                <Badge color="blue">1st of each month</Badge>
                <Badge color="green">Email Delivery</Badge>
              </Group>
            </Paper>
          </Card>
        </>
      )}
    </Container>
  );
}
