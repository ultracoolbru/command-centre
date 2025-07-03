import ErrorBoundary from '@/components/ErrorBoundary';
import { GlobalVoiceCommands } from '@/components/global-voice-commands';
import ProtectedRoute from '@/components/protected-route';
import { Providers } from '@/components/providers';
import { Notifications } from '@mantine/notifications';
import { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Command Dashboard</title>
        <meta name="description" content="Personal life management dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body style={{ backgroundColor: 'var(--mantine-color-dark-7)', color: 'var(--mantine-color-gray-0)', margin: 0, padding: 0 }}>
        <Providers>
          <ErrorBoundary>
            <Notifications />
            <ProtectedRoute>
              <GlobalVoiceCommands>
                {children}
              </GlobalVoiceCommands>
            </ProtectedRoute>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
