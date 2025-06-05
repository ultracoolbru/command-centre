"use client";

import { useState } from 'react';
import { Title, Container, Card, Text, Button, Group, TextInput, Textarea, Grid, Paper, Tabs, Badge, ActionIcon, Code, ScrollArea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconTerminal, IconRefresh, IconCheck, IconMicrophone, IconPlayerPlay, IconDownload, IconUpload } from '@tabler/icons-react';

interface EchoTask {
  id: string;
  command: string;
  output: string;
  timestamp: Date;
  status: 'success' | 'error' | 'pending';
}

export default function EchoCliPage() {
  const [activeTab, setActiveTab] = useState<string | null>('tasks');
  const [isRecording, setIsRecording] = useState(false);

  const [echoTasks, setEchoTasks] = useState<EchoTask[]>([
    {
      id: '1',
      command: 'echo:task add "Complete dashboard UI"',
      output: 'Task added: Complete dashboard UI',
      timestamp: new Date(2025, 4, 21, 14, 30),
      status: 'success'
    },
    {
      id: '2',
      command: 'echo:task list --priority=high',
      output: '1. Complete dashboard UI (high)\n2. Implement MongoDB integration (high)',
      timestamp: new Date(2025, 4, 21, 15, 45),
      status: 'success'
    },
    {
      id: '3',
      command: 'echo:health log --mood=8 --energy=7',
      output: 'Health metrics logged for May 21, 2025',
      timestamp: new Date(2025, 4, 21, 20, 15),
      status: 'success'
    }
  ]);

  const commandForm = useForm({
    initialValues: {
      command: '',
    },
  });

  const handleCommandSubmit = (values: typeof commandForm.values) => {
    // This will be connected to MongoDB and actual Echo CLI in a later step
    const newTask: EchoTask = {
      id: Date.now().toString(),
      command: values.command,
      output: `Simulated output for: ${values.command}`,
      timestamp: new Date(),
      status: 'success',
    };

    setEchoTasks([newTask, ...echoTasks]);
    commandForm.reset();

    notifications.show({
      title: 'Command Executed',
      message: 'Echo CLI command has been processed',
      color: 'green',
      icon: <IconCheck size="1.1rem" />,
    });
  };

  const rerunCommand = (command: string) => {
    const newTask: EchoTask = {
      id: Date.now().toString(),
      command: command,
      output: `Re-executed: ${command}\nSimulated output for rerun`,
      timestamp: new Date(),
      status: 'success',
    };

    setEchoTasks([newTask, ...echoTasks]);

    notifications.show({
      title: 'Command Re-executed',
      message: 'Echo CLI command has been rerun',
      color: 'blue',
    });
  };

  const toggleVoiceRecording = () => {
    // Voice recording functionality will be implemented in a later step
    setIsRecording(!isRecording);
    if (isRecording) {
      notifications.show({
        title: 'Voice Recording Stopped',
        message: 'Your voice command has been processed',
        color: 'blue',
      });
      // Simulate adding transcribed command
      commandForm.setFieldValue('command', 'echo:task add "Voice transcribed task"');
    } else {
      notifications.show({
        title: 'Voice Recording Started',
        message: 'Speak your Echo command',
        color: 'blue',
      });
    }
  };

  return (
    <Container size="lg">
      <Title order={1} mb="md">Echo CLI Integration</Title>

      <Tabs value={activeTab} onChange={setActiveTab} mb="xl">
        <Tabs.List>
          <Tabs.Tab value="tasks" icon={<IconTerminal size="0.8rem" />}>CLI Interface</Tabs.Tab>
          <Tabs.Tab value="sync" icon={<IconRefresh size="0.8rem" />}>Sync Status</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {activeTab === 'tasks' && (
        <>
          <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
            <Title order={2} mb="md">Echo Command</Title>
            <form onSubmit={commandForm.onSubmit(handleCommandSubmit)}>
              <Grid>
                <Grid.Col span={{ base: 12, md: 9 }}>
                  <TextInput
                    label="Command"
                    placeholder="echo:task add 'New task'"
                    required
                    mb="md"
                    {...commandForm.getInputProps('command')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 3 }} style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <Button
                    variant={isRecording ? "filled" : "outline"}
                    color={isRecording ? "red" : "blue"}
                    onClick={toggleVoiceRecording}
                    leftIcon={<IconMicrophone size="1.1rem" />}
                    fullWidth
                    mb="md"
                  >
                    {isRecording ? "Stop" : "Voice"}
                  </Button>
                </Grid.Col>
              </Grid>

              <Group position="right">
                <Button type="submit" leftIcon={<IconPlayerPlay size="1.1rem" />}>
                  Execute
                </Button>
              </Group>
            </form>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
            <Title order={2} mb="md">Command History</Title>

            {echoTasks.map((task) => (
              <Paper key={task.id} withBorder p="md" radius="md" mb="md">
                <Group position="apart" mb="xs">
                  <Group>
                    <Badge color={task.status === 'success' ? 'green' : task.status === 'error' ? 'red' : 'yellow'}>
                      {task.status}
                    </Badge>
                    <Text size="sm" color="dimmed">
                      {task.timestamp.toLocaleString()}
                    </Text>
                  </Group>
                  <Button
                    variant="subtle"
                    size="xs"
                    onClick={() => rerunCommand(task.command)}
                  >
                    Rerun
                  </Button>
                </Group>

                <Code block mb="xs">{task.command}</Code>

                <Text weight={500} size="sm" mb="xs">Output:</Text>
                <ScrollArea h={100} mb="xs">
                  <Code block>{task.output}</Code>
                </ScrollArea>
              </Paper>
            ))}

            {echoTasks.length === 0 && (
              <Text color="dimmed" ta="center" py="xl">
                No commands executed yet. Run your first Echo CLI command above.
              </Text>
            )}
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Title order={2} mb="md">Quick Reference</Title>

            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper withBorder p="md" radius="md">
                  <Text weight={500} mb="xs">Task Commands</Text>
                  <Code block>
                    echo:task add "Task description"<br />
                    echo:task list [--priority=high|medium|low]<br />
                    echo:task complete &lt;id&gt;<br />
                    echo:task delete &lt;id&gt;
                  </Code>
                </Paper>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper withBorder p="md" radius="md">
                  <Text weight={500} mb="xs">Health Commands</Text>
                  <Code block>
                    echo:health log --mood=&lt;1-10&gt; --energy=&lt;1-10&gt;<br />
                    echo:health report [--days=7|30|90]<br />
                    echo:health trend &lt;metric&gt;
                  </Code>
                </Paper>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper withBorder p="md" radius="md">
                  <Text weight={500} mb="xs">Journal Commands</Text>
                  <Code block>
                    echo:journal add "Entry content"<br />
                    echo:journal list [--tags=tag1,tag2]<br />
                    echo:journal search &lt;term&gt;
                  </Code>
                </Paper>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper withBorder p="md" radius="md">
                  <Text weight={500} mb="xs">System Commands</Text>
                  <Code block>
                    echo:sync [--force]<br />
                    echo:export &lt;module&gt; [--format=json|csv]<br />
                    echo:help [command]
                  </Code>
                </Paper>
              </Grid.Col>
            </Grid>
          </Card>
        </>
      )}

      {activeTab === 'sync' && (
        <>
          <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
            <Group position="apart" mb="md">
              <Title order={2}>MongoDB Sync Status</Title>
              <Group>
                <Button variant="light" leftIcon={<IconDownload size="1.1rem" />}>
                  Pull Changes
                </Button>
                <Button variant="light" leftIcon={<IconUpload size="1.1rem" />}>
                  Push Changes
                </Button>
                <Button leftIcon={<IconRefresh size="1.1rem" />}>
                  Full Sync
                </Button>
              </Group>
            </Group>

            <Paper withBorder p="md" radius="md" mb="md">
              <Group position="apart" mb="xs">
                <Text weight={500}>Last Sync</Text>
                <Badge color="green">Success</Badge>
              </Group>
              <Text size="sm">May 22, 2025 at 10:45 AM</Text>
            </Paper>

            <Paper withBorder p="md" radius="md" mb="md">
              <Group position="apart" mb="xs">
                <Text weight={500}>Local Changes</Text>
                <Badge>3 items</Badge>
              </Group>
              <Text size="sm">Changes waiting to be pushed to MongoDB</Text>
            </Paper>

            <Paper withBorder p="md" radius="md">
              <Group position="apart" mb="xs">
                <Text weight={500}>Remote Changes</Text>
                <Badge>1 item</Badge>
              </Group>
              <Text size="sm">Changes waiting to be pulled from MongoDB</Text>
            </Paper>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Title order={2} mb="md">Sync Log</Title>

            <ScrollArea h={300}>
              <Code block>
                [2025-05-22 10:45:23] Sync completed successfully<br />
                [2025-05-22 10:45:22] Pushed 5 tasks to MongoDB<br />
                [2025-05-22 10:45:21] Pulled 2 journal entries from MongoDB<br />
                [2025-05-22 10:45:20] Sync started<br />
                [2025-05-21 18:30:15] Sync completed successfully<br />
                [2025-05-21 18:30:14] Pushed 3 health logs to MongoDB<br />
                [2025-05-21 18:30:13] Pulled 1 task update from MongoDB<br />
                [2025-05-21 18:30:12] Sync started<br />
                [2025-05-20 09:15:45] Sync completed with warnings<br />
                [2025-05-20 09:15:44] Warning: Network latency detected<br />
                [2025-05-20 09:15:43] Pushed 2 tasks to MongoDB<br />
                [2025-05-20 09:15:42] Sync started
              </Code>
            </ScrollArea>
          </Card>
        </>
      )}
    </Container>
  );
}
