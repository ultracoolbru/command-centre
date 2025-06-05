import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { AuthProvider } from '@/lib/auth-context';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';

const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'Inter, sans-serif',
  components: {
    Button: {
      defaultProps: {
        size: 'md',
      },
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Notifications position="top-right" />
      <AuthProvider>{children}</AuthProvider>
    </MantineProvider>
  );
}
