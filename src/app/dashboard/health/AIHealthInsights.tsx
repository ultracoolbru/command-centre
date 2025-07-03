import { Button, Card, Group, Loader, Paper, Text, Title } from '@mantine/core';
import { useState } from 'react';

type Insight = { title: string; description: string };
interface AIHealthInsightsProps {
    userId: string;
    weekStartDate: string;
}
export default function AIHealthInsights({ userId, weekStartDate }: AIHealthInsightsProps) {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch health logs and generate AI insights on demand
    const fetchInsights = async () => {
        if (!userId || !weekStartDate) return;
        setLoading(true);
        setError(null);
        try {
            console.log('Fetching health logs for userId:', userId, 'weekStartDate:', weekStartDate);
            const weekRes = await fetch(`/api/healthlog/week?userId=${userId}&date=${weekStartDate}`);
            const weekData = await weekRes.json();
            console.log('Week health data response:', weekData);

            if (!weekData.success || !Array.isArray(weekData.logs)) {
                throw new Error('No health data found for this week');
            }

            if (weekData.logs.length === 0) {
                throw new Error('No health entries found for this week. Please log some health data first.');
            }

            console.log('Sending to AI insights:', { userId, category: 'health', data: weekData.logs });
            const aiRes = await fetch('/api/gemini/insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, category: 'health', data: weekData.logs }),
            });
            const aiData = await aiRes.json();
            console.log('AI insights response:', aiData);

            if (aiData?.insights && Array.isArray(aiData.insights)) {
                setInsights(aiData.insights);
            } else {
                throw new Error(aiData?.error || 'No insights generated');
            }
        } catch (e: any) {
            console.error('Error fetching insights:', e);
            setError(e.message || 'Failed to load insights');
        } finally {
            setLoading(false);
        }
    };

    // Render insights inside a single Card with consistent UI
    return (
        <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
            <Group justify="space-between" align="center" mb="md">
                <Title order={2}>AI Health Insights</Title>
                <Button variant="outline" size="sm" onClick={fetchInsights} loading={loading} disabled={!userId || !weekStartDate}>
                    {loading ? 'Generating...' : 'Generate AI Insights'}
                </Button>
            </Group>
            {loading && (
                <Group justify="center" mb="md">
                    <Loader size="sm" />
                    <Text ml="sm">Generating AI insights...</Text>
                </Group>
            )}
            {error && (
                <Text c="red" mb="md">
                    {error}
                </Text>
            )}
            {!loading && !error && insights.length === 0 && (
                <Text c="dimmed" mb="md">
                    No AI insights available for this week.
                </Text>
            )}
            {!loading && !error && insights.map((insight, idx) => (
                <Paper withBorder p="md" radius="md" mb="md" key={idx}>
                    <Text w={500}>{insight.title}</Text>
                    <Text style={{ fontStyle: 'italic' }}>{insight.description}</Text>
                </Paper>
            ))}
        </Card>
    );
}
