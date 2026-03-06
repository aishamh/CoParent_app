import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, PublicRoute } from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import Home from "@/pages/Home";
import CalendarPage from "@/pages/CalendarPage";
import ActivitiesPage from "@/pages/ActivitiesPage";
import SocialPage from "@/pages/SocialPage";
import EducationPage from "@/pages/EducationPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ExpensesPage from "@/pages/ExpensesPage";
import MessagesPage from "@/pages/MessagesPage";
import DocumentsPage from "@/pages/DocumentsPage";
import SettingsPage from "@/pages/SettingsPage";
import OnboardingPage from "@/pages/OnboardingPage";
import DiscoverPage from "@/pages/DiscoverPage";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/">
        <PublicRoute><LandingPage /></PublicRoute>
      </Route>
      <Route path="/login">
        <PublicRoute><LoginPage /></PublicRoute>
      </Route>
      <Route path="/register">
        <PublicRoute><RegisterPage /></PublicRoute>
      </Route>

      {/* Protected routes */}
      <Route path="/dashboard">
        <ProtectedRoute><Home /></ProtectedRoute>
      </Route>
      <Route path="/calendar">
        <ProtectedRoute><CalendarPage /></ProtectedRoute>
      </Route>
      <Route path="/messages">
        <ProtectedRoute><MessagesPage /></ProtectedRoute>
      </Route>
      <Route path="/expenses">
        <ProtectedRoute><ExpensesPage /></ProtectedRoute>
      </Route>
      <Route path="/documents">
        <ProtectedRoute><DocumentsPage /></ProtectedRoute>
      </Route>
      <Route path="/activities">
        <ProtectedRoute><ActivitiesPage /></ProtectedRoute>
      </Route>
      <Route path="/discover">
        <ProtectedRoute><DiscoverPage /></ProtectedRoute>
      </Route>
      <Route path="/social">
        <ProtectedRoute><SocialPage /></ProtectedRoute>
      </Route>
      <Route path="/education">
        <ProtectedRoute><EducationPage /></ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute><SettingsPage /></ProtectedRoute>
      </Route>
      <Route path="/onboarding">
        <ProtectedRoute><OnboardingPage /></ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider delayDuration={0}>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
