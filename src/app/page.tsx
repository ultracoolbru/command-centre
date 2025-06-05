'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader, Center } from '@mantine/core';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard/daily');
      } else {
        router.push('/auth/login');
      }
    }
  }, [user, loading, router]);

  return (
    <Center style={{ height: '100vh' }}>
      <Loader size="xl" />
    </Center>
  );
}
