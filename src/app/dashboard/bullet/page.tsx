"use client";

import { Container, Text, Title } from '@mantine/core';

export default function BulletJournalPage() {
    return (
        <Container size={800} my={40}>
            <Title ta="center" fw={900} mb="md">
                Bullet Journal
            </Title>
            <Text c="dimmed" size="sm" ta="center" mb="xl">
                Quick capture and organize your thoughts, tasks, and events
            </Text>

            {/* TODO: Implement bullet journal functionality */}
            <Text ta="center" c="dimmed">
                Bullet Journal feature coming soon...
            </Text>
        </Container>
    );
}