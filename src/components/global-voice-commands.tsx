"use client";

import { useAuth } from '@/lib/auth-context';
import { useVoiceCommands } from '@/lib/voice';
import { ActionIcon, Text, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconMicrophone } from '@tabler/icons-react';
import { usePathname, useRouter } from 'next/navigation';

// Global voice command navigation component
export function GlobalVoiceCommands({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  // Define global navigation commands
  const commands = {
    'dashboard': () => {
      router.push('/dashboard/daily');
      notifications.show({
        title: 'Voice Command',
        message: 'Navigating to dashboard',
        color: 'blue',
      });
    },
    'planner': () => {
      router.push('/dashboard/daily');
      notifications.show({
        title: 'Voice Command',
        message: 'Navigating to daily planner',
        color: 'blue',
      });
    },
    'tasks': () => {
      router.push('/dashboard/tasks');
      notifications.show({
        title: 'Voice Command',
        message: 'Navigating to tasks',
        color: 'blue',
      });
    },
    'health': () => {
      router.push('/dashboard/health');
      notifications.show({
        title: 'Voice Command',
        message: 'Navigating to health tracker',
        color: 'blue',
      });
    },
    'journal': () => {
      router.push('/dashboard/bullet');
      notifications.show({
        title: 'Voice Command',
        message: 'Navigating to journal',
        color: 'blue',
      });
    },
    'bullet journal': () => {
      router.push('/dashboard/bullet');
      notifications.show({
        title: 'Voice Command',
        message: 'Navigating to bullet journal',
        color: 'blue',
      });
    },
    'projects': () => {
      router.push('/dashboard/projects');
      notifications.show({
        title: 'Voice Command',
        message: 'Navigating to projects',
        color: 'blue',
      });
    },
    'echo': () => {
      router.push('/dashboard/echo');
      notifications.show({
        title: 'Voice Command',
        message: 'Navigating to Echo CLI',
        color: 'blue',
      });
    },
    'ai': () => {
      router.push('/dashboard/ai');
      notifications.show({
        title: 'Voice Command',
        message: 'Navigating to AI insights',
        color: 'blue',
      });
    },
    'reminders': () => {
      router.push('/dashboard/reminders');
      notifications.show({
        title: 'Voice Command',
        message: 'Navigating to reminders',
        color: 'blue',
      });
    },
    'log out': () => {
      router.push('/auth/login');
      notifications.show({
        title: 'Voice Command',
        message: 'Logging out...',
        color: 'blue',
      });
    },
  };

  // Always call hooks unconditionally
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
  } = useVoiceCommands(commands);

  // Determine if we should show the voice commands UI
  const shouldShowVoiceCommands = user && !pathname.includes('/auth/');

  // Add a floating button for global voice commands
  return (
    <>
      {children}
      {shouldShowVoiceCommands && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '10px',
          }}
        >
          {isListening && (
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                padding: '10px 15px',
                borderRadius: '20px',
                marginBottom: '10px',
              }}
            >
              Listening: {transcript || "Say a command..."}
            </div>
          )}
          <Tooltip
            label={
              <div>
                <Text size="sm" fw={500} mb="xs">Global Voice Commands:</Text>
                <Text size="xs">• "dashboard" or "planner" - Daily planner</Text>
                <Text size="xs">• "tasks" - Task management</Text>
                <Text size="xs">• "health" - Health tracker</Text>
                <Text size="xs">• "journal" - Personal journal</Text>
                <Text size="xs">• "projects" - Project management</Text>
                <Text size="xs">• "bullet journal" - Bullet journal</Text>
                <Text size="xs">• "echo" - Echo CLI</Text>
                <Text size="xs">• "ai" - AI insights</Text>
                <Text size="xs">• "reminders" - Reminders</Text>
                <Text size="xs">• "log out" - Sign out</Text>
              </div>
            }
            multiline
            w={280}
            position="left"
            withArrow
          >
            <ActionIcon
              onClick={isListening ? stopListening : startListening}
              variant={isListening ? "filled" : "outline"}
              color="blue"
              size="xl"
              radius="xl"
              aria-label={isListening ? "Stop Listening" : "Start Listening"}
            >
              <IconMicrophone size="1.5rem" />
            </ActionIcon>
          </Tooltip>
        </div>
      )}
    </>
  );
}
