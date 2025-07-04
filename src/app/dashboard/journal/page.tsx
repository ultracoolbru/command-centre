"use client";

import { Center, Container, Loader, Text, Title } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function JournalRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the bullet journal page which is now the main journal
        router.replace('/dashboard/bullet');
    }, [router]);

    return (
        <Container size={800} my={40}>
            <Center>
                <div>
                    <Title ta="center" fw={900} mb="md">
                        Redirecting...
                    </Title>
                    <Text c="dimmed" size="sm" ta="center" mb="xl">
                        Taking you to the new unified journal experience
                    </Text>
                    <Center>
                        <Loader size="md" />
                    </Center>
                </div>
            </Center>
        </Container>
    );
}