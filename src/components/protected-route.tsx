"use client";

import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader, Center } from '@mantine/core';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && !pathname.includes('/auth/')) {
      router.push('/auth/login');
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <Center style={{ height: '100vh' }}>
        <Loader size="xl" />
      </Center>
    );
  }

  if (!user && !pathname.includes('/auth/')) {
    return null;
  }

  return <>{children}</>;
}
