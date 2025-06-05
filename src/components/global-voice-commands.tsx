"use client";

import { useVoiceCommands } from '@/lib/voice';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { ActionIcon, Tooltip } from '@mantine/core';
import { IconMicrophone } from '@tabler/icons-react';

// Global voice command navigation component
export function GlobalVoiceCommands({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Define global navigation commands
  const commands = {
    'go to dashboard': () => {
      router.push('/dashboard/daily');
      notifications.show({
        title: 'Voice Command',
        message: 'Navigating to dashboard',
        color: 'blue',
      });
    },
    'go to daily planner': () => {
      router.push('/dashboard/daily');
      notifications.show({
        title: 'Voice Command',
        message: 'Navigating to daily planner',
        color: 'blue',
      });
    },
    'go to tasks': () => {
      router.push('/dashboard/tasks');
      notifications.show({
        title: 'Voice Command',
        message: 'Navigating to tasks',
        color: 'blue',
      });
    },
    'go to health tracker': () => {
      router.push('/dashboard/health');
      notifications.show({
        title: 'Voice Command',
        message: 'Navigating to health tracker',
        color: 'blue',
      });
    },
    'go to journal': () => {
      router.push('/dashboard/journal');
      notifications.show({
        title: 'Voice Command',
        message: 'Navigating to journal',
        color: 'blue',
      });
    },
    'go to violt': () => {
      router.push('/dashboard/violt');
      notifications.show({
        title: 'Voice Command',
        message: 'Navigating to Violt developer panel',
        color: 'blue',
      });
    },
    'go to bullet journal': () => {
      router.push('/dashboard/bullet');
      notifications.show({
        title: 'Voice Command',
        message: 'Navigating to bullet journal',
        color: 'blue',
      });
    },
    'go to echo': () => {
      router.push('/dashboard/echo');
      notifications.show({
        title: 'Voice Command',
        message: 'Navigating to Echo CLI',
        color: 'blue',
      });
    },
    'go to ai': () => {
      router.push('/dashboard/ai');
      notifications.show({
        title: 'Voice Command',
        message: 'Navigating to AI insights',
        color: 'blue',
      });
    },
    'go to reminders': () => {
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

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
  } = useVoiceCommands(commands);

  // Add a floating button for global voice commands
  return (
    <>
      {children}
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
        <Tooltip label={isListening ? "Stop Listening" : "Start Listening"} position="left" withArrow>
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
    </>
  );
}
