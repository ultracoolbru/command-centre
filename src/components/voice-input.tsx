import { useVoiceRecognition, useVoiceCommands } from '@/lib/voice';
import { Button, Group, Text, Paper, Modal } from '@mantine/core';
import { useState, useEffect } from 'react';
import { IconMicrophone, IconMicrophoneOff } from '@tabler/icons-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  placeholder?: string;
  buttonVariant?: 'filled' | 'outline' | 'light';
  buttonColor?: string;
  fullWidth?: boolean;
}

export function VoiceInput({
  onTranscript,
  placeholder = 'Voice input will appear here...',
  buttonVariant = 'outline',
  buttonColor = 'blue',
  fullWidth = false
}: VoiceInputProps) {
  const {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    browserSupportsSpeechRecognition
  } = useVoiceRecognition();

  const [showModal, setShowModal] = useState(false);

  // When transcript changes and we have content, send it to parent
  useEffect(() => {
    if (transcript && !isListening) {
      onTranscript(transcript);
    }
  }, [transcript, isListening, onTranscript]);

  const handleToggleListening = () => {
    if (!browserSupportsSpeechRecognition) {
      setShowModal(true);
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <>
      <Button
        variant={isListening ? 'filled' : buttonVariant}
        color={isListening ? 'red' : buttonColor}
        onClick={handleToggleListening}
        leftSection={isListening ? <IconMicrophoneOff size="1.1rem" /> : <IconMicrophone size="1.1rem" />}
        fullWidth={fullWidth}
      >
        {isListening ? 'Stop Recording' : 'Voice Input'}
      </Button>

      {isListening && (
        <Paper withBorder p="sm" mt="xs">
          <Text size="sm" color="dimmed">
            {transcript || placeholder}
          </Text>
        </Paper>
      )}

      <Modal
        opened={showModal}
        onClose={() => setShowModal(false)}
        title="Speech Recognition Not Supported"
      >
        <Text>
          Your browser does not support speech recognition. Please try using a modern browser like Chrome, Edge, or Safari.
        </Text>
        <Button onClick={() => setShowModal(false)} mt="md" fullWidth>
          OK
        </Button>
      </Modal>
    </>
  );
}

interface VoiceCommandListenerProps {
  commands: Record<string, (args?: string) => void>;
  children: React.ReactNode;
}

export function VoiceCommandListener({ commands, children }: VoiceCommandListenerProps) {
  const {
    isListening,
    transcript,
    error,
    startListening,
    stopListening
  } = useVoiceCommands(commands);

  const [showCommandModal, setShowCommandModal] = useState(false);

  return (
    <>
      {children}

      <Modal
        opened={isListening}
        onClose={stopListening}
        title="Listening for Commands"
        size="sm"
      >
        <Text style={{ textAlign: 'center' }} mb="md">
          Speak a command...
        </Text>
        <Paper withBorder p="md">
          <Text style={{ textAlign: 'center' }} size="lg">
            {transcript || "I'm listening..."}
          </Text>
        </Paper>
        <Button onClick={stopListening} mt="md" fullWidth color="red">
          Stop Listening
        </Button>
      </Modal>

      <Button
        onClick={() => setShowCommandModal(true)}
        variant="subtle"
        leftSection={<IconMicrophone size="1rem" />}
        style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}
      >
        Voice Commands
      </Button>

      <Modal
        opened={showCommandModal}
        onClose={() => setShowCommandModal(false)}
        title="Available Voice Commands"
      >
        <Text mb="md">
          Click "Start Listening" and speak one of these commands:
        </Text>
        <Paper withBorder p="md" mb="md">
          <Group justify="space-between">
            <Text fw={500}>Command</Text>
            <Text fw={500}>Action</Text>
          </Group>
          {Object.keys(commands).map((command, index) => (
            <Group key={index} justify="space-between" mt="xs">
              <Text>{command.replace(/\{([^}]+)\}/g, '<$1>')}</Text>
              <Text c="dimmed">Executes action</Text>
            </Group>
          ))}
        </Paper>
        <Group justify="space-between">
          <Button variant="outline" onClick={() => setShowCommandModal(false)}>
            Cancel
          </Button>
          <Button onClick={() => {
            setShowCommandModal(false);
            startListening();
          }}>
            Start Listening
          </Button>
        </Group>
      </Modal>
    </>
  );
}
