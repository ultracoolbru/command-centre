"use client";

import MotivationQuotes from '@/components/MotivationQuotes';
import { useAuth } from '@/lib/auth-context';
import { AppShell, Avatar, Box, Burger, Container, Group, Menu, NavLink, ScrollArea, Text, UnstyledButton, rem, useMantineTheme } from '@mantine/core';
import { useMediaQuery, useViewportSize } from '@mantine/hooks';
import { IconBell, IconBook, IconBulb, IconCalendarTime, IconChecklist, IconCode, IconHeartRateMonitor, IconLogout, IconSettings, IconTerminal, IconUser } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getUserProfile } from './profile/actions';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const theme = useMantineTheme();
  const [opened, setOpened] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logOut } = useAuth();
  const { height, width } = useViewportSize();

  // Multiple breakpoints for better responsive design
  const isSmallMobile = useMediaQuery('(max-width: 480px)');
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');

  // Fetch user profile data including avatar URL
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.uid) {
        try {
          const result = await getUserProfile(user.uid);
          if (result.success && result.profile?.avatarUrl) {
            setAvatarUrl(result.profile.avatarUrl);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [user?.uid]);

  // Auto-close navbar on mobile when clicking outside
  useEffect(() => {
    if (isMobile && opened) {
      const handleClickOutside = () => setOpened(false);
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMobile, opened]);

  const handleLogout = async () => {
    await logOut();
    router.push('/auth/login');
  };

  const navItems = [
    { label: 'Daily Planner', icon: <IconCalendarTime size="1.2rem" stroke={1.5} />, path: '/dashboard/daily' },
    { label: 'Tasks & Goals', icon: <IconChecklist size="1.2rem" stroke={1.5} />, path: '/dashboard/tasks' },
    { label: 'Health Tracker', icon: <IconHeartRateMonitor size="1.2rem" stroke={1.5} />, path: '/dashboard/health' },
    { label: 'Bullet Journal', icon: <IconBook size="1.2rem" stroke={1.5} />, path: '/dashboard/bullet' },
    { label: 'Projects', icon: <IconCode size="1.2rem" stroke={1.5} />, path: '/dashboard/projects' },
    { label: 'Echo CLI', icon: <IconTerminal size="1.2rem" stroke={1.5} />, path: '/dashboard/echo' },
    { label: 'AI Insights', icon: <IconBulb size="1.2rem" stroke={1.5} />, path: '/dashboard/ai' },
    { label: 'Reminders', icon: <IconBell size="1.2rem" stroke={1.5} />, path: '/dashboard/reminders' },
    { label: 'Settings', icon: <IconSettings size="1.2rem" stroke={1.5} />, path: '/dashboard/settings' },
    { label: 'Profile', icon: <IconUser size="1.2rem" stroke={1.5} />, path: '/dashboard/profile' },
    { label: 'Logout', icon: <IconLogout size="1.2rem" stroke={1.5} />, path: '/auth/login', onClick: handleLogout }
  ];

  return (
    <AppShell
      padding="md"
      navbar={{
        width: { base: 200, sm: 250, md: 300 },
        breakpoint: 'sm',
        collapsed: { mobile: !opened }
      }}
      header={{ height: 60 }}
      styles={{
        main: {
          backgroundColor: 'var(--mantine-color-dark-7)',
          minHeight: '100vh'
        },
        navbar: {
          backgroundColor: 'var(--mantine-color-dark-6)',
          borderRight: '1px solid var(--mantine-color-dark-4)'
        },
        header: {
          backgroundColor: 'var(--mantine-color-dark-6)',
          borderBottom: '1px solid var(--mantine-color-dark-4)'
        }
      }}
    >
      <AppShell.Navbar
        p="md"
        w={{ base: '100%', sm: 200, lg: 300 }}
        role="navigation"
        aria-label="Main navigation"
        id="main-navigation"
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
                onClick={() => {
                  if (item.onClick) {
                    item.onClick();
                  }
                  setOpened(false);
                }}
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
                    color: 'var(--mantine-color-gray-0)',
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--mantine-color-dark-5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Group>
                    <Avatar radius="xl" color="blue" src={avatarUrl}>
                      {!avatarUrl && (user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U')}
                    </Avatar>
                    <div style={{ flex: 1 }}>
                      <Text size="sm" fw={500} c="white">
                        {user?.email || 'User'}
                      </Text>
                    </div>
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconUser color={user?.emailVerified ? 'green' : 'red'} style={{ width: rem(14), height: rem(14) }} />}>
                  <Link href="/dashboard/profile">
                    Profile
                  </Link>
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
              color="white"
              mr="xl"
              aria-label={opened ? 'Close navigation' : 'Open navigation'}
              aria-expanded={opened}
              aria-controls="main-navigation"
            />
          )}
          <Text component="h1" fw={700} size="lg" c="white">Command Dashboard</Text>
        </div>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="xl" px="md">
          <MotivationQuotes />
          {children}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
