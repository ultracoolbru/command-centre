// Extend the Window interface for SpeechRecognition support
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

import { useState, useEffect, useCallback } from 'react';

// Custom hook for voice recognition
export function useVoiceRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Check if browser supports speech recognition
  const browserSupportsSpeechRecognition = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Initialize speech recognition
  const recognition = useCallback(() => {
    if (typeof window === 'undefined') return null;

    // Use the appropriate speech recognition API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';

    return recognitionInstance;
  }, []);

  // Start listening
  const startListening = useCallback(() => {
    if (!browserSupportsSpeechRecognition) {
      setError('Your browser does not support speech recognition.');
      return;
    }

    const recognitionInstance = recognition();
    if (!recognitionInstance) return;

    // Clear previous transcript
    setTranscript('');
    setError(null);

    // Set up event handlers
    recognitionInstance.onresult = (event: { resultIndex: any; results: { [x: string]: any; }; }) => {
      const current = event.resultIndex;
      const result = event.results[current];
      const transcriptValue = result[0].transcript;

      setTranscript(transcriptValue);
    };

    recognitionInstance.onerror = (event: { error: any; }) => {
      setError(`Speech recognition error: ${event.error}`);
      stopListening();
    };

    recognitionInstance.onend = () => {
      if (isListening) {
        // Restart if we're still supposed to be listening
        recognitionInstance.start();
      }
    };

    // Start recognition
    try {
      recognitionInstance.start();
      setIsListening(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(`Failed to start speech recognition: ${err.message}`);
      } else {
        setError('Failed to start speech recognition: Unknown error');
      }
    }
  }, [browserSupportsSpeechRecognition, isListening, recognition]);

  // Stop listening
  const stopListening = useCallback(() => {
    const recognitionInstance = recognition();
    if (recognitionInstance) {
      recognitionInstance.stop();
    }
    setIsListening(false);
  }, [recognition]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isListening) {
        stopListening();
      }
    };
  }, [isListening, stopListening]);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    browserSupportsSpeechRecognition
  };
}

// Voice command processor
export function useVoiceCommands(commands: Record<string, (args?: string) => void>) {
  const {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    browserSupportsSpeechRecognition
  } = useVoiceRecognition();

  const [lastProcessedTranscript, setLastProcessedTranscript] = useState('');

  // Process commands when transcript changes
  useEffect(() => {
    if (!transcript || transcript === lastProcessedTranscript) return;

    const lowerTranscript = transcript.toLowerCase().trim();

    // Check for command matches
    for (const [commandPattern, handler] of Object.entries(commands)) {
      // Convert command pattern to regex
      const pattern = new RegExp(`^${commandPattern.toLowerCase().replace(/\{([^}]+)\}/g, '(.+)')}$`);
      const match = lowerTranscript.match(pattern);

      if (match) {
        // Extract arguments if any
        const args = match.length > 1 ? match[1] : undefined;

        // Execute the command handler
        handler(args);

        // Mark as processed
        setLastProcessedTranscript(transcript);

        // Stop listening after command is processed
        stopListening();
        break;
      }
    }
  }, [transcript, lastProcessedTranscript, commands, stopListening]);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    browserSupportsSpeechRecognition
  };
}
