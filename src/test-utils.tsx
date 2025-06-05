import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { MantineProvider, MantineThemeOverride } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { AuthProvider } from '@/lib/auth-context';

const theme: MantineThemeOverride = {
  colors: {
    blue: ['#eef3ff', '#dce4f5', '#b9c7e2', '#94a8d0', '#748dc1', '#5f7cb8', '#5474b4', '#44639f', '#39588f', '#2d4b81'],
  },
  primaryShade: 5,
  defaultRadius: 'sm',
};

interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  return (
    <MantineProvider theme={theme}>
      <Notifications />
      <AuthProvider>
        {children}
      </AuthProvider>
    </MantineProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
// eslint-disable-next-line import/export
export * from '@testing-library/react';

// Override render method
export { customRender as render };
