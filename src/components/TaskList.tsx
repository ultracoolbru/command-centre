import React from 'react';
import { useMongoData } from '@/lib/hooks';
import { Text, LoadingOverlay, Box, List, Checkbox } from '@mantine/core';

interface Task {
  _id: string;
  title: string;
  completed: boolean;
}

interface UseMongoDataReturn {
  data: Task[];
  isLoading: boolean;
  error: Error | null;
  updateItem: (id: string, updates: Partial<Task>) => Promise<void>;
}

export const TaskList: React.FC = () => {
  // Use type assertion to match the mock implementation
  const { data = [], isLoading, error, updateItem } = useMongoData('tasks') as unknown as UseMongoDataReturn;

  const handleToggleComplete = async (task: Task) => {
    try {
      await updateItem(task._id, { completed: !task.completed });
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  if (isLoading) return <LoadingOverlay visible={true} />;
  if (error) return <Text color="red">Error loading tasks: {error.message}</Text>;
  if (!data || data.length === 0) return <Text>No tasks found</Text>;

  return (
    <Box>
      <List spacing="xs" size="sm" center>
        {data.map((task: Task) => (
          <List.Item
            key={task._id}
            icon={
              <Checkbox
                checked={task.completed}
                onChange={() => handleToggleComplete(task)}
                aria-label={`Toggle ${task.title}`}
              />
            }
          >
            <Text
              style={{
                textDecoration: task.completed ? 'line-through' : 'none',
                color: task.completed ? 'gray' : 'inherit',
              }}
            >
              {task.title}
            </Text>
          </List.Item>
        ))}
      </List>
    </Box>
  );
};

export default TaskList;
