"use client";

import { useState } from 'react';
import { Title, Container, Card, Text, Button, Group, TextInput, Checkbox, Select, Badge, ActionIcon, Menu, Grid, Paper, Tabs } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconEdit, IconCheck, IconFlag, IconDotsVertical, IconFilter, IconSortAscending, IconMicrophone } from '@tabler/icons-react';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  goal?: string;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  progress: number;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Complete dashboard UI', completed: false, priority: 'high', tags: ['work', 'violt'] },
    { id: '2', title: 'Review health metrics', completed: true, priority: 'medium', tags: ['health'] },
    { id: '3', title: 'Plan weekly content', completed: false, priority: 'medium', tags: ['content'] },
    { id: '4', title: 'Research MongoDB integration', completed: false, priority: 'high', tags: ['work', 'tech'] },
  ]);

  const [goals, setGoals] = useState<Goal[]>([
    { id: '1', title: 'Violt MVP', description: 'Complete the minimum viable product for Violt', category: 'Work', progress: 65 },
    { id: '2', title: 'Fitness Goal', description: 'Exercise 4 times per week', category: 'Health', progress: 50 },
    { id: '3', title: 'Learning TypeScript', description: 'Complete advanced TypeScript course', category: 'Education', progress: 30 },
  ]);

  const [activeTab, setActiveTab] = useState<string | null>('tasks');
  const [isRecording, setIsRecording] = useState(false);

  const taskForm = useForm({
    initialValues: {
      title: '',
      priority: 'medium' as 'low' | 'medium' | 'high',
      tags: '',
      goal: '',
    },
  });

  const goalForm = useForm({
    initialValues: {
      title: '',
      description: '',
      category: '',
    },
  });

  const handleTaskSubmit = (values: typeof taskForm.values) => {
    // This will be connected to MongoDB in a later step
    const newTask: Task = {
      id: Date.now().toString(),
      title: values.title,
      completed: false,
      priority: values.priority,
      tags: values.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
      goal: values.goal || undefined,
    };

    setTasks([...tasks, newTask]);
    taskForm.reset();

    notifications.show({
      title: 'Task Added',
      message: 'Your new task has been created',
      color: 'green',
      icon: <IconCheck size="1.1rem" />,
    });
  };

  const handleGoalSubmit = (values: typeof goalForm.values) => {
    // This will be connected to MongoDB in a later step
    const newGoal: Goal = {
      id: Date.now().toString(),
      title: values.title,
      description: values.description,
      category: values.category,
      progress: 0,
    };

    setGoals([...goals, newGoal]);
    goalForm.reset();

    notifications.show({
      title: 'Goal Added',
      message: 'Your new goal has been created',
      color: 'green',
      icon: <IconCheck size="1.1rem" />,
    });
  };

  const toggleTaskCompletion = (id: string) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
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

  const deleteGoal = (id: string) => {
    setGoals(goals.filter(goal => goal.id !== id));
    notifications.show({
      title: 'Goal Deleted',
      message: 'The goal has been removed',
      color: 'red',
    });
  };

  const updateGoalProgress = (id: string, progress: number) => {
    setGoals(goals.map(goal =>
      goal.id === id ? { ...goal, progress } : goal
    ));
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
      <Title order={1} mb="md">Tasks & Goals</Title>

      <Tabs value={activeTab} onChange={setActiveTab} mb="xl">
        <Tabs.List>
          <Tabs.Tab value="tasks" leftSection={<IconCheck size="0.8rem" />}>Tasks</Tabs.Tab>
          <Tabs.Tab value="goals" leftSection={<IconFlag size="0.8rem" />}>Goals</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {activeTab === 'tasks' && (
        <>
          <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
            <Title order={2} mb="md">Add New Task</Title>
            <form onSubmit={taskForm.onSubmit(handleTaskSubmit)}>
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Task Title"
                    placeholder="What needs to be done?"
                    required
                    mb="md"
                    {...taskForm.getInputProps('title')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label="Priority"
                    placeholder="Select priority"
                    data={[
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' },
                    ]}
                    mb="md"
                    {...taskForm.getInputProps('priority')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Tags"
                    placeholder="work, project, personal"
                    mb="md"
                    {...taskForm.getInputProps('tags')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label="Related Goal (optional)"
                    placeholder="Select a goal"
                    data={goals.map(goal => ({ value: goal.id, label: goal.title }))}
                    clearable
                    mb="md"
                    {...taskForm.getInputProps('goal')}
                  />
                </Grid.Col>
              </Grid>

              <Group justify="space-between" mt="md">
                <Button
                  variant={isRecording ? "filled" : "outline"}
                  color={isRecording ? "red" : "blue"}
                  onClick={toggleVoiceRecording}
                  leftSection={<IconMicrophone size="1.1rem" />}
                >
                  {isRecording ? "Stop Recording" : "Voice Input"}
                </Button>
                <Button type="submit">Add Task</Button>
              </Group>
            </form>
          </Card>

          <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
            <Group position="apart" mb="md">
              <Title order={2}>Task List</Title>
              <Group>
                <Menu position="bottom-end">
                  <Menu.Target>
                    <ActionIcon variant="light">
                      <IconFilter size="1.1rem" />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Label>Filter by</Menu.Label>
                    <Menu.Item icon={<IconCheck size="1rem" />}>All Tasks</Menu.Item>
                    <Menu.Item icon={<IconFlag size="1rem" color="red" />}>High Priority</Menu.Item>
                    <Menu.Item icon={<IconFlag size="1rem" color="yellow" />}>Medium Priority</Menu.Item>
                    <Menu.Item icon={<IconFlag size="1rem" color="green" />}>Low Priority</Menu.Item>
                    <Menu.Divider />
                    <Menu.Label>Sort by</Menu.Label>
                    <Menu.Item icon={<IconSortAscending size="1rem" />}>Priority</Menu.Item>
                    <Menu.Item icon={<IconSortAscending size="1rem" />}>Due Date</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </Group>

            {tasks.length === 0 ? (
              <Text color="dimmed" ta="center" py="xl">
                No tasks found. Add a new task to get started!
              </Text>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <Paper withBorder>
                  {tasks.map((task) => (
                    <Group key={task.id} p="md" noWrap style={{ borderBottom: '1px solid #eee' }}>
                      <Checkbox
                        checked={task.completed}
                        onChange={() => toggleTaskCompletion(task.id)}
                        size="md"
                      />
                      <div style={{ flex: 1 }}>
                        <Text weight={500} td={task.completed ? 'line-through' : 'none'}>{task.title}</Text>
                        <Group spacing="xs" mt={4}>
                          <Badge color={getPriorityColor(task.priority)} size="sm">
                            {task.priority}
                          </Badge>
                          {task.tags.map(tag => (
                            <Badge key={tag} variant="outline" size="sm">
                              {tag}
                            </Badge>
                          ))}
                          {task.goal && (
                            <Badge color="blue" variant="light" size="sm">
                              {goals.find(g => g.id === task.goal)?.title || 'Goal'}
                            </Badge>
                          )}
                        </Group>
                      </div>
                      <Menu position="bottom-end">
                        <Menu.Target>
                          <ActionIcon>
                            <IconDotsVertical size="1rem" />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item icon={<IconEdit size="1rem" />}>Edit</Menu.Item>
                          <Menu.Item
                            color="red"
                            icon={<IconTrash size="1rem" />}
                            onClick={() => deleteTask(task.id)}
                          >
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  ))}
                </Paper>
              </div>
            )}
          </Card>
        </>
      )}

      {activeTab === 'goals' && (
        <>
          <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
            <Title order={2} mb="md">Add New Goal</Title>
            <form onSubmit={goalForm.onSubmit(handleGoalSubmit)}>
              <Grid>
                <Grid.Col span={12}>
                  <TextInput
                    label="Goal Title"
                    placeholder="What do you want to achieve?"
                    required
                    mb="md"
                    {...goalForm.getInputProps('title')}
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <Textarea
                    label="Description"
                    placeholder="Describe your goal in detail..."
                    mb="md"
                    {...goalForm.getInputProps('description')}
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <Select
                    label="Category"
                    placeholder="Select a category"
                    data={['Work', 'Health', 'Education', 'Personal', 'Finance']}
                    mb="md"
                    {...goalForm.getInputProps('category')}
                  />
                </Grid.Col>
              </Grid>
              <Button type="submit">Add Goal</Button>
            </form>
          </Card>

          <Grid>
            {goals.map((goal) => (
              <Grid.Col key={goal.id} span={12}>
                <Card shadow="sm" p="lg" radius="md" withBorder>
                  <Group position="apart" mb="xs">
                    <Title order={3}>{goal.title}</Title>
                    <Menu position="bottom-end">
                      <Menu.Target>
                        <ActionIcon>
                          <IconDotsVertical size="1rem" />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item icon={<IconEdit size="1rem" />}>Edit</Menu.Item>
                        <Menu.Item
                          color="red"
                          icon={<IconTrash size="1rem" />}
                          onClick={() => deleteGoal(goal.id)}
                        >
                          Delete
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                  <Text color="dimmed" size="sm" mb="md">
                    {goal.description}
                  </Text>
                  <div>
                    <Group position="apart" mb={4}>
                      <Text size="sm" color="dimmed">Progress</Text>
                      <Text size="sm" weight={500}>
                        {goal.progress}%
                      </Text>
                    </Group>
                    <Progress value={goal.progress} size="sm" mb="md" />
                    <Group spacing="xs">
                      {[0, 25, 50, 75, 100].map((value) => (
                        <Button
                          key={value}
                          variant={goal.progress === value ? 'filled' : 'outline'}
                          size="xs"
                          onClick={() => updateGoalProgress(goal.id, value)}
                        >
                          {value}%
                        </Button>
                      ))}
                    </Group>
                  </div>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </>
      )}
    </Container>
  );
}
