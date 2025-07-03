"use client";

import { ActionIcon, Box, Card, Group, Text, Transition } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconChevronLeft, IconChevronRight, IconRefresh } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

interface Quote {
    text: string;
    author: string;
    id: string;
}

const STORAGE_KEY = 'motivation-quotes';
const QUOTES_PER_FETCH = 10;
const PRELOAD_THRESHOLD = 5; // When to fetch more quotes

// Minimal emergency fallbacks (only used if all systems fail)
const EMERGENCY_FALLBACKS: Quote[] = [
    {
        id: 'emergency-1',
        text: "Every moment is a fresh beginning.",
        author: "T.S. Eliot"
    },
    {
        id: 'emergency-2',
        text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        author: "Winston Churchill"
    },
    {
        id: 'emergency-3',
        text: "The only way to do great work is to love what you do.",
        author: "Steve Jobs"
    }
];

export default function MotivationQuotes() {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Responsive breakpoints
    const isSmallMobile = useMediaQuery('(max-width: 480px)');
    const isMobile = useMediaQuery('(max-width: 768px)');
    const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');

    // Load quotes from storage or fetch new ones
    useEffect(() => {
        loadQuotes();
    }, []);

    // Check if we need to fetch more quotes when scrolling
    useEffect(() => {
        if (quotes.length > 0 && currentIndex >= quotes.length - PRELOAD_THRESHOLD) {
            fetchMoreQuotes();
        }
    }, [currentIndex, quotes.length]);

    const loadQuotes = async () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsedQuotes = JSON.parse(stored);
                if (parsedQuotes.length > 0) {
                    setQuotes(parsedQuotes);
                    return;
                }
            }
            // If no stored quotes, fetch initial set
            await fetchInitialQuotes();
        } catch (error) {
            console.error('Error loading quotes:', error);
            // Use emergency fallbacks if everything fails
            setQuotes(EMERGENCY_FALLBACKS);
        }
    };

    const fetchInitialQuotes = async () => {
        setIsLoading(true);
        try {
            // Try AI quotes first
            const aiQuotes = await fetchAIQuotes(QUOTES_PER_FETCH);
            if (aiQuotes.length > 0) {
                setQuotes(aiQuotes);
                saveQuotesToStorage(aiQuotes);
                return;
            }

            // If AI fails, try external API quotes
            const apiQuotes = await fetchQuotesFromAPI(QUOTES_PER_FETCH);
            setQuotes(apiQuotes);
            saveQuotesToStorage(apiQuotes);
        } catch (error) {
            console.error('Error fetching initial quotes:', error);
            // Use emergency fallbacks only if everything fails
            setQuotes(EMERGENCY_FALLBACKS);
            saveQuotesToStorage(EMERGENCY_FALLBACKS);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMoreQuotes = async () => {
        if (isLoading) return;

        setIsLoading(true);
        try {
            // Try AI quotes first
            let newQuotes = await fetchAIQuotes(QUOTES_PER_FETCH);
            if (newQuotes.length === 0) {
                // Fallback to external API
                newQuotes = await fetchQuotesFromAPI(QUOTES_PER_FETCH);
            }

            const updatedQuotes = [...quotes, ...newQuotes];
            setQuotes(updatedQuotes);
            saveQuotesToStorage(updatedQuotes);
        } catch (error) {
            console.error('Error fetching more quotes:', error);

            // Generate additional AI fallback quotes with variations
            const additionalFallbacks = EMERGENCY_FALLBACKS.map((quote: Quote, index: number) => ({
                ...quote,
                id: `${quote.id}-additional-${Date.now()}-${index}`,
                // Add some variety to repeated fallbacks
                text: index % 2 === 0 ? quote.text : `${quote.text} Remember, every day is a new opportunity to grow.`,
            }));

            const updatedQuotes = [...quotes, ...additionalFallbacks];
            setQuotes(updatedQuotes);
            saveQuotesToStorage(updatedQuotes);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchQuotesFromAPI = async (count: number): Promise<Quote[]> => {
        const fetchedQuotes: Quote[] = [];

        // Try multiple quote sources for better reliability
        const quoteSources = [
            () => fetch('https://api.quotable.io/random?minLength=50&maxLength=200'),
            () => fetch('https://quotegarden.com/api/v3/quotes/random'),
            () => fetch('https://api.quotable.io/random') // Fallback without length restrictions
        ];

        for (let i = 0; i < count; i++) {
            let quoteAdded = false;

            // Try different sources
            for (const fetchSource of quoteSources) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

                    const response = await fetchSource().catch(() => null);
                    clearTimeout(timeoutId);

                    if (response && response.ok) {
                        const data = await response.json();

                        // Handle different API response formats
                        let quoteText = data.content || data.quoteText || data.text;
                        let quoteAuthor = data.author || data.quoteAuthor || 'Unknown';

                        if (quoteText && quoteText.length >= 20) {
                            fetchedQuotes.push({
                                id: data._id || data.id || `quote-${Date.now()}-${i}`,
                                text: quoteText,
                                author: quoteAuthor
                            });
                            quoteAdded = true;
                            break; // Successfully got a quote, move to next
                        }
                    }
                } catch (error) {
                    console.warn(`Quote source failed:`, error);
                    continue; // Try next source
                }
            }

            // If all sources failed, use emergency fallback
            if (!quoteAdded) {
                const fallbackIndex = i % EMERGENCY_FALLBACKS.length;
                fetchedQuotes.push({
                    ...EMERGENCY_FALLBACKS[fallbackIndex],
                    id: `fallback-${Date.now()}-${i}`
                });
            }

            // Small delay to avoid rate limiting
            if (i < count - 1) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }

        // Ensure we always return at least some quotes
        if (fetchedQuotes.length === 0) {
            return EMERGENCY_FALLBACKS.slice(0, count).map((quote: Quote, index: number) => ({
                ...quote,
                id: `emergency-fallback-${Date.now()}-${index}`
            }));
        }

        return fetchedQuotes;
    };

    const fetchAIQuotes = async (count: number): Promise<Quote[]> => {
        try {
            const response = await fetch(`/api/quotes?count=${count}&theme=daily motivation`);
            if (!response.ok) {
                throw new Error('AI quotes API request failed');
            }

            const data = await response.json();
            if (data.success && data.quotes && Array.isArray(data.quotes)) {
                return data.quotes;
            } else {
                throw new Error('Invalid AI quotes response');
            }
        } catch (error) {
            console.error('Error fetching AI quotes:', error);
            return []; // Return empty array, let caller handle fallback
        }
    };

    const saveQuotesToStorage = (quotesToSave: Quote[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(quotesToSave));
        } catch (error) {
            console.error('Error saving quotes to storage:', error);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentIndex(currentIndex - 1);
                setIsTransitioning(false);
            }, 150);
        }
    };

    const handleNext = () => {
        if (currentIndex < quotes.length - 1) {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentIndex(currentIndex + 1);
                setIsTransitioning(false);
            }, 150);
        }
    };

    const handleRefresh = async () => {
        setIsLoading(true);
        try {
            const newQuotes = await fetchQuotesFromAPI(QUOTES_PER_FETCH);
            setQuotes(newQuotes);
            setCurrentIndex(0);
            saveQuotesToStorage(newQuotes);
        } catch (error) {
            console.error('Error refreshing quotes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (quotes.length === 0) {
        return (
            <Card
                shadow="sm"
                padding={isSmallMobile ? "sm" : isMobile ? "md" : "lg"}
                radius="md"
                withBorder
                style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    marginBottom: '1rem',
                    minHeight: isSmallMobile ? '60px' : '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Text ta="center" size={isSmallMobile ? "xs" : "sm"}>Loading motivation...</Text>
            </Card>
        );
    }

    const currentQuote = quotes[currentIndex];

    return (
        <Card
            shadow="sm"
            padding={isSmallMobile ? "sm" : isMobile ? "md" : "lg"}
            radius="md"
            withBorder
            style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                marginBottom: '1rem',
                position: 'relative',
                overflow: 'hidden',
                minHeight: isSmallMobile ? '80px' : '100px'
            }}
        >
            {/* Background decoration - adjust for mobile */}
            <Box
                style={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: isSmallMobile ? 60 : 100,
                    height: isSmallMobile ? 60 : 100,
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '50%',
                    zIndex: 0
                }}
            />
            <Box
                style={{
                    position: 'absolute',
                    bottom: -30,
                    left: -30,
                    width: isSmallMobile ? 50 : 80,
                    height: isSmallMobile ? 50 : 80,
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '50%',
                    zIndex: 0
                }}
            />

            <Group
                justify="space-between"
                align="flex-start"
                style={{ position: 'relative', zIndex: 1 }}
                gap={isSmallMobile ? "xs" : "sm"}
            >
                <ActionIcon
                    variant="transparent"
                    color="white"
                    size={isSmallMobile ? "md" : "lg"}
                    onClick={handlePrevious}
                    disabled={currentIndex === 0 || isLoading}
                    style={{
                        opacity: currentIndex === 0 ? 0.3 : 1,
                        minWidth: isSmallMobile ? '32px' : '40px'
                    }}
                >
                    <IconChevronLeft size={isSmallMobile ? "1rem" : "1.2rem"} />
                </ActionIcon>

                <Box style={{
                    flex: 1,
                    padding: isSmallMobile ? '0 0.5rem' : '0 1rem',
                    minWidth: 0 // Ensures text can wrap
                }}>
                    <Transition
                        mounted={!isTransitioning}
                        transition="fade"
                        duration={300}
                        timingFunction="ease"
                    >
                        {(styles) => (
                            <div style={styles}>
                                <Text
                                    size={isSmallMobile ? "xs" : isMobile ? "sm" : "md"}
                                    fw={500}
                                    ta="center"
                                    style={{
                                        lineHeight: 1.4,
                                        marginBottom: '0.5rem',
                                        fontStyle: 'italic',
                                        wordWrap: 'break-word',
                                        hyphens: 'auto'
                                    }}
                                >
                                    "{currentQuote?.text}"
                                </Text>
                                <Text
                                    size={isSmallMobile ? "xs" : "sm"}
                                    ta="center"
                                    style={{
                                        opacity: 0.9,
                                        fontWeight: 600,
                                        wordWrap: 'break-word'
                                    }}
                                >
                                    — {currentQuote?.author}
                                </Text>
                            </div>
                        )}
                    </Transition>

                    <Group justify="center" mt="xs" gap="xs">
                        {quotes.slice(Math.max(0, currentIndex - 2), currentIndex + 3).map((_, idx) => {
                            const actualIndex = Math.max(0, currentIndex - 2) + idx;
                            return (
                                <Box
                                    key={actualIndex}
                                    style={{
                                        width: actualIndex === currentIndex ? (isSmallMobile ? 8 : 12) : (isSmallMobile ? 4 : 6),
                                        height: isSmallMobile ? 4 : 6,
                                        borderRadius: 3,
                                        background: actualIndex === currentIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
                                        transition: 'all 0.3s ease'
                                    }}
                                />
                            );
                        })}
                        {isLoading && (
                            <Box
                                style={{
                                    width: isSmallMobile ? 4 : 6,
                                    height: isSmallMobile ? 4 : 6,
                                    borderRadius: 3,
                                    background: 'rgba(255, 255, 255, 0.5)',
                                    animation: 'pulse 1.5s ease-in-out infinite'
                                }}
                            />
                        )}
                    </Group>
                </Box>

                <Group gap={isSmallMobile ? "4px" : "xs"}>
                    <ActionIcon
                        variant="transparent"
                        color="white"
                        size={isSmallMobile ? "xs" : "sm"}
                        onClick={handleRefresh}
                        loading={isLoading}
                        title="Refresh quotes"
                        style={{ minWidth: isSmallMobile ? '24px' : '32px' }}
                    >
                        <IconRefresh size={isSmallMobile ? "0.8rem" : "1rem"} />
                    </ActionIcon>
                    <ActionIcon
                        variant="transparent"
                        color="white"
                        size={isSmallMobile ? "md" : "lg"}
                        onClick={handleNext}
                        disabled={currentIndex === quotes.length - 1 || isLoading}
                        style={{
                            opacity: currentIndex === quotes.length - 1 ? 0.3 : 1,
                            minWidth: isSmallMobile ? '32px' : '40px'
                        }}
                    >
                        <IconChevronRight size={isSmallMobile ? "1rem" : "1.2rem"} />
                    </ActionIcon>
                </Group>
            </Group>

            <Text
                size="xs"
                ta="right"
                mt="xs"
                style={{
                    opacity: 0.7,
                    position: 'relative',
                    zIndex: 1,
                    fontSize: isSmallMobile ? '0.6rem' : '0.75rem'
                }}
            >
                {currentIndex + 1} of {quotes.length}
                {isLoading && ' • Loading...'}
            </Text>

            <style jsx global>{`
                @keyframes pulse {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
            `}</style>
        </Card>
    );
}
function fetchAIFallbackQuotes() {
    throw new Error('Function not implemented.');
}

