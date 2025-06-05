"use client";

import { AppShell, Text, Burger, useMantineTheme, NavLink, Group, Avatar, Menu, UnstyledButton, rem, Box, ScrollArea } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { IconCalendarTime, IconChecklist, IconHeartRateMonitor, IconNotebook, IconCode, IconBulb, IconTerminal, IconLogout, IconUser } from '@tabler/icons-react';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const theme = useMantineTheme();
  const [opened, setOpened] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logOut } = useAuth();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleLogout = async () => {
    await logOut();
    router.push('/auth/login');
  };

  const navItems = [
    { label: 'Daily Planner', icon: <IconCalendarTime size="1.2rem" stroke={1.5} />, path: '/dashboard/daily' },
    { label: 'Tasks & Goals', icon: <IconChecklist size="1.2rem" stroke={1.5} />, path: '/dashboard/tasks' },
    { label: 'Health Tracker', icon: <IconHeartRateMonitor size="1.2rem" stroke={1.5} />, path: '/dashboard/health' },
    { label: 'Journal', icon: <IconNotebook size="1.2rem" stroke={1.5} />, path: '/dashboard/journal' },
    { label: 'Violt Development', icon: <IconCode size="1.2rem" stroke={1.5} />, path: '/dashboard/violt' },
    { label: 'AI Insights', icon: <IconBulb size="1.2rem" stroke={1.5} />, path: '/dashboard/ai' },
    { label: 'Echo CLI', icon: <IconTerminal size="1.2rem" stroke={1.5} />, path: '/dashboard/echo' },
  ];

  return (
    <AppShell
      padding="md"
      navbar={{ width: { sm: 200, lg: 300 }, breakpoint: 'md' }}
      header={{ height: 60 }}
      styles={{
        main: (theme: any) => ({
          backgroundColor: theme.colorScheme === 'dark'
            ? theme.colors.dark[8]
            : theme.colors.gray[0]
        })
      }}
    >
      <AppShell.Navbar
        p="md"
        hidden={!opened}
        w={{ base: '100%', sm: 200, lg: 300 }}
        role="navigation"
        aria-label="Main navigation"
      >
        <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <ScrollArea style={{ flex: 1 }}>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                label={item.label}
                leftSection={item.icon}
                active={pathname === item.path}
                component={Link}
                href={item.path}
                onClick={() => setOpened(false)}
                style={{ marginBottom: '0.5rem' }}
              />
            ))}
          </ScrollArea>
          <div style={{ padding: '1rem 0' }} role="region" aria-label="User menu">
            <Menu position="top" withArrow>
              <Menu.Target>
                <UnstyledButton
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: theme.spacing.xs,
                    borderRadius: theme.radius.sm,
                    color: theme.colors.dark[0],
                  }}
                >
                  <Group>
                    <Avatar radius="xl" color="blue">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                    <div style={{ flex: 1 }}>
                      <Text size="sm" fw={500}>
                        {user?.email || 'User'}
                      </Text>
                    </div>
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconUser style={{ width: rem(14), height: rem(14) }} />}>
                  Profile
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconLogout style={{ width: rem(14), height: rem(14) }} />}
                  onClick={handleLogout}
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </div>
        </Box>
      </AppShell.Navbar>
      <AppShell.Header role="banner">
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          {isMobile && (
            <Burger
              opened={opened}
              onClick={() => setOpened((o) => !o)}
              size="sm"
              color={theme.colors.gray[6]}
              mr="xl"
              aria-label={opened ? 'Close navigation' : 'Open navigation'}
              aria-expanded={opened}
              aria-controls="main-navigation"
            />
          )}
          <Text component="h1" fw={700} size="lg">Command Dashboard</Text>
        </div>
      </AppShell.Header>
      {children}
    </AppShell>
  );
}
