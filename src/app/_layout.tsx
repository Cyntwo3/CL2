import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { ActivityIndicator, useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import SetupScreen from '@/components/setup-screen';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { ChildModeProvider } from '@/contexts/child-mode-context';

function RootContent() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#212121' }}>
        <ActivityIndicator size="large" color="#10a37f" />
      </View>
    );
  }

  if (!session) {
    return <SetupScreen />;
  }

  return (
    <ChildModeProvider>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ChildModeProvider>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <RootContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
