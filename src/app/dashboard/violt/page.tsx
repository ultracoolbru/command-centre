"use client";

import { useState } from 'react';
import { Title, Container, Card, Text, Button, Group, TextInput, Textarea, Grid, Paper, Tabs, Badge, ActionIcon, Progress, Timeline, Menu } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconBrandGithub, IconCode, IconBulb, IconCheck, IconX, IconDotsVertical, IconMicrophone, IconBrandGit, IconBug, IconRocket } from '@tabler/icons-react';

interface ProjectPhase {
  id: string;
  name: string;
  description: string;
  progress: number;
  status: 'planning' | 'in-progress' | 'review' | 'completed';
}

interface DevTask {
  id: string;
  title: string;
  description: string;
  phase: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
}

export default function VioltPage() {
  const [activeTab, setActiveTab] = useState<string | null>('overview');
  const [isRecording, setIsRecording] = useState(false);

  const [phases, setPhases] = useState<ProjectPhase[]>([
    {
      id: '1',
      name: 'Core Platform',
      description: 'Develop the foundational Violt Core platform with local-only functionality',
      progress: 85,
      status: 'in-progress'
    },
    {
      id: '2',
      name: 'SmartThings Integration',
      description: 'Implement SmartThings integration layer for device control',
      progress: 40,
      status: 'in-progress'
    },
    {
      id: '3',
      name: 'AI Cloud Extension',
      description: 'Develop cloud-based AI extension for advanced automation',
      progress: 20,
      status: 'planning'
    },
    {
      id: '4',
      name: 'Robotics Plugin',
      description: 'Create plugin for robotics integration and control',
      progress: 10,
      status: 'planning'
    }
  ]);

  const [tasks, setTasks] = useState<DevTask[]>([
    {
      id: '1',
      title: 'Implement Cross-Platform Compatibility',
      description: 'Ensure Violt Core works on both Windows and Raspberry Pi',
      phase: '1',
      status: 'in-progress',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Develop SmartThings OAuth Integration',
      description: 'Implement OAuth handler for SmartThings API',
      phase: '2',
      status: 'todo',
      priority: 'high'
    },
    {
      id: '3',
      title: 'Create TypeScript Scripting Engine',
      description: 'Implement database-stored scripts for automation',
      phase: '1',
      status: 'todo',
      priority: 'medium'
    },
    {
      id: '4',
      title: 'Design AI Cloud Architecture',
      description: 'Plan cloud infrastructure for Violt AI extension',
      phase: '3',
      status: 'in-progress',
      priority: 'medium'
    }
  ]);

  const phaseForm = useForm({
    initialValues: {
      name: '',
      description: '',
    },
  });

  const taskForm = useForm({
    initialValues: {
      title: '',
      description: '',
      phase: '',
      priority: 'medium' as 'low' | 'medium' | 'high',
    },
  });

  const handlePhaseSubmit = (values: typeof phaseForm.values) => {
    // This will be connected to MongoDB in a later step
    const newPhase: ProjectPhase = {
      id: Date.now().toString(),
      name: values.name,
      description: values.description,
      progress: 0,
      status: 'planning',
    };

    setPhases([...phases, newPhase]);
    phaseForm.reset();

    notifications.show({
      title: 'Phase Added',
      message: 'New project phase has been created',
      color: 'green',
      icon: <IconCheck size="1.1rem" />,
    });
  };

  const handleTaskSubmit = (values: typeof taskForm.values) => {
    // This will be connected to MongoDB in a later step
    const newTask: DevTask = {
      id: Date.now().toString(),
      title: values.title,
      description: values.description,
      phase: values.phase,
      status: 'todo',
      priority: values.priority,
    };

    setTasks([...tasks, newTask]);
    taskForm.reset();

    notifications.show({
      title: 'Task Added',
      message: 'New development task has been created',
      color: 'green',
      icon: <IconCheck size="1.1rem" />,
    });
  };

  const updatePhaseProgress = (id: string, progress: number) => {
    setPhases(phases.map(phase =>
      phase.id === id ? { ...phase, progress } : phase
    ));
  };

  const updateTaskStatus = (id: string, status: 'todo' | 'in-progress' | 'review' | 'done') => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, status } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
    notifications.show({
      title: 'Task Deleted',
      message: 'The task has been removed',
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
    } else {
      notifications.show({
        title: 'Voice Recording Started',
        message: 'Speak now to record your input',
        color: 'blue',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'blue';
      case 'in-progress': return 'yellow';
      case 'review': return 'orange';
      case 'completed': return 'green';
      case 'todo': return 'gray';
      case 'done': return 'green';
      default: return 'gray';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  return (
    <Container size="lg">
      <Title order={1} mb="md">Violt Developer Panel</Title>

      <Tabs value={activeTab} onChange={setActiveTab} mb="xl">
        <Tabs.List>
          <Tabs.Tab value="overview" icon={<IconRocket size="0.8rem" />}>Project Overview</Tabs.Tab>
          <Tabs.Tab value="tasks" icon={<IconCode size="0.8rem" />}>Development Tasks</Tabs.Tab>
          <Tabs.Tab value="github" icon={<IconBrandGithub size="0.8rem" />}>GitHub Integration</Tabs.Tab>
          <Tabs.Tab value="ai" icon={<IconBulb size="0.8rem" />}>AI Insights</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {activeTab === 'overview' && (
        <>
          <Group position="apart" mb="md">
            <Title order={2}>Project Phases</Title>
            <Button
              variant={isRecording ? "filled" : "outline"}
              color={isRecording ? "red" : "blue"}
              onClick={toggleVoiceRecording}
              leftIcon={<IconMicrophone size="1.1rem" />}
            >
              {isRecording ? "Stop Recording" : "Voice Input"}
            </Button>
          </Group>

          {phases.map((phase) => (
            <Card key={phase.id} shadow="sm" p="lg" radius="md" withBorder mb="xl">
              <Group position="apart" mb="xs">
                <div>
                  <Title order={3}>{phase.name}</Title>
                  <Badge color={getStatusColor(phase.status)} mb="md">
                    {phase.status}
                  </Badge>
                </div>
                <Menu position="bottom-end">
                  <Menu.Target>
                    <ActionIcon>
                      <IconDotsVertical size="1.1rem" />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item>Edit Phase</Menu.Item>
                    <Menu.Item>View Details</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>

              <Text mb="md">{phase.description}</Text>

              <Text size="sm" mb="xs">Progress: {phase.progress}%</Text>
              <Progress value={phase.progress} mb="md" />

              <Group position="apart">
                <Button
                  compact
                  variant="light"
                  onClick={() => updatePhaseProgress(phase.id, Math.max(0, phase.progress - 10))}
                  disabled={phase.progress <= 0}
                >
                  -10%
                </Button>
                <Button
                  compact
                  variant="light"
                  onClick={() => updatePhaseProgress(phase.id, Math.min(100, phase.progress + 10))}
                  disabled={phase.progress >= 100}
                >
                  +10%
                </Button>
              </Group>
            </Card>
          ))}

          <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
            <Title order={3} mb="md">Add New Phase</Title>
            <form onSubmit={phaseForm.onSubmit(handlePhaseSubmit)}>
              <TextInput
                label="Phase Name"
                placeholder="e.g., Mobile App Development"
                required
                mb="md"
                {...phaseForm.getInputProps('name')}
              />
              <Textarea
                label="Description"
                placeholder="Describe this project phase"
                mb="md"
                {...phaseForm.getInputProps('description')}
              />
              <Button type="submit">Add Phase</Button>
            </form>
          </Card>
        </>
      )}

      {activeTab === 'tasks' && (
        <>
          <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
            <Title order={2} mb="md">Add Development Task</Title>
            <form onSubmit={taskForm.onSubmit(handleTaskSubmit)}>
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Task Title"
                    placeholder="What needs to be developed?"
                    required
                    mb="md"
                    {...taskForm.getInputProps('title')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label="Project Phase"
                    placeholder="Select associated phase"
                    data={phases.map(phase => ({ value: phase.id, label: phase.name }))}
                    required
                    mb="md"
                    {...taskForm.getInputProps('phase')}
                  />
                </Grid.Col>
              </Grid>

              <Textarea
                label="Description"
                placeholder="Describe the development task in detail"
                mb="md"
                {...taskForm.getInputProps('description')}
              />

              <Select
                label="Priority"
                placeholder="Select priority level"
                data={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                ]}
                mb="md"
                {...taskForm.getInputProps('priority')}
              />

              <Group position="apart" mt="md">
                <Button
                  variant={isRecording ? "filled" : "outline"}
                  color={isRecording ? "red" : "blue"}
                  onClick={toggleVoiceRecording}
                  leftIcon={<IconMicrophone size="1.1rem" />}
                >
                  {isRecording ? "Stop Recording" : "Voice Input"}
                </Button>
                <Button type="submit">Add Task</Button>
              </Group>
            </form>
          </Card>

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
                <Title order={3} mb="md">To Do</Title>
                {tasks.filter(task => task.status === 'todo').map((task) => (
                  <Paper key={task.id} withBorder p="md" radius="md" mb="sm">
                    <Group position="apart" mb="xs">
                      <Text weight={500}>{task.title}</Text>
                      <Menu position="bottom-end">
                        <Menu.Target>
                          <ActionIcon>
                            <IconDotsVertical size="1.1rem" />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item onClick={() => updateTaskStatus(task.id, 'in-progress')}>
                            Move to In Progress
                          </Menu.Item>
                          <Menu.Item onClick={() => deleteTask(task.id)} color="red">
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>

                    <Text size="sm" color="dimmed" mb="sm">{task.description}</Text>

                    <Group spacing="xs">
                      <Badge color={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      <Badge color="blue">
                        {phases.find(p => p.id === task.phase)?.name || 'Unknown Phase'}
                      </Badge>
                    </Group>
                  </Paper>
                ))}

                {tasks.filter(task => task.status === 'todo').length === 0 && (
                  <Text color="dimmed" ta="center" py="md">
                    No tasks in this category
                  </Text>
                )}
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
                <Title order={3} mb="md">In Progress</Title>
                {tasks.filter(task => task.status === 'in-progress').map((task) => (
                  <Paper key={task.id} withBorder p="md" radius="md" mb="sm">
                    <Group position="apart" mb="xs">
                      <Text weight={500}>{task.title}</Text>
                      <Menu position="bottom-end">
                        <Menu.Target>
                          <ActionIcon>
                            <IconDotsVertical size="1.1rem" />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item onClick={() => updateTaskStatus(task.id, 'review')}>
                            Move to Review
                          </Menu.Item>
                          <Menu.Item onClick={() => updateTaskStatus(task.id, 'todo')}>
                            Move back to To Do
                          </Menu.Item>
                          <Menu.Item onClick={() => deleteTask(task.id)} color="red">
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>

                    <Text size="sm" color="dimmed" mb="sm">{task.description}</Text>

                    <Group spacing="xs">
                      <Badge color={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      <Badge color="blue">
                        {phases.find(p => p.id === task.phase)?.name || 'Unknown Phase'}
                      </Badge>
                    </Group>
                  </Paper>
                ))}

                {tasks.filter(task => task.status === 'in-progress').length === 0 && (
                  <Text color="dimmed" ta="center" py="md">
                    No tasks in this category
                  </Text>
                )}
              </Card>
            </Grid.Col>
          </Grid>
        </>
      )}

      {activeTab === 'github' && (
        <>
          <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
            <Group mb="md">
              <IconBrandGithub size="1.5rem" />
              <Title order={2}>GitHub Repositories</Title>
            </Group>

            <Paper withBorder p="md" radius="md" mb="md">
              <Group position="apart">
                <Group>
                  <IconBrandGit size="1.2rem" />
                  <div>
                    <Text weight={500}>violt/violt-core</Text>
                    <Text size="sm" color="dimmed">Core platform repository</Text>
                  </div>
                </Group>
                <Button component="a" href="https://github.com/violt/violt-core" target="_blank" variant="light">
                  View Repo
                </Button>
              </Group>
            </Paper>

            <Paper withBorder p="md" radius="md" mb="md">
              <Group position="apart">
                <Group>
                  <IconBrandGit size="1.2rem" />
                  <div>
                    <Text weight={500}>violt/smartthings-integration</Text>
                    <Text size="sm" color="dimmed">SmartThings integration layer</Text>
                  </div>
                </Group>
                <Button component="a" href="https://github.com/violt/smartthings-integration" target="_blank" variant="light">
                  View Repo
                </Button>
              </Group>
            </Paper>

            <Paper withBorder p="md" radius="md" mb="md">
              <Group position="apart">
                <Group>
                  <IconBrandGit size="1.2rem" />
                  <div>
                    <Text weight={500}>violt/violt-ai</Text>
                    <Text size="sm" color="dimmed">AI cloud extension</Text>
                  </div>
                </Group>
                <Button component="a" href="https://github.com/violt/violt-ai" target="_blank" variant="light">
                  View Repo
                </Button>
              </Group>
            </Paper>

            <Paper withBorder p="md" radius="md">
              <Group position="apart">
                <Group>
                  <IconBrandGit size="1.2rem" />
                  <div>
                    <Text weight={500}>violt/robotics-plugin</Text>
                    <Text size="sm" color="dimmed">Robotics integration plugin</Text>
                  </div>
                </Group>
                <Button component="a" href="https://github.com/violt/robotics-plugin" target="_blank" variant="light">
                  View Repo
                </Button>
              </Group>
            </Paper>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
            <Group mb="md">
              <IconBug size="1.5rem" />
              <Title order={2}>Recent Issues</Title>
            </Group>

            <Timeline active={1} bulletSize={24} lineWidth={2}>
              <Timeline.Item title="Cross-platform compatibility issue" bullet={<IconX size={12} />}>
                <Text color="dimmed" size="sm">Issue #42 - Windows path handling in Violt Core</Text>
                <Text size="xs" mt={4}>Opened 2 days ago by edwardwhitehead</Text>
              </Timeline.Item>
              <Timeline.Item title="OAuth token refresh not working" bullet={<IconX size={12} />}>
                <Text color="dimmed" size="sm">Issue #28 - SmartThings integration</Text>
                <Text size="xs" mt={4}>Opened 5 days ago by developer123</Text>
              </Timeline.Item>
              <Timeline.Item title="TypeScript scripting engine memory leak" bullet={<IconCheck size={12} />}>
                <Text color="dimmed" size="sm">Issue #15 - Fixed in PR #16</Text>
                <Text size="xs" mt={4}>Closed 1 week ago</Text>
              </Timeline.Item>
            </Timeline>
          </Card>
        </>
      )}

      {activeTab === 'ai' && (
        <>
          <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
            <Title order={2} mb="md">Development Insights</Title>
            <Text color="dimmed" mb="md">
              Gemini-powered insights for your Violt development projects.
            </Text>

            <Paper withBorder p="md" radius="md" mb="md">
              <Text weight={500}>Cross-Platform Compatibility</Text>
              <Text>
                Based on your current tasks, consider implementing a platform-agnostic file path handler to resolve the Windows path issues in Issue #42. This would improve compatibility across Windows and Raspberry Pi environments.
              </Text>
            </Paper>

            <Paper withBorder p="md" radius="md" mb="md">
              <Text weight={500}>SmartThings Integration</Text>
              <Text>
                The OAuth token refresh issue might be related to incorrect token storage or expiration handling. Consider implementing a more robust token management system with proper error handling and automatic refresh logic.
              </Text>
            </Paper>

            <Paper withBorder p="md" radius="md">
              <Text weight={500}>Development Prioritization</Text>
              <Text>
                Based on your current progress, focusing on completing the Core Platform (85% complete) before expanding SmartThings integration would create a more stable foundation. Consider postponing AI Cloud tasks until core functionality is stable.
              </Text>
            </Paper>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Title order={2} mb="md">Code Quality Suggestions</Title>
            <Text color="dimmed" mb="md">
              AI-powered code quality recommendations.
            </Text>

            <Paper withBorder p="md" radius="md">
              <Text weight={500}>TypeScript Scripting Engine</Text>
              <Text>
                When implementing the database-stored scripts feature, consider using a sandboxed execution environment with resource limits to prevent potential security issues and resource exhaustion. Libraries like vm2 or isolated-vm can help create secure script execution environments.
              </Text>
            </Paper>
          </Card>
        </>
      )}
    </Container>
  );
}
