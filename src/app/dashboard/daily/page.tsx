"use client";

import { useAuth } from '@/lib/auth-context';
import { useVoiceCommands } from '@/lib/voice';
import { DailySummary, ErrorSummary } from "@/types/schemas";
import { ActionIcon, Alert, Button, Card, Container, Grid, Group, Loader, Paper, Text, Textarea, TextInput, Timeline, Title, Tooltip } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck, IconCircle, IconCircleCheck, IconClock, IconMicrophone, IconX } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { fetchDailyAIInsights, getWeeklyOverview, saveEveningPlan, saveMorningPlan } from './actions';

interface Insight {
  title: string;
  description: string;
}

export default function DailyPlannerPage() {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | null>(new Date());
  const [isRecording, setIsRecording] = useState(false);
  const [weeklyOverview, setWeeklyOverview] = useState<DailySummary[] | ErrorSummary[]>([]);
  const [loadingWeeklySummary, setLoadingWeeklySummary] = useState(false);
  const [isSubmittingMorning, setIsSubmittingMorning] = useState(false);
  const [isSubmittingEvening, setIsSubmittingEvening] = useState(false);
  const [aiInsights, setAiInsights] = useState<Insight[] | null>(null);
  const [isLoadingAIInsights, setIsLoadingAIInsights] = useState(false);
  const [aiInsightsError, setAiInsightsError] = useState<string | null>(null);
  const [currentVoiceField, setCurrentVoiceField] = useState<string | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [currentEveningVoiceField, setCurrentEveningVoiceField] = useState<string | null>(null);
  const [isEveningVoiceMode, setIsEveningVoiceMode] = useState(false);
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0);
  const [lastVoiceInput, setLastVoiceInput] = useState<string>('');
  const [lastEveningVoiceInput, setLastEveningVoiceInput] = useState<string>('');

  const morningForm = useForm({
    initialValues: {
      priority1: '',
      priority2: '',
      priority3: '',
      morningNotes: '',
    },
  });

  const eveningForm = useForm({
    initialValues: {
      accomplishments: '',
      challenges: '',
      tomorrowFocus: '',
      reflectionNotes: '',
    },
  });

  const handleMorningSubmit = async (values: typeof morningForm.values) => {
    if (!user) {
      notifications.show({
        title: 'Authentication Error',
        message: `You must be logged in to save your ${getTimePeriod().toLowerCase()} plan.`,
        c: 'red',
        icon: <IconX size="1.1rem" />,
      });
      return;
    }
    if (!date) {
      notifications.show({
        title: 'Date Error',
        message: `Please select a date to save your ${getTimePeriod().toLowerCase()} plan.`,
        c: 'red',
        icon: <IconX size="1.1rem" />,
      });
      return;
    }

    setIsSubmittingMorning(true);
    setAiInsights(null); // Clear previous insights
    setAiInsightsError(null); // Clear previous errors
    try {
      const result = await saveMorningPlan(user.uid, date.toISOString(), values);
      if (result.success) {
        notifications.show({
          title: `${getTimePeriod()} Plan Saved`,
          message: result.message || `Your ${getTimePeriod().toLowerCase()} priorities have been saved successfully.`,
          c: 'green',
          icon: <IconCheck size="1.1rem" />,
        });
        morningForm.reset();
        triggerAIInsightsFetch();
      } else {
        notifications.show({
          title: 'Save Failed',
          message: result.message || `Could not save your ${getTimePeriod().toLowerCase()} plan. Please try again.`,
          c: 'red',
          icon: <IconX size="1.1rem" />,
        });
      }
    } catch (error) {
      console.error('Error submitting morning plan:', error);
      notifications.show({
        title: 'Error',
        message: 'An unexpected error occurred. Please try again.',
        c: 'red',
        icon: <IconX size="1.1rem" />,
      });
    } finally {
      setIsSubmittingMorning(false);
    }
  };

  const handleEveningSubmit = async (values: typeof eveningForm.values) => {
    if (!user) {
      notifications.show({
        title: 'Authentication Error',
        message: 'You must be logged in to save your evening reflection.',
        c: 'red',
        icon: <IconX size="1.1rem" />,
      });
      return;
    }
    if (!date) {
      notifications.show({
        title: 'Date Error',
        message: 'Please select a date to save your evening reflection.',
        c: 'red',
        icon: <IconX size="1.1rem" />,
      });
      return;
    }

    setIsSubmittingEvening(true);
    setAiInsights(null); // Clear previous insights
    setAiInsightsError(null); // Clear previous errors
    try {
      const result = await saveEveningPlan(user.uid, date.toISOString(), values);
      if (result.success) {
        notifications.show({
          title: 'Evening Reflection Saved',
          message: result.message || 'Your evening reflection has been saved successfully.',
          c: 'green',
          icon: <IconCheck size="1.1rem" />,
        });
        eveningForm.reset();
        setCurrentEveningVoiceField(null);
        setLastEveningVoiceInput('');
        triggerAIInsightsFetch();
      } else {
        notifications.show({
          title: 'Save Failed',
          message: result.message || 'Could not save your evening reflection. Please try again.',
          c: 'red',
          icon: <IconX size="1.1rem" />,
        });
      }
    } catch (error) {
      console.error('Error submitting evening reflection:', error);
      notifications.show({
        title: 'Error',
        message: 'An unexpected error occurred. Please try again.',
        c: 'red',
        icon: <IconX size="1.1rem" />,
      });
    } finally {
      setIsSubmittingEvening(false);
    }
  };

  const triggerAIInsightsFetch = async () => {
    if (!user || !date) {
      setAiInsightsError("User or date not available to fetch insights.");
      return;
    }
    setIsLoadingAIInsights(true);
    setAiInsightsError(null);
    try {
      console.log('Fetching AI insights for user:', user.uid, 'date:', date.toISOString());
      const insightResult = await fetchDailyAIInsights(user.uid, date.toISOString());
      console.log('AI insights result:', insightResult);

      if (insightResult.success && insightResult.insights) {
        setAiInsights(insightResult.insights);
        console.log('AI insights set successfully:', insightResult.insights);
      } else {
        setAiInsights([]); // Set to empty array to indicate no insights found or error
        setAiInsightsError(insightResult.message || "Failed to fetch AI insights.");
        console.error('AI insights failed:', insightResult.message);
        notifications.show({
          title: 'AI Insights Error',
          message: insightResult.message || "Could not retrieve AI insights at this time.",
          c: 'orange',
          icon: <IconAlertCircle size="1.1rem" />,
        });
      }
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      setAiInsights([]);
      setAiInsightsError("An unexpected error occurred while fetching AI insights.");
      notifications.show({
        title: 'AI Insights Error',
        message: "An unexpected error occurred while fetching AI insights.",
        c: 'red',
        icon: <IconX size="1.1rem" />,
      });
    } finally {
      setIsLoadingAIInsights(false);
    }
  };



  const handleDateChange = (value: any) => {
    if (typeof value === 'string') {
      setDate(value ? new Date(value) : null);
    } else {
      setDate(value);
    }
  };

  const getTodayIndex = () => {
    const today = new Date();
    // Check if the selected `date` is in the current week.
    // To do this, compare the week number and year.
    if (date) {
      const currentWeek = getWeek(today);
      const selectedWeek = getWeek(date);
      if (currentWeek === selectedWeek && today.getFullYear() === date.getFullYear()) {
        return today.getDay(); // 0 (Sun) - 6 (Sat)
      }
    }
    return -1; // Don't activate any bullet if not current week
  };

  // Helper function to get week number
  const getWeek = (d: Date) => {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    // Sunday in current week decides the year.
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    // January 4 is always in week 1.
    const week1 = new Date(date.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  }

  // Helper function to get the icon for Timeline bullets based on day status
  const getDayIcon = (dayName: string) => {
    if (!date) return <IconCircle size={12} />;

    const today = new Date();
    const todayDayName = today.toLocaleDateString('en-US', { weekday: 'long' });

    // Map day names to their index (Sunday = 0, Monday = 1, etc.)
    const dayMap: { [key: string]: number } = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };

    const currentDayIndex = dayMap[todayDayName];
    const itemDayIndex = dayMap[dayName];

    // Check if we're looking at the current week
    const currentWeek = getWeek(today);
    const selectedWeek = getWeek(date);
    const isCurrentWeek = currentWeek === selectedWeek && today.getFullYear() === date.getFullYear();

    if (!isCurrentWeek) {
      // For past/future weeks, all days are either all complete (past) or all incomplete (future)
      const selectedWeekStart = new Date(date);
      selectedWeekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)

      if (selectedWeekStart < today) {
        return <IconCircleCheck size={12} color="blue" />; // Past week - all days complete
      } else {
        return <IconCircle size={12} />; // Future week - default icon
      }
    }

    // For current week
    if (itemDayIndex < currentDayIndex) {
      return <IconCircleCheck size={12} color="blue" />; // Past days are blue check (complete)
    } else if (itemDayIndex === currentDayIndex) {
      return <IconClock size={12} color="green" />; // Today is green clock (current)
    } else {
      return <IconCircle size={12} />; // Future days use default circle
    }
  };

  // Helper function to get the current time period
  const getTimePeriod = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      return 'Morning';
    } else if (currentHour < 17) {
      return 'Afternoon';
    } else {
      return 'Evening';
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

  // Voice command handlers for Morning Focus
  const voiceCommands = {
    'next': () => {
      const fieldOrder = ['priority1', 'priority2', 'priority3', 'morningNotes'];
      const currentIndex = currentVoiceField ? fieldOrder.indexOf(currentVoiceField) : 0;
      const nextField = fieldOrder[currentIndex + 1] || null;
      setCurrentVoiceField(nextField);

      const fieldNames = {
        'priority1': 'Priority 1',
        'priority2': 'Priority 2',
        'priority3': 'Priority 3',
        'morningNotes': 'Additional Notes'
      };

      if (nextField) {
        showNotificationThrottled({
          title: 'Voice Navigation',
          message: `Moved to ${fieldNames[nextField as keyof typeof fieldNames]}.`,
          c: 'blue',
        }, 1000);
      }
    },
    'previous': () => {
      const fieldOrder = ['priority1', 'priority2', 'priority3', 'morningNotes'];
      const currentIndex = currentVoiceField ? fieldOrder.indexOf(currentVoiceField) : 0;
      const prevField = fieldOrder[currentIndex - 1] || null;
      setCurrentVoiceField(prevField);

      const fieldNames = {
        'priority1': 'Priority 1',
        'priority2': 'Priority 2',
        'priority3': 'Priority 3',
        'morningNotes': 'Additional Notes'
      };

      if (prevField) {
        showNotificationThrottled({
          title: 'Voice Navigation',
          message: `Moved to ${fieldNames[prevField as keyof typeof fieldNames]}.`,
          c: 'blue',
        }, 1000);
      }
    },
    'clear field': () => {
      if (currentVoiceField) {
        morningForm.setFieldValue(currentVoiceField, '');
        showNotificationThrottled({
          title: 'Voice Input',
          message: 'Field cleared.',
          c: 'orange',
        }, 1000);
      }
    },
    'save form': () => {
      morningForm.onSubmit(handleMorningSubmit)();
      setIsVoiceMode(false);
      setCurrentVoiceField(null);
      // Form will be reset in handleMorningSubmit if successful
      notifications.show({
        title: 'Voice Mode',
        message: 'Form submitted.',
        c: 'green',
      });
    },
    'stop voice': () => {
      setIsVoiceMode(false);
      setCurrentVoiceField(null);
      morningForm.reset();
      notifications.show({
        title: 'Voice Mode',
        message: 'Voice input stopped and form cleared.',
        c: 'gray',
      });
    },
    'priority one {text}': (text?: string) => {
      if (text) {
        morningForm.setFieldValue('priority1', text);
        setCurrentVoiceField('priority2');
        showNotificationThrottled({
          title: 'Voice Input',
          message: 'Priority 1 set.',
          c: 'green',
        });
      }
    },
    'priority two {text}': (text?: string) => {
      if (text) {
        morningForm.setFieldValue('priority2', text);
        setCurrentVoiceField('priority3');
        showNotificationThrottled({
          title: 'Voice Input',
          message: 'Priority 2 set.',
          c: 'green',
        });
      }
    },
    'priority three {text}': (text?: string) => {
      if (text) {
        morningForm.setFieldValue('priority3', text);
        setCurrentVoiceField('morningNotes');
        showNotificationThrottled({
          title: 'Voice Input',
          message: 'Priority 3 set.',
          c: 'green',
        });
      }
    },
    'notes {text}': (text?: string) => {
      if (text) {
        morningForm.setFieldValue('morningNotes', text);
        setCurrentVoiceField(null);
        showNotificationThrottled({
          title: 'Voice Input',
          message: 'Notes added.',
          c: 'green',
        });
      }
    },
    '{text}': (text?: string) => {
      // Direct input to current field - only process if not a command
      if (text && currentVoiceField && text.length > 3) {
        const lowerText = text.toLowerCase().trim();
        // Ignore if it's a navigation command that might have been misheard
        if (!['next', 'previous', 'clear field', 'save form', 'stop voice'].includes(lowerText)) {
          morningForm.setFieldValue(currentVoiceField, text);
          setLastVoiceInput(text);
        }
      }
    }
  };

  // Voice command handlers for Evening Reflection
  const eveningVoiceCommands = {
    'next': () => {
      const fieldOrder = ['accomplishments', 'challenges', 'tomorrowFocus', 'reflectionNotes'];
      const currentIndex = currentEveningVoiceField ? fieldOrder.indexOf(currentEveningVoiceField) : 0;
      const nextField = fieldOrder[currentIndex + 1] || null;
      setCurrentEveningVoiceField(nextField);

      const fieldNames = {
        'accomplishments': 'Accomplishments',
        'challenges': 'Challenges',
        'tomorrowFocus': 'Tomorrow Focus',
        'reflectionNotes': 'Reflection Notes'
      };

      if (nextField) {
        showNotificationThrottled({
          title: 'Voice Navigation',
          message: `Moved to ${fieldNames[nextField as keyof typeof fieldNames]}.`,
          c: 'blue',
        }, 1000);
      }
    },
    'previous': () => {
      const fieldOrder = ['accomplishments', 'challenges', 'tomorrowFocus', 'reflectionNotes'];
      const currentIndex = currentEveningVoiceField ? fieldOrder.indexOf(currentEveningVoiceField) : 0;
      const prevField = fieldOrder[currentIndex - 1] || null;
      setCurrentEveningVoiceField(prevField);

      const fieldNames = {
        'accomplishments': 'Accomplishments',
        'challenges': 'Challenges',
        'tomorrowFocus': 'Tomorrow Focus',
        'reflectionNotes': 'Reflection Notes'
      };

      if (prevField) {
        showNotificationThrottled({
          title: 'Voice Navigation',
          message: `Moved to ${fieldNames[prevField as keyof typeof fieldNames]}.`,
          c: 'blue',
        }, 1000);
      }
    },
    'clear field': () => {
      if (currentEveningVoiceField) {
        eveningForm.setFieldValue(currentEveningVoiceField, '');
        showNotificationThrottled({
          title: 'Voice Input',
          message: 'Field cleared.',
          c: 'orange',
        }, 1000);
      }
    },
    'save form': () => {
      eveningForm.onSubmit(handleEveningSubmit)();
      setIsEveningVoiceMode(false);
      setCurrentEveningVoiceField(null);
      // Form will be reset in handleEveningSubmit if successful
      notifications.show({
        title: 'Voice Mode',
        message: 'Form submitted.',
        c: 'green',
      });
    },
    'stop voice': () => {
      setIsEveningVoiceMode(false);
      setCurrentEveningVoiceField(null);
      eveningForm.reset();
      notifications.show({
        title: 'Voice Mode',
        message: 'Voice input stopped and form cleared.',
        c: 'gray',
      });
    },
    'accomplishments {text}': (text?: string) => {
      if (text) {
        eveningForm.setFieldValue('accomplishments', text);
        setCurrentEveningVoiceField('challenges');
        showNotificationThrottled({
          title: 'Voice Input',
          message: 'Accomplishments set.',
          c: 'green',
        });
      }
    },
    'challenges {text}': (text?: string) => {
      if (text) {
        eveningForm.setFieldValue('challenges', text);
        setCurrentEveningVoiceField('tomorrowFocus');
        showNotificationThrottled({
          title: 'Voice Input',
          message: 'Challenges set.',
          c: 'green',
        });
      }
    },
    'tomorrow focus {text}': (text?: string) => {
      if (text) {
        eveningForm.setFieldValue('tomorrowFocus', text);
        setCurrentEveningVoiceField('reflectionNotes');
        showNotificationThrottled({
          title: 'Voice Input',
          message: 'Tomorrow Focus set.',
          c: 'green',
        });
      }
    },
    'reflection notes {text}': (text?: string) => {
      if (text) {
        eveningForm.setFieldValue('reflectionNotes', text);
        setCurrentEveningVoiceField(null);
        showNotificationThrottled({
          title: 'Voice Input',
          message: 'Reflection Notes added.',
          c: 'green',
        });
      }
    },
    '{text}': (text?: string) => {
      // Direct input to current field - only process if not a command
      if (text && currentEveningVoiceField && text.length > 3) {
        const lowerText = text.toLowerCase().trim();
        // Ignore if it's a navigation command that might have been misheard
        if (!['next', 'previous', 'clear field', 'save form', 'stop voice'].includes(lowerText)) {
          eveningForm.setFieldValue(currentEveningVoiceField, text);
          setLastEveningVoiceInput(text);
        }
      }
    }
  };

  // Initialize voice commands
  const { isListening, startListening, stopListening } = useVoiceCommands(voiceCommands);
  const {
    isListening: isEveningListening,
    startListening: startEveningListening,
    stopListening: stopEveningListening
  } = useVoiceCommands(eveningVoiceCommands);

  // Toggle for Evening Reflection with full voice navigation
  const toggleVoiceRecording = () => {
    if (isEveningVoiceMode) {
      setIsEveningVoiceMode(false);
      setCurrentEveningVoiceField(null);
      setLastEveningVoiceInput('');
      stopEveningListening();
      eveningForm.reset();
      notifications.show({
        title: 'Voice Mode Stopped',
        message: 'Voice input has been disabled and evening form cleared.',
        c: 'gray',
      });
    } else {
      setIsEveningVoiceMode(true);
      setCurrentEveningVoiceField('accomplishments');
      setLastEveningVoiceInput('');
      startEveningListening();
      notifications.show({
        title: 'Voice Mode Started',
        message: 'Speak naturally to fill fields or use voice commands.',
        c: 'blue',
      });
    }
  };

  // Handle voice mode toggle
  const toggleVoiceMode = () => {
    if (isVoiceMode) {
      setIsVoiceMode(false);
      setCurrentVoiceField(null);
      setLastVoiceInput('');
      stopListening();
      morningForm.reset();
      notifications.show({
        title: 'Voice Mode Stopped',
        message: 'Voice input has been disabled and form cleared.',
        c: 'gray',
      });
    } else {
      setIsVoiceMode(true);
      setCurrentVoiceField('priority1');
      setLastVoiceInput('');
      startListening();
      notifications.show({
        title: 'Voice Mode Started',
        message: 'Speak naturally to fill fields or use voice commands.',
        c: 'blue',
      });
    }
  };

  useEffect(() => {
    if (!date || !user) { // Also check for user
      if (!user && !loadingWeeklySummary) { // Prevent setting error if user is just loading
        // setWeeklyOverview([{ title: "Authentication", description: "Please log in to see your weekly overview." }]);
      }
      return;
    }

    setLoadingWeeklySummary(true);
    const dateString = date.toISOString().split('T')[0];

    // Pass user.uid to getWeeklyOverview
    getWeeklyOverview(dateString, user.uid)
      .then(data => {
        if (data.length > 0 && 'day' in data[0] && data[0].day) {
          // We have successfully fetched and processed daily summaries
          setWeeklyOverview(data as DailySummary[]);
        } else if (data.length > 0) {
          // We likely have an array of ErrorSummary
          setWeeklyOverview(data as ErrorSummary[]);
          console.warn("Received ErrorSummary or unexpected data for weekly overview:", data);
        } else {
          // Empty array - could be no data or an issue
          setWeeklyOverview([{ title: "Info", description: "No weekly data processed or available." }]);
          console.warn("Received empty data for weekly overview:", data);
        }
      })
      .catch(error => {
        console.error('Error fetching weekly overview:', error);
        setWeeklyOverview([{
          title: 'Fetch Error',
          description: 'Failed to load weekly overview due to a network or system error.'
        }]);
      })
      .finally(() => setLoadingWeeklySummary(false));
  }, [date, user]); // Add user to dependency array

  return (
    <Container size="lg" mt="80">
      <Title order={1} mb="md">Daily Planner & Review</Title>

      <Group justify="space-between" mb="xl">
        <DatePickerInput
          value={date}
          onChange={handleDateChange}
          label="Select Date"
          placeholder="Pick a date"
          mx="auto"
          maw={400}
        />
      </Group>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
            <Title order={2} mb="md">{getTimePeriod()} Focus</Title>
            {isVoiceMode && (
              <Alert color="blue" mb="md">
                <div>
                  <Text size="sm" fw={500}>
                    Voice Mode Active - Current field: {currentVoiceField ?
                      (currentVoiceField === 'priority1' ? 'Priority 1' :
                        currentVoiceField === 'priority2' ? 'Priority 2' :
                          currentVoiceField === 'priority3' ? 'Priority 3' :
                            'Additional Notes') : 'None'}
                    {isListening && ' - Listening...'}
                  </Text>
                  {lastVoiceInput && (
                    <Text size="xs" c="dimmed" mt="xs">
                      Last input: "{lastVoiceInput}"
                    </Text>
                  )}
                </div>
              </Alert>
            )}
            <form onSubmit={morningForm.onSubmit(handleMorningSubmit)}>
              <TextInput
                label="Priority 1"
                placeholder="Your most important task today"
                required
                mb="md"
                style={{
                  border: currentVoiceField === 'priority1' && isVoiceMode ? '2px solid #228be6' : undefined,
                  borderRadius: currentVoiceField === 'priority1' && isVoiceMode ? '8px' : undefined
                }}
                {...morningForm.getInputProps('priority1')}
              />
              <TextInput
                label="Priority 2"
                placeholder="Your second priority"
                mb="md"
                style={{
                  border: currentVoiceField === 'priority2' && isVoiceMode ? '2px solid #228be6' : undefined,
                  borderRadius: currentVoiceField === 'priority2' && isVoiceMode ? '8px' : undefined
                }}
                {...morningForm.getInputProps('priority2')}
              />
              <TextInput
                label="Priority 3"
                placeholder="Your third priority"
                mb="md"
                style={{
                  border: currentVoiceField === 'priority3' && isVoiceMode ? '2px solid #228be6' : undefined,
                  borderRadius: currentVoiceField === 'priority3' && isVoiceMode ? '8px' : undefined
                }}
                {...morningForm.getInputProps('priority3')}
              />
              <Group justify="right" mb="md">
                <Tooltip
                  label={
                    <div>
                      <Text size="sm" fw={500} mb="xs">Voice Commands:</Text>
                      <Text size="xs">• "next" - Move to next field</Text>
                      <Text size="xs">• "previous" - Move to previous field</Text>
                      <Text size="xs">• "clear field" - Clear current field</Text>
                      <Text size="xs">• "save form" - Submit the form</Text>
                      <Text size="xs">• "stop voice" - Exit voice mode</Text>
                      <Text size="xs" mt="xs">Or speak directly to fill current field</Text>
                    </div>
                  }
                  multiline
                  w={250}
                  position="left"
                >
                  <ActionIcon
                    onClick={toggleVoiceMode}
                    variant={isVoiceMode ? "filled" : "outline"}
                    c={isVoiceMode ? "red" : "blue"}
                    size="xl"
                    radius="xl"
                    aria-label={isVoiceMode ? "Stop Voice Mode" : "Start Voice Mode"}
                  >
                    <IconMicrophone size="1.5rem" />
                  </ActionIcon>
                </Tooltip>
              </Group>
              <Textarea
                label="Additional Notes"
                placeholder="Any other thoughts for the day"
                minRows={3}
                mb="md"
                style={{
                  border: currentVoiceField === 'morningNotes' && isVoiceMode ? '2px solid #228be6' : undefined,
                  borderRadius: currentVoiceField === 'morningNotes' && isVoiceMode ? '8px' : undefined
                }}
                {...morningForm.getInputProps('morningNotes')}
              />
              <Button type="submit" fullWidth mt="md" loading={isSubmittingMorning}>
                Save {getTimePeriod()} Plan
              </Button>
            </form>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
            <Title order={2} mb="md">Evening Reflection</Title>
            {isEveningVoiceMode && (
              <Alert
                variant="light"
                color="blue"
                title="Voice Mode Active"
                icon={<IconMicrophone size="1rem" />}
                mb="md"
              >
                <div>
                  <Text size="sm">
                    <strong>Current Field:</strong> {
                      currentEveningVoiceField === 'accomplishments' ? 'Accomplishments' :
                        currentEveningVoiceField === 'challenges' ? 'Challenges' :
                          currentEveningVoiceField === 'tomorrowFocus' ? 'Tomorrow Focus' :
                            currentEveningVoiceField === 'reflectionNotes' ? 'Reflection Notes' :
                              'None'
                    }
                  </Text>
                  {lastEveningVoiceInput && (
                    <Text size="sm" mt="xs">
                      <strong>Last Input:</strong> {lastEveningVoiceInput}
                    </Text>
                  )}
                </div>
              </Alert>
            )}
            <form onSubmit={eveningForm.onSubmit(handleEveningSubmit)}>
              <Textarea
                label="Today's Accomplishments"
                placeholder="What did you accomplish today?"
                minRows={2}
                mb="md"
                style={{
                  border: currentEveningVoiceField === 'accomplishments' && isEveningVoiceMode ? '2px solid #228be6' : undefined,
                  borderRadius: currentEveningVoiceField === 'accomplishments' && isEveningVoiceMode ? '8px' : undefined
                }}
                {...eveningForm.getInputProps('accomplishments')}
              />
              <Textarea
                label="Challenges Faced"
                placeholder="What challenges did you encounter?"
                minRows={2}
                mb="md"
                style={{
                  border: currentEveningVoiceField === 'challenges' && isEveningVoiceMode ? '2px solid #228be6' : undefined,
                  borderRadius: currentEveningVoiceField === 'challenges' && isEveningVoiceMode ? '8px' : undefined
                }}
                {...eveningForm.getInputProps('challenges')}
              />
              <Textarea
                label="Tomorrow's Focus"
                placeholder="What will you focus on tomorrow?"
                minRows={2}
                mb="md"
                style={{
                  border: currentEveningVoiceField === 'tomorrowFocus' && isEveningVoiceMode ? '2px solid #228be6' : undefined,
                  borderRadius: currentEveningVoiceField === 'tomorrowFocus' && isEveningVoiceMode ? '8px' : undefined
                }}
                {...eveningForm.getInputProps('tomorrowFocus')}
              />
              <Group justify="right" mb="md">
                <Tooltip
                  label={
                    <div>
                      <Text size="sm" fw={500} mb="xs">Voice Commands:</Text>
                      <Text size="xs">• "next" - Move to next field</Text>
                      <Text size="xs">• "previous" - Move to previous field</Text>
                      <Text size="xs">• "clear field" - Clear current field</Text>
                      <Text size="xs">• "save form" - Submit the form</Text>
                      <Text size="xs">• "stop voice" - Exit voice mode</Text>
                      <Text size="xs" mt="xs">Or speak directly to fill current field</Text>
                    </div>
                  }
                  multiline
                  w={250}
                  position="left"
                >
                  <ActionIcon
                    onClick={toggleVoiceRecording}
                    variant={isEveningVoiceMode ? "filled" : "outline"}
                    c={isEveningVoiceMode ? "red" : "blue"}
                    size="xl"
                    radius="xl"
                    aria-label={isEveningVoiceMode ? "Stop Recording" : "Start Recording"}
                  >
                    <IconMicrophone size="1.5rem" />
                  </ActionIcon>
                </Tooltip>
              </Group>
              <Textarea
                label="Reflection Notes"
                placeholder="Any other reflections on your day"
                minRows={3}
                mb="md"
                style={{
                  border: currentEveningVoiceField === 'reflectionNotes' && isEveningVoiceMode ? '2px solid #228be6' : undefined,
                  borderRadius: currentEveningVoiceField === 'reflectionNotes' && isEveningVoiceMode ? '8px' : undefined
                }}
                {...eveningForm.getInputProps('reflectionNotes')}
              />
              <Button type="submit" fullWidth mt="md" loading={isSubmittingEvening}>
                Save Evening Reflection
              </Button>
            </form>
          </Card>
        </Grid.Col>
      </Grid>

      <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
        <Group justify="space-between" mb="md">
          <Title order={2}>AI Insights</Title>
          <Button
            variant="outline"
            size="sm"
            onClick={triggerAIInsightsFetch}
            loading={isLoadingAIInsights}
            disabled={!user || !date}
          >
            Generate Insights
          </Button>
        </Group>
        {isLoadingAIInsights && (
          <Group justify="center" mt="md">
            <Loader />
            <Text>Generating insights...</Text>
          </Group>
        )}
        {!isLoadingAIInsights && aiInsightsError && (
          <Alert icon={<IconAlertCircle size="1rem" />} title="Insights Error" c="red" mt="md">
            {aiInsightsError}
          </Alert>
        )}
        {!isLoadingAIInsights && !aiInsightsError && aiInsights && aiInsights.length > 0 && (
          aiInsights.map((insight, index) => (
            <Paper withBorder p="md" radius="md" mt={index > 0 ? "md" : undefined} key={index}>
              <Text fw={500}>{insight.title}</Text>
              <Text size="sm" c="dimmed">{insight.description}</Text>
            </Paper>
          ))
        )}
        {!isLoadingAIInsights && !aiInsightsError && (!aiInsights || aiInsights.length === 0) && (
          <Text c="dimmed" mt="md">
            No insights available yet. Save your morning or evening plan to generate new insights.
          </Text>
        )}
      </Card>

      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Title order={2} mb="md">Weekly Overview</Title>
        {loadingWeeklySummary && (
          <Group justify="center" mt="md">
            <Loader />
            <Text>Loading weekly overview...</Text>
          </Group>
        )}
        {!loadingWeeklySummary && weeklyOverview.length === 0 && (
          <Text c="dimmed" mt="md">No weekly overview data available for the selected week.</Text>
        )}
        {!loadingWeeklySummary && weeklyOverview.length > 0 && (
          <Timeline active={getTodayIndex()} bulletSize={24} lineWidth={2}>
            {weeklyOverview.map((item, idx) => {
              if ('day' in item && item.day) { // Ensure item.day is present
                return (
                  <Timeline.Item key={`${item.day}-${idx}`} title={item.day} bullet={getDayIcon(item.day)}>
                    <Text c="dimmed" size="sm">{item.summary}</Text>
                    <Text size="xs" mt={4}>Focus: {item.focus}</Text>
                  </Timeline.Item>
                );
              }
              // Handle ErrorSummary or other non-day items
              const errorItem = item as ErrorSummary;
              return (
                <Timeline.Item key={`error-${idx}`} title={errorItem.title || "Info"} bullet={<IconX size={12} color="red" />}>
                  <Text c="dimmed" size="sm">{errorItem.description || "No details."}</Text>
                </Timeline.Item>
              );
            })}
          </Timeline>
        )}
      </Card>
    </Container>
  );
}

