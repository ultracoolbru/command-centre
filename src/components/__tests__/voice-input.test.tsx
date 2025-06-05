import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VoiceInput } from '@/components/voice-input';

// Mock the useVoiceRecognition hook
jest.mock('@/lib/voice', () => ({
  useVoiceRecognition: () => ({
    isListening: false,
    transcript: '',
    error: null,
    startListening: jest.fn(),
    stopListening: jest.fn(),
    browserSupportsSpeechRecognition: true
  })
}));

describe('VoiceInput Component', () => {
  const mockOnTranscript = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders voice input button', () => {
    render(<VoiceInput onTranscript={mockOnTranscript} />);
    
    const button = screen.getByText('Voice Input');
    expect(button).toBeInTheDocument();
  });

  test('displays placeholder when listening', () => {
    // Override the mock to simulate listening state
    jest.mock('@/lib/voice', () => ({
      useVoiceRecognition: () => ({
        isListening: true,
        transcript: '',
        error: null,
        startListening: jest.fn(),
        stopListening: jest.fn(),
        browserSupportsSpeechRecognition: true
      })
    }));

    render(<VoiceInput onTranscript={mockOnTranscript} placeholder="Test placeholder" />);
    
    const placeholder = screen.getByText('Test placeholder');
    expect(placeholder).toBeInTheDocument();
  });
});
