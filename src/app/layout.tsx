import { Providers } from '@/components/providers';
import ProtectedRoute from '@/components/protected-route';
import { GlobalVoiceCommands } from '@/components/global-voice-commands';
import { ReactNode } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Notifications } from '@mantine/notifications';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Command Dashboard</title>
        <meta name="description" content="Personal life management dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
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
