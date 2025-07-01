// Extend the Window interface for SpeechRecognition support
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

import { useCallback, useEffect, useState } from 'react';

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
    recognitionInstance.continuous = false; // Changed to false to prevent continuous interim results
    recognitionInstance.interimResults = false; // Changed to false to only get final results
    recognitionInstance.lang = 'en-US'; // Set language to English (United States) - TODO: Set this dynamically based on user preference (in the settings tab)
    recognitionInstance.maxAlternatives = 1;

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

      // Only process final results to avoid interim duplicates
      if (result.isFinal) {
        const transcriptValue = result[0].transcript.trim();
        if (transcriptValue) {
          setTranscript(transcriptValue);
        }
      }
    };

    recognitionInstance.onerror = (event: { error: any; }) => {
      setError(`Speech recognition error: ${event.error}`);
      stopListening();
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
      // Don't auto-restart here - let the component handle it
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
    if (!transcript || transcript === lastProcessedTranscript || transcript.length < 2) return;

    const lowerTranscript = transcript.toLowerCase().trim();

    // Skip if it's just a repetition or partial word
    if (lastProcessedTranscript && lowerTranscript.startsWith(lastProcessedTranscript.toLowerCase())) {
      return;
    }

    // Check for command matches
    let commandFound = false;
    for (const [commandPattern, handler] of Object.entries(commands)) {
      // Convert command pattern to regex
      const pattern = new RegExp(`^${commandPattern.toLowerCase().replace(/\{([^}]+)\}/g, '(.+)')}$`);
      const match = lowerTranscript.match(pattern);

      if (match) {
        // Extract arguments if any
        const args = match.length > 1 ? match[1].trim() : undefined;

        // Execute the command handler
        handler(args);

        // Mark as processed
        setLastProcessedTranscript(transcript);
        commandFound = true;

        // Clear transcript for next command
        setTimeout(() => {
          setLastProcessedTranscript('');
        }, 1000);

        break;
      }
    }

    // If no specific command found, check for the general text handler
    if (!commandFound && commands['{text}']) {
      commands['{text}'](transcript);
      setLastProcessedTranscript(transcript);

      // Clear transcript for next command
      setTimeout(() => {
        setLastProcessedTranscript('');
      }, 1000);
    }
  }, [transcript, lastProcessedTranscript, commands]);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    browserSupportsSpeechRecognition
  };
}
