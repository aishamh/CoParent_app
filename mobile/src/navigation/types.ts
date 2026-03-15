import type { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  Profile: undefined;
  Children: undefined;
  Invite: undefined;
};

export type MainTabsParamList = {
  Home: undefined;
  Calendar: undefined;
  Messages: undefined;
  Discover: undefined;
  More: undefined;
};

export type ScreensStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabsParamList>;
  Expenses: undefined;
  Documents: undefined;
  Education: undefined;
  Social: undefined;
  Settings: undefined;
  ParentingPlan: undefined;
  ExchangeTracking: undefined;
  CustodySchedule: undefined;
  ExportHistory: undefined;
  ProfessionalAccess: undefined;
  PhotoAlbums: undefined;
  PhotoAlbumDetail: { albumId: string; albumTitle: string };
  ChildInfoBank: undefined;
  PrivateJournal: undefined;
  SchoolIntegration: undefined;
  CommunityEvents: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<ScreensStackParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
