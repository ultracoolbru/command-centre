import { ComponentType, useEffect, useState } from 'react';
import { Loader, Center } from '@mantine/core';

interface LazyLoadProps {
  load: () => Promise<{ default: ComponentType<any> }>;
  loading?: React.ReactNode;
  [key: string]: any;
}

export function LazyLoad({ load, loading: Loading, ...props }: LazyLoadProps) {
  const [Component, setComponent] = useState<ComponentType<any> | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadComponent = async () => {
      try {
        const module = await load();
        if (isMounted) {
          setComponent(() => module.default);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load component'));
        }
      }
    };

    loadComponent();

    return () => {
      isMounted = false;
    };
  }, [load]);

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Error loading component. Please try again later.</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!Component) {
    return Loading || (
      <Center style={{ height: '200px' }}>
        <Loader />
      </Center>
    );
  }

  return <Component {...props} />;
}
