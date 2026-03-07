import React from "react";
import { StatusBar, ActivityIndicator, View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClientProvider } from "@tanstack/react-query";
import Icon from "react-native-vector-icons/Feather";

import { queryClient } from "./src/api/queryClient";
import { AuthProvider } from "./src/auth/AuthContext";
import { ThemeProvider } from "./src/theme/ThemeContext";
import { useTheme } from "./src/theme/useTheme";
import { useAuth } from "./src/auth/useAuth";
import { ErrorBoundary } from "./src/components/shared/ErrorBoundary";

import LoginScreen from "./src/screens/auth/LoginScreen";
import RegisterScreen from "./src/screens/auth/RegisterScreen";
import WelcomeScreen from "./src/screens/onboarding/WelcomeScreen";
import ProfileSetupScreen from "./src/screens/onboarding/ProfileSetupScreen";
import ChildrenSetupScreen from "./src/screens/onboarding/ChildrenSetupScreen";
import InviteScreen from "./src/screens/onboarding/InviteScreen";
import DashboardScreen from "./src/screens/tabs/DashboardScreen";
import CalendarScreen from "./src/screens/tabs/CalendarScreen";
import MessagesScreen from "./src/screens/tabs/MessagesScreen";
import DiscoverScreen from "./src/screens/tabs/DiscoverScreen";
import MoreScreen from "./src/screens/tabs/MoreScreen";
import ExpensesScreen from "./src/screens/ExpensesScreen";
import DocumentsScreen from "./src/screens/DocumentsScreen";
import EducationScreen from "./src/screens/EducationScreen";
import SocialScreen from "./src/screens/SocialScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

import type {
  RootStackParamList,
  AuthStackParamList,
  OnboardingStackParamList,
  MainTabsParamList,
  ScreensStackParamList,
} from "./src/navigation/types";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const MainStack = createNativeStackNavigator<ScreensStackParamList>();
const Tab = createBottomTabNavigator<MainTabsParamList>();

const TEAL = "#0d9488";
const BACKGROUND = "#FDFAF5";

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator
      screenOptions={{ headerShown: false, gestureEnabled: false }}
    >
      <OnboardingStack.Screen name="Welcome" component={WelcomeScreen} />
      <OnboardingStack.Screen name="Profile" component={ProfileSetupScreen} />
      <OnboardingStack.Screen name="Children" component={ChildrenSetupScreen} />
      <OnboardingStack.Screen name="Invite" component={InviteScreen} />
    </OnboardingStack.Navigator>
  );
}

function TabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0.5,
          borderTopColor: colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => (
            <Icon name="message-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="compass" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="menu" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerTintColor: TEAL,
        headerStyle: { backgroundColor: BACKGROUND },
        headerShadowVisible: false,
      }}
    >
      <MainStack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <MainStack.Screen name="Expenses" component={ExpensesScreen} />
      <MainStack.Screen name="Documents" component={DocumentsScreen} />
      <MainStack.Screen name="Education" component={EducationScreen} />
      <MainStack.Screen name="Social" component={SocialScreen} />
      <MainStack.Screen name="Settings" component={SettingsScreen} />
    </MainStack.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={TEAL} />
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <RootStack.Screen name="Main" component={MainNavigator} />
          <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
        </>
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
}

function ThemedApp() {
  const { effectiveTheme } = useTheme();

  return (
    <>
      <StatusBar
        barStyle={effectiveTheme === "dark" ? "light-content" : "dark-content"}
      />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ErrorBoundary>
              <AuthProvider>
                <ThemedApp />
              </AuthProvider>
            </ErrorBoundary>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BACKGROUND,
  },
});
