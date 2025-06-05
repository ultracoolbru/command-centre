import { Suspense, ComponentType, ReactNode } from 'react';
import { Center, Loader } from '@mantine/core';

export function withSuspense<T extends object>(
  Component: ComponentType<T>,
  fallback: ReactNode = (
    <Center style={{ height: '100vh' }}>
      <Loader />
    </Center>
  )
) {
  return function WithSuspense(props: T) {
    return (
      <Suspense fallback={fallback}>
        <Component {...props} />
      </Suspense>
    );
  };
}
