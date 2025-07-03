"use client";

import { useAuth } from '@/lib/auth-context';
import { useVoiceCommands } from '@/lib/voice';
import { Goal, Task } from '@/types/schemas';
import { ActionIcon, Badge, Button, Card, Checkbox, Container, Grid, Group, Menu, Modal, Paper, Progress, Select, Tabs, Text, Textarea, TextInput, Title, Tooltip } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconDotsVertical, IconEdit, IconFilter, IconFlag, IconMicrophone, IconSortAscending, IconTrash } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { createGoal, createTask, deleteGoal, deleteTask, editGoal, editTask, getUserGoals, getUserTasks, updateGoalProgress, updateTaskCompletion } from './actions';

export default function TasksPage() {
  const { user } = useAuth();
  // Goal categories constant for easier management
  const GOAL_CATEGORIES = [
    'Work',
    'Health',
    'Education',
    'Personal',
    'Finance',
    'Career',
    'Fitness',
    'Relationships',
    'Creativity',
    'Travel',
    'Hobbies',
    'Self-Improvement',
    'Technology',
    'Business',
    'Social',
    'Spiritual',
    'Family',
    'Community',
    'Environment',
    'Productivity'
  ];

  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>('tasks');
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskModalOpened, setEditTaskModalOpened] = useState(false);
  const [currentVoiceField, setCurrentVoiceField] = useState<string | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0);
  const [lastVoiceInput, setLastVoiceInput] = useState<string>('');

  // Filter and sort states
  const [filterType, setFilterType] = useState<'all' | 'completed' | 'incomplete' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch goals and tasks on component mount and when user changes
  useEffect(() => {
    const fetchData = async () => {
      if (user?.uid) {
        // Fetch goals
        setIsLoadingGoals(true);
        try {
          const goalsResult = await getUserGoals(user.uid);
          if (goalsResult.success && goalsResult.goals) {
            setGoals(goalsResult.goals);
          } else {
            console.error('Failed to fetch goals:', goalsResult.message);
          }
        } catch (error) {
          console.error('Error fetching goals:', error);
        } finally {
          setIsLoadingGoals(false);
        }

        // Fetch tasks
        setIsLoadingTasks(true);
        try {
          const tasksResult = await getUserTasks(user.uid);
          if (tasksResult.success && tasksResult.tasks) {
            setTasks(tasksResult.tasks);
          } else {
            console.error('Failed to fetch tasks:', tasksResult.message);
          }
        } catch (error) {
          console.error('Error fetching tasks:', error);
        } finally {
          setIsLoadingTasks(false);
        }
      }
    };

    fetchData();
  }, [user?.uid]);

  const taskForm = useForm({
    initialValues: {
      title: '',
      description: '',
      priority: 'medium' as 'low' | 'medium' | 'high',
      tags: '',
      goal: '',
      dueDate: '',
    },
    validate: {
      title: (value) => (value.trim() === '' ? 'Task title is required' : null),
      description: (value) => (value.trim() === '' ? 'Task description is required' : null),
    },
  });

  const goalForm = useForm({
    initialValues: {
      title: '',
      description: '',
      category: '',
    },
  });

  const editGoalForm = useForm({
    initialValues: {
      title: '',
      description: '',
      category: '',
    },
  });

  const editTaskForm = useForm({
    initialValues: {
      title: '',
      description: '',
      priority: 'medium' as 'low' | 'medium' | 'high',
      tags: '',
      goal: '',
      dueDate: '',
    },
    validate: {
      title: (value) => (value.trim() === '' ? 'Task title is required' : null),
      description: (value) => (value.trim() === '' ? 'Task description is required' : null),
    },
  });

  const handleTaskSubmit = async (values: typeof taskForm.values) => {
    if (!user?.uid) {
      notifications.show({
        title: 'Error',
        message: 'You must be logged in to create tasks',
        color: 'red',
      });
      return;
    }

    try {
      const taskData = {
        title: values.title,
        description: values.description,
        priority: values.priority,
        tags: values.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        goalId: values.goal || undefined,
        dueDate: values.dueDate || undefined,
      };

      const result = await createTask(user.uid, taskData);

      if (result.success && result.task) {
        setTasks([result.task, ...tasks]);
        taskForm.reset();

        notifications.show({
          title: 'Task Added',
          message: 'Your new task has been created',
          color: 'green',
          icon: <IconCheck size="1.1rem" />,
        });
      } else {
        notifications.show({
          title: 'Error',
          message: result.message || 'Failed to create task',
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Error creating task:', error);
      notifications.show({
        title: 'Error',
        message: 'An unexpected error occurred',
        color: 'red',
      });
    }
  };

  const handleGoalSubmit = async (values: typeof goalForm.values) => {
    if (!user?.uid) {
      notifications.show({
        title: 'Error',
        message: 'You must be logged in to create goals',
        color: 'red',
      });
      return;
    }

    try {
      const result = await createGoal(user.uid, values);

      if (result.success && result.goal) {
        setGoals([result.goal, ...goals]);
        goalForm.reset();

        notifications.show({
          title: 'Goal Added',
          message: 'Your new goal has been created',
          color: 'green',
          icon: <IconCheck size="1.1rem" />,
        });
      } else {
        notifications.show({
          title: 'Error',
          message: result.message || 'Failed to create goal',
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      notifications.show({
        title: 'Error',
        message: 'An unexpected error occurred',
        color: 'red',
      });
    }
  };

  const handleEditGoalSubmit = async (values: typeof editGoalForm.values) => {
    if (!user?.uid || !editingGoal) {
      notifications.show({
        title: 'Error',
        message: 'You must be logged in and have a goal selected to edit',
        color: 'red',
      });
      return;
    }

    try {
      const result = await editGoal(user.uid, editingGoal.id, values);

      if (result.success && result.goal) {
        setGoals(goals.map(goal =>
          goal.id === editingGoal.id ? result.goal! : goal
        ));
        setEditModalOpened(false);
        setEditingGoal(null);
        editGoalForm.reset();

        notifications.show({
          title: 'Goal Updated',
          message: 'Your goal has been successfully updated',
          color: 'green',
          icon: <IconCheck size="1.1rem" />,
        });
      } else {
        notifications.show({
          title: 'Error',
          message: result.message || 'Failed to update goal',
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Error updating goal:', error);
      notifications.show({
        title: 'Error',
        message: 'An unexpected error occurred',
        color: 'red',
      });
    }
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    editGoalForm.setValues({
      title: goal.title,
      description: goal.description || '',
      category: goal.category || '',
    });
    setEditModalOpened(true);
  };

  const handleEditTaskSubmit = async (values: typeof editTaskForm.values) => {
    if (!user?.uid || !editingTask) {
      notifications.show({
        title: 'Error',
        message: 'You must be logged in and have a task selected to edit',
        color: 'red',
      });
      return;
    }

    try {
      const taskData = {
        title: values.title,
        description: values.description,
        priority: values.priority,
        tags: values.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        goalId: values.goal || undefined,
        dueDate: values.dueDate || undefined,
      };

      const result = await editTask(user.uid, editingTask.id, taskData);

      if (result.success && result.task) {
        setTasks(tasks.map(task =>
          task.id === editingTask.id ? result.task! : task
        ));
        setEditTaskModalOpened(false);
        setEditingTask(null);
        editTaskForm.reset();

        notifications.show({
          title: 'Task Updated',
          message: 'Your task has been successfully updated',
          color: 'green',
          icon: <IconCheck size="1.1rem" />,
        });
      } else {
        notifications.show({
          title: 'Error',
          message: result.message || 'Failed to update task',
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Error updating task:', error);
      notifications.show({
        title: 'Error',
        message: 'An unexpected error occurred',
        color: 'red',
      });
    }
  };

  const openEditTaskModal = (task: Task) => {
    setEditingTask(task);
    editTaskForm.setValues({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      tags: task.tags.join(', '),
      goal: task.goalId || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    });
    setEditTaskModalOpened(true);
  };

  const toggleTaskCompletion = async (id: string) => {
    if (!user?.uid) {
      notifications.show({
        title: 'Error',
        message: 'You must be logged in to update tasks',
        color: 'red',
      });
      return;
    }

    const task = tasks.find(t => t.id === id);
    if (!task) return;

    try {
      const result = await updateTaskCompletion(user.uid, id, !task.completed);

      if (result.success) {
        setTasks(tasks.map(task =>
          task.id === id ? { ...task, completed: !task.completed } : task
        ));
      } else {
        notifications.show({
          title: 'Error',
          message: result.message || 'Failed to update task',
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Error updating task:', error);
      notifications.show({
        title: 'Error',
        message: 'An unexpected error occurred',
        color: 'red',
      });
    }
  };

  const deleteTaskHandler = async (id: string) => {
    if (!user?.uid) {
      notifications.show({
        title: 'Error',
        message: 'You must be logged in to delete tasks',
        color: 'red',
      });
      return;
    }

    try {
      const result = await deleteTask(user.uid, id);

      if (result.success) {
        setTasks(tasks.filter(task => task.id !== id));
        notifications.show({
          title: 'Task Deleted',
          message: 'The task has been removed',
          color: 'red',
        });
      } else {
        notifications.show({
          title: 'Error',
          message: result.message || 'Failed to delete task',
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      notifications.show({
        title: 'Error',
        message: 'An unexpected error occurred',
        color: 'red',
      });
    }
  };

  const deleteGoalHandler = async (id: string) => {
    if (!user?.uid) {
      notifications.show({
        title: 'Error',
        message: 'You must be logged in to delete goals',
        color: 'red',
      });
      return;
    }

    try {
      const result = await deleteGoal(user.uid, id);

      if (result.success) {
        setGoals(goals.filter(goal => goal.id !== id));
        notifications.show({
          title: 'Goal Deleted',
          message: 'The goal has been removed',
          color: 'red',
        });
      } else {
        notifications.show({
          title: 'Error',
          message: result.message || 'Failed to delete goal',
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      notifications.show({
        title: 'Error',
        message: 'An unexpected error occurred',
        color: 'red',
      });
    }
  };

  const updateGoalProgressHandler = async (id: string, progress: number) => {
    if (!user?.uid) {
      notifications.show({
        title: 'Error',
        message: 'You must be logged in to update goals',
        color: 'red',
      });
      return;
    }

    try {
      const result = await updateGoalProgress(user.uid, id, progress);

      if (result.success) {
        setGoals(goals.map(goal =>
          goal.id === id ? { ...goal, progress } : goal
        ));
        notifications.show({
          title: 'Progress Updated',
          message: `Goal progress updated to ${progress}%`,
          color: 'green',
        });
      } else {
        notifications.show({
          title: 'Error',
          message: result.message || 'Failed to update progress',
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Error updating goal progress:', error);
      notifications.show({
        title: 'Error',
        message: 'An unexpected error occurred',
        color: 'red',
      });
    }
  };

  const toggleVoiceRecording = () => {
    toggleVoiceMode();
  };

  // Filter and sort functions
  const getFilteredAndSortedTasks = (includeCompleted = true) => {
    let filteredTasks = [...tasks];

    // First filter out completed tasks if includeCompleted is false
    if (!includeCompleted) {
      filteredTasks = filteredTasks.filter(task => !task.completed);
    } else {
      // Apply other filters only if we're including completed tasks
      switch (filterType) {
        case 'completed':
          filteredTasks = filteredTasks.filter(task => task.completed);
          break;
        case 'incomplete':
          filteredTasks = filteredTasks.filter(task => !task.completed);
          break;
        case 'high':
          filteredTasks = filteredTasks.filter(task => task.priority === 'high');
          break;
        case 'medium':
          filteredTasks = filteredTasks.filter(task => task.priority === 'medium');
          break;
        case 'low':
          filteredTasks = filteredTasks.filter(task => task.priority === 'low');
          break;
        case 'all':
        default:
          // No filter, show all tasks
          break;
      }
    }

    // Apply sorting
    filteredTasks.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'priority':
          const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'date':
        default:
          // Use due date if available, otherwise fall back to created date
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : new Date(a.createdAt).getTime();
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : new Date(b.createdAt).getTime();
          comparison = bDate - aDate;
          break;
      }

      return sortOrder === 'asc' ? -comparison : comparison;
    });

    return filteredTasks;
  };

  // Get active (incomplete) tasks
  const getActiveTasks = () => {
    return getFilteredAndSortedTasks(false);
  };

  // Get completed tasks
  const getCompletedTasks = () => {
    return tasks.filter(task => task.completed).sort((a, b) => {
      // Sort completed tasks by completion date (most recent first)
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  };

  const handleFilterChange = (newFilter: typeof filterType) => {
    setFilterType(newFilter);
  };

  const handleSortChange = (newSort: typeof sortBy) => {
    setSortBy(newSort);
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const getFilterDisplayName = () => {
    switch (filterType) {
      case 'high': return 'High Priority';
      case 'medium': return 'Medium Priority';
      case 'low': return 'Low Priority';
      case 'all':
      default: return 'All Active Tasks';
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

  // Helper function to prevent notification spam
  const showNotificationThrottled = (notification: any, minInterval: number = 2000) => {
    const now = Date.now();
    if (now - lastNotificationTime > minInterval) {
      notifications.show(notification);
      setLastNotificationTime(now);
    }
  };

  // Voice command handlers for Task Form
  const taskVoiceCommands = {
    'next': () => {
      if (currentVoiceField) {
        navigateToNextField(currentVoiceField, true);
      }
      // Auto-restart listening
      if (isVoiceMode) {
        setTimeout(() => startListening(), 500);
      }
    },
    'previous': () => {
      const fieldOrder = ['title', 'priority', 'description', 'tags', 'goal'];
      const currentIndex = currentVoiceField ? fieldOrder.indexOf(currentVoiceField) : 0;
      const prevField = fieldOrder[currentIndex - 1] || null;
      setCurrentVoiceField(prevField);

      const fieldNames = {
        'title': 'Task Title',
        'priority': 'Priority Level',
        'description': 'Task Description',
        'tags': 'Tags',
        'goal': 'Related Goal'
      };

      if (prevField) {
        showNotificationThrottled({
          title: 'Voice Navigation',
          message: `Moved to ${fieldNames[prevField as keyof typeof fieldNames]}.`,
          color: 'blue',
        }, 1000);
      }
      // Auto-restart listening
      if (isVoiceMode) {
        setTimeout(() => startListening(), 500);
      }
    },
    'clear field': () => {
      if (currentVoiceField) {
        taskForm.setFieldValue(currentVoiceField, '');
        showNotificationThrottled({
          title: 'Voice Input',
          message: 'Field cleared.',
          color: 'orange',
        }, 1000);
      }
      // Auto-restart listening
      if (isVoiceMode) {
        setTimeout(() => startListening(), 500);
      }
    },
    'save task': () => {
      taskForm.onSubmit(handleTaskSubmit)();
      setIsVoiceMode(false);
      setCurrentVoiceField(null);
      notifications.show({
        title: 'Voice Mode',
        message: 'Task submitted.',
        color: 'green',
      });
    },
    'stop voice': () => {
      setIsVoiceMode(false);
      setCurrentVoiceField(null);
      taskForm.reset();
      notifications.show({
        title: 'Voice Mode',
        message: 'Voice input stopped and form cleared.',
        color: 'gray',
      });
    },
    'high priority': () => {
      taskForm.setFieldValue('priority', 'high');
      navigateToNextField('priority', false);
      showNotificationThrottled({
        title: 'Voice Input',
        message: 'Priority set to High.',
        color: 'green',
      });
      // Auto-restart listening
      if (isVoiceMode) {
        setTimeout(() => startListening(), 500);
      }
    },
    'medium priority': () => {
      taskForm.setFieldValue('priority', 'medium');
      navigateToNextField('priority', false);
      showNotificationThrottled({
        title: 'Voice Input',
        message: 'Priority set to Medium.',
        color: 'green',
      });
      // Auto-restart listening
      if (isVoiceMode) {
        setTimeout(() => startListening(), 500);
      }
    },
    'low priority': () => {
      taskForm.setFieldValue('priority', 'low');
      navigateToNextField('priority', false);
      showNotificationThrottled({
        title: 'Voice Input',
        message: 'Priority set to Low.',
        color: 'green',
      });
      // Auto-restart listening
      if (isVoiceMode) {
        setTimeout(() => startListening(), 500);
      }
    },
    'title {text}': (text?: string) => {
      if (text) {
        const formattedText = formatTextForField(text, 'title', taskForm.values.title);
        taskForm.setFieldValue('title', formattedText);
        navigateToNextField('title', true);
        showNotificationThrottled({
          title: 'Voice Input',
          message: 'Task title set.',
          color: 'green',
        });
      }
      // Auto-restart listening
      if (isVoiceMode) {
        setTimeout(() => startListening(), 500);
      }
    },
    'description {text}': (text?: string) => {
      if (text) {
        const formattedText = formatTextForField(text, 'description', taskForm.values.description);
        taskForm.setFieldValue('description', formattedText);
        showNotificationThrottled({
          title: 'Voice Input',
          message: 'Description added.',
          color: 'green',
        });
      }
      // Auto-restart listening
      if (isVoiceMode) {
        setTimeout(() => startListening(), 500);
      }
    },
    'tags {text}': (text?: string) => {
      if (text) {
        const currentTags = taskForm.values.tags.trim();
        const newTags = currentTags ? `${currentTags}, ${text}` : text;
        taskForm.setFieldValue('tags', newTags);
        setCurrentVoiceField('goal');
        showNotificationThrottled({
          title: 'Voice Input',
          message: 'Tags added.',
          color: 'green',
        });
      }
      // Auto-restart listening
      if (isVoiceMode) {
        setTimeout(() => startListening(), 500);
      }
    },
    'add tag {text}': (text?: string) => {
      if (text) {
        const currentTags = taskForm.values.tags.trim();
        const newTags = currentTags ? `${currentTags}, ${text}` : text;
        taskForm.setFieldValue('tags', newTags);
        showNotificationThrottled({
          title: 'Voice Input',
          message: `Tag "${text}" added.`,
          color: 'green',
        });
      }
      // Auto-restart listening
      if (isVoiceMode) {
        setTimeout(() => startListening(), 500);
      }
    },
    'full stop': () => {
      if (currentVoiceField && (currentVoiceField === 'title' || currentVoiceField === 'description')) {
        const currentValue = taskForm.values[currentVoiceField];
        taskForm.setFieldValue(currentVoiceField, currentValue + '.');
        showNotificationThrottled({
          title: 'Voice Input',
          message: 'Period added.',
          color: 'green',
        });
      }
      // Auto-restart listening
      if (isVoiceMode) {
        setTimeout(() => startListening(), 500);
      }
    },
    'comma': () => {
      if (currentVoiceField && (currentVoiceField === 'title' || currentVoiceField === 'description')) {
        const currentValue = taskForm.values[currentVoiceField];
        taskForm.setFieldValue(currentVoiceField, currentValue + ',');
        showNotificationThrottled({
          title: 'Voice Input',
          message: 'Comma added.',
          color: 'green',
        });
      }
      // Auto-restart listening
      if (isVoiceMode) {
        setTimeout(() => startListening(), 500);
      }
    },
    'question mark': () => {
      if (currentVoiceField && (currentVoiceField === 'title' || currentVoiceField === 'description')) {
        const currentValue = taskForm.values[currentVoiceField];
        taskForm.setFieldValue(currentVoiceField, currentValue + '?');
        showNotificationThrottled({
          title: 'Voice Input',
          message: 'Question mark added.',
          color: 'green',
        });
      }
      // Auto-restart listening
      if (isVoiceMode) {
        setTimeout(() => startListening(), 500);
      }
    },
    'exclamation mark': () => {
      if (currentVoiceField && (currentVoiceField === 'title' || currentVoiceField === 'description')) {
        const currentValue = taskForm.values[currentVoiceField];
        taskForm.setFieldValue(currentVoiceField, currentValue + '!');
        showNotificationThrottled({
          title: 'Voice Input',
          message: 'Exclamation mark added.',
          color: 'green',
        });
      }
      // Auto-restart listening
      if (isVoiceMode) {
        setTimeout(() => startListening(), 500);
      }
    },
    '{text}': (text?: string) => {
      // Direct input to current field - only process if not a command
      if (text && currentVoiceField && text.length > 2) {
        const lowerText = text.toLowerCase().trim();

        // Filter out common voice recognition artifacts and commands
        const commonArtifacts = ['comm', 'commit', 'this', 'is', 'a', 'test', 'the', 'and', 'or', 'but'];
        const isArtifact = commonArtifacts.some(artifact => lowerText === artifact || lowerText.includes(artifact + ' ' + artifact));

        // Ignore if it's a navigation command that might have been misheard or an artifact
        if (!['next', 'previous', 'clear field', 'save task', 'stop voice', 'high priority', 'medium priority', 'low priority', 'add tag', 'full stop', 'comma', 'question mark', 'exclamation mark'].some(cmd => lowerText.startsWith(cmd)) && !isArtifact) {

          // Format text based on field type
          let formattedText = text;

          if (currentVoiceField === 'title' || currentVoiceField === 'description') {
            // Capitalize first letter and handle punctuation
            formattedText = formatTextForField(text, currentVoiceField, taskForm.values[currentVoiceField]);
          } else if (currentVoiceField === 'tags') {
            // For tags field, append to existing tags
            const currentTags = taskForm.values.tags.trim();
            formattedText = currentTags ? `${currentTags}, ${text}` : text;
          }

          taskForm.setFieldValue(currentVoiceField, formattedText);
          setLastVoiceInput(text);

          showNotificationThrottled({
            title: 'Voice Input',
            message: `Added "${text}" to ${currentVoiceField}.`,
            color: 'green',
          });
        }
      }
      // Auto-restart listening
      if (isVoiceMode) {
        setTimeout(() => startListening(), 500);
      }
    }
  };

  // Initialize voice commands
  const { isListening, startListening, stopListening } = useVoiceCommands(taskVoiceCommands);

  // Handle voice mode toggle
  const toggleVoiceMode = () => {
    if (isVoiceMode) {
      setIsVoiceMode(false);
      setCurrentVoiceField(null);
      setLastVoiceInput('');
      stopListening();
      taskForm.reset();
      notifications.show({
        title: 'Voice Mode Stopped',
        message: 'Voice input has been disabled and form cleared.',
        color: 'gray',
      });
    } else {
      setIsVoiceMode(true);
      setCurrentVoiceField('title');
      setLastVoiceInput('');
      startListening();
      notifications.show({
        title: 'Voice Mode Started',
        message: 'Speak naturally to fill fields or use voice commands.',
        color: 'blue',
      });
    }
  };

  // Helper function to format text for different fields
  const formatTextForField = (newText: string, fieldType: string, existingText: string) => {
    let formatted = newText.trim();

    // Handle special punctuation commands
    if (formatted.toLowerCase() === 'full stop' || formatted.toLowerCase() === 'period') {
      return existingText + '.';
    }

    if (formatted.toLowerCase() === 'comma') {
      return existingText + ',';
    }

    if (formatted.toLowerCase() === 'question mark') {
      return existingText + '?';
    }

    if (formatted.toLowerCase() === 'exclamation mark' || formatted.toLowerCase() === 'exclamation point') {
      return existingText + '!';
    }

    // For regular text
    if (fieldType === 'title') {
      // Capitalize first letter of title
      formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();

      // If existing text exists, add a space
      if (existingText.trim()) {
        return existingText + ' ' + formatted;
      }
      return formatted;
    }

    if (fieldType === 'description') {
      // For descriptions, handle sentence capitalization
      if (!existingText.trim()) {
        // First sentence - capitalize first letter
        formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
      } else {
        // Check if previous text ends with sentence-ending punctuation
        const lastChar = existingText.trim().slice(-1);
        if (['.', '!', '?'].includes(lastChar)) {
          // Start new sentence - capitalize first letter
          formatted = ' ' + formatted.charAt(0).toUpperCase() + formatted.slice(1);
        } else {
          // Continue existing sentence - add space and keep original case
          formatted = ' ' + formatted;
        }
      }
      return existingText + formatted;
    }

    // For other fields, return as-is with existing text
    if (existingText.trim()) {
      return existingText + ' ' + formatted;
    }
    return formatted;
  };

  // Helper function to handle field navigation with auto-punctuation
  const navigateToNextField = (currentField: string, autoAddPunctuation: boolean = true) => {
    const fieldOrder = ['title', 'description', 'priority', 'tags', 'goal'];
    const currentIndex = fieldOrder.indexOf(currentField);
    const nextField = fieldOrder[currentIndex + 1] || null;

    // Add punctuation when leaving certain fields
    if (autoAddPunctuation && (currentField === 'title' || currentField === 'description')) {
      const currentValue = taskForm.values[currentField as keyof typeof taskForm.values];
      if (typeof currentValue === 'string' && currentValue.trim()) {
        const lastChar = currentValue.trim().slice(-1);
        if (!['.', '!', '?'].includes(lastChar)) {
          taskForm.setFieldValue(currentField, currentValue + '.');
        }
      }
    }

    setCurrentVoiceField(nextField);

    const fieldNames = {
      'title': 'Task Title',
      'description': 'Task Description',
      'priority': 'Priority Level',
      'tags': 'Tags',
      'goal': 'Related Goal'
    };

    if (nextField) {
      showNotificationThrottled({
        title: 'Voice Navigation',
        message: `Moved to ${fieldNames[nextField as keyof typeof fieldNames]}.`,
        color: 'blue',
      }, 1000);
    }
  };

  return (
    <Container size="lg">
      <Title order={1} mb="md">Tasks & Goals</Title>

      {!user && (
        <Text color="dimmed" ta="center" py="xl">
          Please log in to access your tasks and goals.
        </Text>
      )}

      {user && (
        <>
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
                        style={{
                          border: currentVoiceField === 'title' ? '2px solid #1c7ed6' : undefined,
                          borderRadius: currentVoiceField === 'title' ? '4px' : undefined,
                        }}
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
                        style={{
                          border: currentVoiceField === 'priority' ? '2px solid #1c7ed6' : undefined,
                          borderRadius: currentVoiceField === 'priority' ? '4px' : undefined,
                        }}
                      />
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <Textarea
                        label="Description"
                        placeholder="Describe the task in detail..."
                        required
                        autosize
                        minRows={2}
                        maxRows={4}
                        mb="md"
                        {...taskForm.getInputProps('description')}
                        style={{
                          border: currentVoiceField === 'description' ? '2px solid #1c7ed6' : undefined,
                          borderRadius: currentVoiceField === 'description' ? '4px' : undefined,
                        }}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <TextInput
                        label="Tags"
                        placeholder="work, project, personal"
                        mb="md"
                        {...taskForm.getInputProps('tags')}
                        style={{
                          border: currentVoiceField === 'tags' ? '2px solid #1c7ed6' : undefined,
                          borderRadius: currentVoiceField === 'tags' ? '4px' : undefined,
                        }}
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
                        style={{
                          border: currentVoiceField === 'goal' ? '2px solid #1c7ed6' : undefined,
                          borderRadius: currentVoiceField === 'goal' ? '4px' : undefined,
                        }}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <DateInput
                        label="Due Date (optional)"
                        placeholder="Select due date"
                        clearable
                        mb="md"
                        valueFormat="YYYY-MM-DD"
                        {...taskForm.getInputProps('dueDate')}
                        style={{
                          border: currentVoiceField === 'dueDate' ? '2px solid #1c7ed6' : undefined,
                          borderRadius: currentVoiceField === 'dueDate' ? '4px' : undefined,
                        }}
                      />
                    </Grid.Col>
                  </Grid>

                  <Group justify="space-between" mt="md">
                    <Tooltip
                      label={
                        <div>
                          <Text size="sm" fw={500} mb={4}>Voice Commands:</Text>
                          <Text size="xs">• "title [text]" - Set task title</Text>
                          <Text size="xs">• "description [text]" - Set description</Text>
                          <Text size="xs">• "high/medium/low priority" - Set priority</Text>
                          <Text size="xs">• "tags [text]" - Add tags (appends to existing)</Text>
                          <Text size="xs">• "add tag [text]" - Add single tag</Text>
                          <Text size="xs">• "next/previous" - Navigate fields</Text>
                          <Text size="xs">• "clear field" - Clear current field</Text>
                          <Text size="xs">• "save task" - Submit form</Text>
                          <Text size="xs">• "stop voice" - Exit voice mode</Text>
                          <Text size="xs" mt={2} fw={500}>Punctuation:</Text>
                          <Text size="xs">• "full stop" - Add period (.)</Text>
                          <Text size="xs">• "comma" - Add comma (,)</Text>
                          <Text size="xs">• "question mark" - Add (?)</Text>
                          <Text size="xs">• "exclamation mark" - Add (!)</Text>
                          <Text size="xs" mt={4}>Or speak naturally while a field is highlighted</Text>
                          <Text size="xs" c="orange" mt={2}>Auto-capitalization and punctuation enabled</Text>
                          {currentVoiceField && (
                            <Text size="xs" c="blue" mt={4}>
                              Current field: {currentVoiceField}
                            </Text>
                          )}
                        </div>
                      }
                      multiline
                      w={300}
                      position="top"
                    >
                      <ActionIcon
                        variant={isVoiceMode ? "filled" : "outline"}
                        color={isVoiceMode ? (isListening ? "red" : "blue") : "blue"}
                        onClick={toggleVoiceRecording}
                        size="lg"
                        radius="xl"
                        title={isVoiceMode ? (isListening ? "Listening..." : "Voice Mode Active") : "Start Voice Input"}
                      >
                        <IconMicrophone size="1.2rem" />
                      </ActionIcon>
                    </Tooltip>
                    <Button type="submit">Add Task</Button>
                  </Group>
                </form>
              </Card>

              {/* Active Tasks Section */}
              <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
                <Group justify="space-between" mb="md">
                  <Title order={2}>
                    Active Tasks - {getFilterDisplayName()}
                    <Text component="span" size="sm" c="dimmed" ml={8}>
                      ({getActiveTasks().length} {getActiveTasks().length === 1 ? 'task' : 'tasks'})
                    </Text>
                  </Title>
                  <Group>
                    <Menu position="bottom-end">
                      <Menu.Target>
                        <ActionIcon
                          variant={filterType !== 'all' || sortBy !== 'date' || sortOrder !== 'desc' ? "filled" : "light"}
                          color={filterType !== 'all' || sortBy !== 'date' || sortOrder !== 'desc' ? "blue" : undefined}
                        >
                          <IconFilter size="1.1rem" />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Label>Filter by</Menu.Label>
                        <Menu.Item
                          onClick={() => handleFilterChange('all')}
                          style={{ backgroundColor: filterType === 'all' ? 'var(--mantine-color-blue-1)' : undefined }}
                        >
                          <Group gap={8}>
                            <IconCheck size="1rem" />
                            All Active Tasks {filterType === 'all' && '✓'}
                          </Group>
                        </Menu.Item>
                        <Menu.Item
                          onClick={() => handleFilterChange('high')}
                          style={{ backgroundColor: filterType === 'high' ? 'var(--mantine-color-blue-1)' : undefined }}
                        >
                          <Group gap={8}>
                            <IconFlag size="1rem" color="red" />
                            High Priority {filterType === 'high' && '✓'}
                          </Group>
                        </Menu.Item>
                        <Menu.Item
                          onClick={() => handleFilterChange('medium')}
                          style={{ backgroundColor: filterType === 'medium' ? 'var(--mantine-color-blue-1)' : undefined }}
                        >
                          <Group gap={8}>
                            <IconFlag size="1rem" color="yellow" />
                            Medium Priority {filterType === 'medium' && '✓'}
                          </Group>
                        </Menu.Item>
                        <Menu.Item
                          onClick={() => handleFilterChange('low')}
                          style={{ backgroundColor: filterType === 'low' ? 'var(--mantine-color-blue-1)' : undefined }}
                        >
                          <Group gap={8}>
                            <IconFlag size="1rem" color="green" />
                            Low Priority {filterType === 'low' && '✓'}
                          </Group>
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Label>Sort by</Menu.Label>
                        <Menu.Item
                          onClick={() => handleSortChange('priority')}
                          style={{ backgroundColor: sortBy === 'priority' ? 'var(--mantine-color-blue-1)' : undefined }}
                        >
                          <Group gap={8}>
                            <IconSortAscending size="1rem" />
                            Priority {sortBy === 'priority' && '✓'}
                          </Group>
                        </Menu.Item>
                        <Menu.Item
                          onClick={() => handleSortChange('date')}
                          style={{ backgroundColor: sortBy === 'date' ? 'var(--mantine-color-blue-1)' : undefined }}
                        >
                          <Group gap={8}>
                            <IconSortAscending size="1rem" />
                            Due Date {sortBy === 'date' && '✓'}
                          </Group>
                        </Menu.Item>
                        <Menu.Item
                          onClick={() => handleSortChange('title')}
                          style={{ backgroundColor: sortBy === 'title' ? 'var(--mantine-color-blue-1)' : undefined }}
                        >
                          <Group gap={8}>
                            <IconSortAscending size="1rem" />
                            Title {sortBy === 'title' && '✓'}
                          </Group>
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item onClick={toggleSortOrder}>
                          <Group gap={8}>
                            <IconSortAscending size="1rem" />
                            {sortOrder === 'asc' ? 'Sort Descending' : 'Sort Ascending'}
                          </Group>
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item
                          onClick={() => {
                            setFilterType('all');
                            setSortBy('date');
                            setSortOrder('desc');
                          }}
                          c="gray"
                        >
                          <Group gap={8}>
                            <IconFilter size="1rem" />
                            Clear All Filters
                          </Group>
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                </Group>

                {isLoadingTasks ? (
                  <Text color="dimmed" ta="center" py="xl">
                    Loading tasks...
                  </Text>
                ) : getActiveTasks().length === 0 ? (
                  <Text color="dimmed" ta="center" py="xl">
                    No active tasks found. Add a new task to get started!
                  </Text>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <Paper withBorder>
                      {getActiveTasks().map((task) => (
                        <Group key={task.id} p="md" style={{ borderBottom: '1px solid #eee' }}>
                          <Checkbox
                            checked={task.completed}
                            onChange={() => toggleTaskCompletion(task.id)}
                            size="md"
                          />
                          <div style={{ flex: 1 }}>
                            <Text w={500} td={task.completed ? 'line-through' : 'none'}>{task.title}</Text>
                            {task.description && (
                              <Text size="sm" c="dimmed" mt={2}>
                                {task.description}
                              </Text>
                            )}
                            <Group gap="xs" mt={4}>
                              <Badge color={getPriorityColor(task.priority)} size="sm">
                                {task.priority}
                              </Badge>
                              {task.tags.map(tag => (
                                <Badge key={tag} variant="outline" size="sm">
                                  {tag}
                                </Badge>
                              ))}
                              {task.goalId && (
                                <Badge color="blue" variant="light" size="sm">
                                  {goals.find(g => g.id === task.goalId)?.title || 'Goal'}
                                </Badge>
                              )}
                              {task.dueDate && (
                                <Badge color="orange" variant="light" size="sm">
                                  Due: {new Date(task.dueDate).toLocaleDateString()}
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
                              <Menu.Item onClick={() => openEditTaskModal(task)}>
                                <Group gap={8}>
                                  <IconEdit size="1rem" />
                                  Edit
                                </Group>
                              </Menu.Item>
                              <Menu.Item
                                color="red"
                                onClick={() => deleteTaskHandler(task.id)}
                              >
                                <Group gap={8}>
                                  <IconTrash size="1rem" />
                                  Delete
                                </Group>
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Group>
                      ))}
                    </Paper>
                  </div>
                )}
              </Card>

              {/* Completed Tasks Section */}
              <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
                <Group justify="space-between" mb="md">
                  <Title order={2}>
                    Completed Tasks
                    <Text component="span" size="sm" c="dimmed" ml={8}>
                      ({getCompletedTasks().length} {getCompletedTasks().length === 1 ? 'task' : 'tasks'})
                    </Text>
                  </Title>
                </Group>

                {isLoadingTasks ? (
                  <Text color="dimmed" ta="center" py="xl">
                    Loading completed tasks...
                  </Text>
                ) : getCompletedTasks().length === 0 ? (
                  <Text color="dimmed" ta="center" py="xl">
                    No completed tasks yet. Complete some tasks to see them here!
                  </Text>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <Paper withBorder>
                      {getCompletedTasks().map((task) => (
                        <Group key={task.id} p="md" style={{ borderBottom: '1px solid #eee', opacity: 0.7 }}>
                          <Checkbox
                            checked={task.completed}
                            onChange={() => toggleTaskCompletion(task.id)}
                            size="md"
                          />
                          <div style={{ flex: 1 }}>
                            <Text w={500} td="line-through" c="dimmed">{task.title}</Text>
                            {task.description && (
                              <Text size="sm" c="dimmed" mt={2}>
                                {task.description}
                              </Text>
                            )}
                            <Group gap="xs" mt={4}>
                              <Badge color="green" variant="light" size="sm">
                                Completed
                              </Badge>
                              <Badge color={getPriorityColor(task.priority)} variant="outline" size="sm">
                                {task.priority}
                              </Badge>
                              {task.tags.map(tag => (
                                <Badge key={tag} variant="outline" size="sm" c="dimmed">
                                  {tag}
                                </Badge>
                              ))}
                              {task.goalId && (
                                <Badge color="blue" variant="outline" size="sm" c="dimmed">
                                  {goals.find(g => g.id === task.goalId)?.title || 'Goal'}
                                </Badge>
                              )}
                              {task.dueDate && (
                                <Badge color="gray" variant="outline" size="sm">
                                  Due: {new Date(task.dueDate).toLocaleDateString()}
                                </Badge>
                              )}
                              <Badge color="gray" variant="outline" size="sm">
                                Completed: {new Date(task.updatedAt).toLocaleDateString()}
                              </Badge>
                            </Group>
                          </div>
                          <Menu position="bottom-end">
                            <Menu.Target>
                              <ActionIcon>
                                <IconDotsVertical size="1rem" />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item onClick={() => openEditTaskModal(task)}>
                                <Group gap={8}>
                                  <IconEdit size="1rem" />
                                  Edit
                                </Group>
                              </Menu.Item>
                              <Menu.Item
                                color="red"
                                onClick={() => deleteTaskHandler(task.id)}
                              >
                                <Group gap={8}>
                                  <IconTrash size="1rem" />
                                  Delete
                                </Group>
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
                        data={GOAL_CATEGORIES}
                        mb="md"
                        {...goalForm.getInputProps('category')}
                      />
                    </Grid.Col>
                  </Grid>
                  <Button type="submit">Add Goal</Button>
                </form>
              </Card>

              <Grid>
                {isLoadingGoals ? (
                  <Grid.Col span={12}>
                    <Text ta="center" py="xl" color="dimmed">
                      Loading goals...
                    </Text>
                  </Grid.Col>
                ) : goals.length === 0 ? (
                  <Grid.Col span={12}>
                    <Text ta="center" py="xl" color="dimmed">
                      No goals found. Create your first goal above!
                    </Text>
                  </Grid.Col>
                ) : (
                  goals.map((goal) => (
                    <Grid.Col key={goal.id} span={12}>
                      <Card shadow="sm" p="lg" radius="md" withBorder>
                        <Group justify="space-between" mb="xs">
                          <Title order={3}>{goal.title}</Title>
                          <Menu position="bottom-end">
                            <Menu.Target>
                              <ActionIcon>
                                <IconDotsVertical size="1rem" />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item onClick={() => openEditModal(goal)}>
                                <Group gap={8}>
                                  <IconEdit size="1rem" />
                                  Edit
                                </Group>
                              </Menu.Item>
                              <Menu.Item
                                color="red"
                                onClick={() => deleteGoalHandler(goal.id)}
                              >
                                <Group gap={8}>
                                  <IconTrash size="1rem" />
                                  Delete
                                </Group>
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Group>
                        <Text color="dimmed" size="sm" mb="md">
                          {goal.description}
                        </Text>
                        <div>
                          <Group justify="space-between" mb={4}>
                            <Text size="sm" c="dimmed">Progress</Text>
                            <Text size="sm" w={500}>
                              {goal.progress}%
                            </Text>
                          </Group>
                          <Progress value={goal.progress} size="sm" mb="md" />
                          <Group gap="xs">
                            {[0, 25, 50, 75, 100].map((value) => (
                              <Button
                                key={value}
                                variant={goal.progress === value ? 'filled' : 'outline'}
                                size="xs"
                                onClick={() => updateGoalProgressHandler(goal.id, value)}
                              >
                                {value}%
                              </Button>
                            ))}
                          </Group>
                        </div>
                      </Card>
                    </Grid.Col>
                  ))
                )}
              </Grid>
            </>
          )}
        </>
      )}

      {/* Edit Goal Modal */}
      <Modal
        opened={editModalOpened}
        onClose={() => {
          setEditModalOpened(false);
          setEditingGoal(null);
          editGoalForm.reset();
        }}
        title="Edit Goal"
        size="md"
      >
        <form onSubmit={editGoalForm.onSubmit(handleEditGoalSubmit)}>
          <Grid>
            <Grid.Col span={12}>
              <TextInput
                label="Goal Title"
                placeholder="What do you want to achieve?"
                required
                mb="md"
                {...editGoalForm.getInputProps('title')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea
                label="Description"
                placeholder="Describe your goal in detail..."
                mb="md"
                {...editGoalForm.getInputProps('description')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Select
                label="Category"
                placeholder="Select a category"
                data={GOAL_CATEGORIES}
                mb="md"
                {...editGoalForm.getInputProps('category')}
              />
            </Grid.Col>
          </Grid>
          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              onClick={() => {
                setEditModalOpened(false);
                setEditingGoal(null);
                editGoalForm.reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Update Goal</Button>
          </Group>
        </form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        opened={editTaskModalOpened}
        onClose={() => {
          setEditTaskModalOpened(false);
          setEditingTask(null);
          editTaskForm.reset();
        }}
        title="Edit Task"
        size="md"
      >
        <form onSubmit={editTaskForm.onSubmit(handleEditTaskSubmit)}>
          <Grid>
            <Grid.Col span={12}>
              <TextInput
                label="Task Title"
                placeholder="What needs to be done?"
                required
                mb="md"
                {...editTaskForm.getInputProps('title')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Select
                label="Priority"
                placeholder="Select priority"
                data={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                ]}
                mb="md"
                {...editTaskForm.getInputProps('priority')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea
                label="Description"
                placeholder="Describe the task in detail..."
                required
                autosize
                minRows={2}
                maxRows={4}
                mb="md"
                {...editTaskForm.getInputProps('description')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Tags"
                placeholder="work, project, personal"
                mb="md"
                {...editTaskForm.getInputProps('tags')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label="Related Goal (optional)"
                placeholder="Select a goal"
                data={goals.map(goal => ({ value: goal.id, label: goal.title }))}
                clearable
                mb="md"
                {...editTaskForm.getInputProps('goal')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <DateInput
                label="Due Date (optional)"
                placeholder="Select due date"
                clearable
                mb="md"
                valueFormat="YYYY-MM-DD"
                {...editTaskForm.getInputProps('dueDate')}
              />
            </Grid.Col>
          </Grid>
          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              onClick={() => {
                setEditTaskModalOpened(false);
                setEditingTask(null);
                editTaskForm.reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Update Task</Button>
          </Group>
        </form>
      </Modal>

    </Container>
  );
}
