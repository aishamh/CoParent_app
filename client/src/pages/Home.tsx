import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  format,
  formatDistanceToNow,
  isSameDay,
  parseISO,
  differenceInHours,
  isAfter,
  isBefore,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  MapPin,
  Sun,
  Moon,
  Sunrise,
  ChevronRight,
  Plus,
  MessageSquare,
  DollarSign,
  FolderOpen,
  Compass,
  Sparkles,
  ArrowRight,
  Users,
  Clock,
  Heart,
  CheckCircle2,
  Rocket,
  Baby,
} from "lucide-react";
import ActivitySuggestions from "@/components/ActivitySuggestions";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";

// Hero image import -- the onError handler in the <img> tag handles load failures
import generatedImage from "@assets/generated_images/abstract_soft_shapes_representing_family_harmony.png";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OnboardingData {
  parentAName: string;
  parentBName: string;
  familyDisplayName: string;
  householdType: "single" | "two" | "";
  children: {
    id: string;
    name: string;
    age: number | "";
    gender: string;
    interests: string[];
  }[];
  goals: {
    childId: string;
    academic: string;
    lifeSkills: string;
    hobbies: string;
  }[];
  custodySchedule: {
    pattern: "every_weekend" | "every_other_week" | "custom_split" | "";
    arrivalDay: string;
    arrivalTime: string;
    departureDay: string;
    departureTime: string;
    customPercentage: number;
    summerSplit: string;
    winterSplit: string;
    holidaySplit: string;
  };
}

interface TransformedEvent {
  id: number;
  childId: number | null;
  title: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  timeZone: string;
  parent: string;
  type: string;
  recurrence: string | null;
  recurrenceInterval: number;
  recurrenceEnd: string | null;
  recurrenceDays: string | null;
  description: string | null;
  location: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(): { text: string; icon: typeof Sun } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good Morning", icon: Sunrise };
  if (hour < 17) return { text: "Good Afternoon", icon: Sun };
  return { text: "Good Evening", icon: Moon };
}

function getOnboardingData(): OnboardingData | null {
  try {
    const raw = localStorage.getItem("onboarding_data");
    if (raw) return JSON.parse(raw) as OnboardingData;
  } catch {
    // ignore parse errors
  }
  return null;
}

function isOnboardingComplete(): boolean {
  return localStorage.getItem("onboarding_completed") === "true";
}

function getParentName(data: OnboardingData | null, user: { email?: string | null } | null): string {
  if (data?.parentAName) return data.parentAName;
  if (user?.email) return user.email.split("@")[0];
  return "there";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Determine which parent currently has custody and compute progress. */
function getCustodyInfo(
  data: OnboardingData | null,
  events: TransformedEvent[]
) {
  const now = new Date();

  // Try to find a handover-type event that brackets the current time
  const handovers = events
    .filter((e) => e.type === "handover" || e.type === "custody")
    .map((e) => ({
      ...e,
      date: parseISO(e.startDate),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // Find the last handover that already passed (current period start)
  const pastHandovers = handovers.filter((h) => isBefore(h.date, now));
  const futureHandovers = handovers.filter(
    (h) => isAfter(h.date, now) || isSameDay(h.date, now)
  );

  const currentHandover = pastHandovers[pastHandovers.length - 1];
  const nextHandover = futureHandovers[0];

  // Determine whose custody it currently is
  let currentParentLabel = data?.parentAName || "Parent A";
  if (currentHandover) {
    // The handover event's "parent" field indicates who it transitions TO
    currentParentLabel =
      currentHandover.parent === "A"
        ? data?.parentAName || "Parent A"
        : data?.parentBName || "Parent B";
  }

  // Compute progress between current and next handover
  let progress = 0;
  if (currentHandover && nextHandover) {
    const totalHours = differenceInHours(
      nextHandover.date,
      currentHandover.date
    );
    const elapsedHours = differenceInHours(now, currentHandover.date);
    progress =
      totalHours > 0
        ? Math.min(100, Math.max(0, (elapsedHours / totalHours) * 100))
        : 0;
  }

  return {
    currentParent: currentParentLabel,
    nextHandover,
    progress: Math.round(progress),
  };
}

// Stagger children for framer-motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
} as const;

// ---------------------------------------------------------------------------
// Quick Actions Configuration
// ---------------------------------------------------------------------------

function getQuickActions(onboardingDone: boolean) {
  const actions = [
    {
      label: "View Calendar",
      href: "/calendar",
      icon: CalendarIcon,
      color: "bg-blue-500/10 text-blue-600",
      iconBg: "bg-blue-500/10",
    },
    {
      label: "Send Message",
      href: "/messages",
      icon: MessageSquare,
      color: "bg-emerald-500/10 text-emerald-600",
      iconBg: "bg-emerald-500/10",
    },
    {
      label: "Log Expense",
      href: "/expenses",
      icon: DollarSign,
      color: "bg-amber-500/10 text-amber-600",
      iconBg: "bg-amber-500/10",
    },
    {
      label: "Upload Document",
      href: "/documents",
      icon: FolderOpen,
      color: "bg-violet-500/10 text-violet-600",
      iconBg: "bg-violet-500/10",
    },
    {
      label: "Discover Activities",
      href: "/discover",
      icon: Compass,
      color: "bg-pink-500/10 text-pink-600",
      iconBg: "bg-pink-500/10",
    },
  ];

  if (!onboardingDone) {
    actions.push({
      label: "Complete Setup",
      href: "/onboarding",
      icon: Rocket,
      color: "bg-orange-500/10 text-orange-600",
      iconBg: "bg-orange-500/10",
    });
  }

  return actions;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero skeleton */}
        <Skeleton className="h-52 w-full rounded-2xl" />
        {/* Status cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        {/* Events list */}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    </Layout>
  );
}

function OnboardingBanner() {
  return (
    <motion.div variants={itemVariants}>
      <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent shadow-none">
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-lg text-foreground">
              Welcome! Complete your setup
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Tell us about your family so we can personalize your experience
              with tailored schedules, activities, and more.
            </p>
          </div>
          <Link href="/onboarding">
            <Button className="rounded-full shadow-lg shadow-primary/20 whitespace-nowrap">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ChildCard({
  child,
}: {
  child: OnboardingData["children"][number];
}) {
  const interestColors = [
    "bg-blue-100 text-blue-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-pink-100 text-pink-700",
    "bg-violet-100 text-violet-700",
  ];

  return (
    <motion.div variants={itemVariants}>
      <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="flex items-start gap-4 p-5">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold text-sm">
              {getInitials(child.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-foreground truncate">
                {child.name}
              </h4>
              {child.age !== "" && (
                <Badge
                  variant="secondary"
                  className="shrink-0 text-xs font-normal"
                >
                  {child.age} {Number(child.age) === 1 ? "yr" : "yrs"}
                </Badge>
              )}
            </div>
            {child.interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {child.interests.slice(0, 4).map((interest, idx) => (
                  <span
                    key={interest}
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      interestColors[idx % interestColors.length]
                    )}
                  >
                    {interest}
                  </span>
                ))}
                {child.interests.length > 4 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    +{child.interests.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function Home() {
  const { user } = useAuth();
  const today = useMemo(() => new Date(), []);
  const [selectedEvent, setSelectedEvent] = useState<(TransformedEvent & { date: Date }) | null>(null);
  const [imageError, setImageError] = useState(false);
  const [onboardingData, setOnboardingData] =
    useState<OnboardingData | null>(null);
  const [onboardingDone, setOnboardingDone] = useState(true);

  // Load onboarding data from localStorage
  useEffect(() => {
    setOnboardingData(getOnboardingData());
    setOnboardingDone(isOnboardingComplete());
  }, []);

  // Greeting
  const greeting = useMemo(() => getGreeting(), []);
  const GreetingIcon = greeting.icon;
  const parentName = getParentName(onboardingData, user);
  // Fetch events
  const {
    data: events = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      try {
        const events = await api.getEvents();
        return events.map(
          (e): TransformedEvent => ({
            id: e.id,
            childId: e.child_id || null,
            title: e.title || "",
            startDate: e.start_date || "",
            endDate: e.end_date || "",
            startTime: e.start_time || "",
            endTime: e.end_time || "",
            timeZone: e.time_zone || "",
            parent: e.parent || "A",
            type: e.type || "handover",
            recurrence: e.recurrence || "none",
            recurrenceInterval: e.recurrence_interval || 1,
            recurrenceEnd: e.recurrence_end || null,
            recurrenceDays: e.recurrence_days || null,
            description: e.description || null,
            location: e.location || null,
            createdAt: e.created_at || "",
          })
        );
      } catch (err) {
        console.error("Error fetching events:", err);
        return [];
      }
    },
  });

  // Fetch children from API (fallback to onboarding data)
  const { data: apiChildren = [] } = useQuery({
    queryKey: ["children"],
    queryFn: async () => {
      try {
        const children = await api.getChildren();
        return children.map((c) => ({
          id: String(c.id),
          name: c.name || "",
          age: c.age ?? ("" as number | ""),
          gender: c.gender || "",
          interests: c.interests
            ? typeof c.interests === "string"
              ? c.interests.split(",").map((s: string) => s.trim())
              : (c.interests as string[])
            : [],
        }));
      } catch {
        return [];
      }
    },
  });

  // Merge children: prefer API data, fall back to onboarding
  const children = useMemo(() => {
    if (apiChildren.length > 0) return apiChildren;
    return onboardingData?.children || [];
  }, [apiChildren, onboardingData]);

  // Computed event data
  const eventsWithDates = useMemo(
    () =>
      events
        .filter((e) => e.startDate)
        .map((e) => ({
          ...e,
          date: parseISO(e.startDate),
        })),
    [events]
  );

  const upcomingEvents = useMemo(
    () =>
      eventsWithDates
        .filter((e) => isAfter(e.date, today) || isSameDay(e.date, today))
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 5),
    [eventsWithDates, today]
  );

  // Custody info
  const custodyInfo = useMemo(
    () => getCustodyInfo(onboardingData, events),
    [onboardingData, events]
  );

  // Quick actions
  const quickActions = useMemo(
    () => getQuickActions(onboardingDone),
    [onboardingDone]
  );

  if (error) {
    console.error("Dashboard error:", error);
  }

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <Layout>
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ================================================================ */}
        {/* Main Column                                                      */}
        {/* ================================================================ */}
        <div className="lg:col-span-2 space-y-8">
          {/* Onboarding Banner (if setup not completed) */}
          {!onboardingDone && <OnboardingBanner />}

          {/* ---- Hero / Welcome Section ---- */}
          <motion.div variants={itemVariants}>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 via-primary/4 to-transparent border border-primary/10 p-8 md:p-10">
              {/* Background decorative image */}
              {!imageError && (
                <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none hidden md:block">
                  <img
                    src={generatedImage}
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-cover mix-blend-multiply"
                    onError={() => setImageError(true)}
                  />
                </div>
              )}

              {/* Decorative circles */}
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-primary/3 blur-2xl pointer-events-none" />

              <div className="relative z-10 max-w-lg">
                <div className="flex items-center gap-2 text-primary/70 mb-3">
                  <GreetingIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {format(today, "EEEE, MMMM d, yyyy")}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
                  {greeting.text}, {parentName}
                </h1>
                <p className="text-muted-foreground leading-relaxed">
                  {upcomingEvents.length > 0
                    ? `You have ${upcomingEvents.length} upcoming ${upcomingEvents.length === 1 ? "event" : "events"}. Here's what's on your radar.`
                    : "Your schedule is clear. Enjoy the day or plan something fun with the kids!"}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/calendar">
                    <Button className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      View Calendar
                    </Button>
                  </Link>
                  <Link href="/expenses">
                    <Button
                      variant="outline"
                      className="rounded-full bg-white/50 border-primary/20 hover:bg-white transition-all"
                    >
                      <DollarSign className="mr-2 h-4 w-4" />
                      Log Expense
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ---- Custody Status Cards ---- */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            variants={itemVariants}
          >
            {/* Current Status */}
            <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Current Custody
                </CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
                  <Users className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold mb-1">
                  With {custodyInfo.currentParent}
                </div>
                {custodyInfo.nextHandover ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Next handover:{" "}
                      {format(custodyInfo.nextHandover.date, "EEE, MMM d")}
                      {custodyInfo.nextHandover.startTime &&
                        ` at ${custodyInfo.nextHandover.startTime}`}
                    </p>
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Period progress</span>
                        <span>{custodyInfo.progress}%</span>
                      </div>
                      <Progress
                        value={custodyInfo.progress}
                        className="h-2"
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No upcoming handover scheduled
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Handover */}
            <Card
              className="bg-white border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() =>
                custodyInfo.nextHandover &&
                setSelectedEvent({
                  ...custodyInfo.nextHandover,
                  date: custodyInfo.nextHandover.date,
                })
              }
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Next Handover
                </CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                {custodyInfo.nextHandover ? (
                  <>
                    <div className="text-xl font-bold mb-1 truncate">
                      {custodyInfo.nextHandover.title}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(
                        custodyInfo.nextHandover.date,
                        "EEEE, MMM d"
                      )}{" "}
                      {custodyInfo.nextHandover.startTime &&
                        `at ${custodyInfo.nextHandover.startTime}`}
                      {custodyInfo.nextHandover.location &&
                        ` \u2022 ${custodyInfo.nextHandover.location}`}
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="text-xs font-medium"
                      >
                        {custodyInfo.nextHandover.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(custodyInfo.nextHandover.date, {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xl font-bold mb-1">
                      No upcoming events
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Add events to see upcoming handovers
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* ---- Children Overview ---- */}
          {children.length > 0 && (
            <motion.div className="space-y-4" variants={itemVariants}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold flex items-center gap-2">
                  <Baby className="h-5 w-5 text-primary/60" />
                  Your Children
                </h2>
                <Badge variant="secondary" className="text-xs">
                  {children.length}{" "}
                  {children.length === 1 ? "child" : "children"}
                </Badge>
              </div>
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {children.map((child) => (
                  <ChildCard key={child.id} child={child} />
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* ---- Quick Actions Grid ---- */}
          <motion.div className="space-y-4" variants={itemVariants}>
            <h2 className="text-xl font-display font-bold">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="block"
                  >
                    <Card className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer h-full">
                      <CardContent className="flex flex-col items-center justify-center gap-3 p-5 text-center">
                        <div
                          className={cn(
                            "flex h-11 w-11 items-center justify-center rounded-xl",
                            action.color
                          )}
                        >
                          <action.icon className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {action.label}
                        </span>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* ---- Upcoming Events ---- */}
          <motion.div className="space-y-4" variants={itemVariants}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold">
                Upcoming Events
              </h2>
              <Link href="/calendar">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  See all
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
              <CardContent className="p-0">
                {upcomingEvents.length === 0 ? (
                  <div className="p-10 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                      <CalendarIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-foreground mb-1">
                      No upcoming events
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add events from the calendar to see them here
                    </p>
                    <Link href="/calendar">
                      <Button variant="outline" size="sm" className="rounded-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Event
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {upcomingEvents.map((event) => (
                      <motion.div
                        key={event.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedEvent(event)}
                        whileHover={{ x: 4 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-xl flex flex-col items-center justify-center text-xs font-bold border shrink-0",
                              isSameDay(event.date, today)
                                ? "bg-primary text-white border-primary shadow-sm"
                                : "bg-background text-muted-foreground border-border"
                            )}
                          >
                            <span className="text-[10px] uppercase leading-none">
                              {format(event.date, "MMM")}
                            </span>
                            <span className="text-lg leading-tight">
                              {format(event.date, "d")}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-foreground truncate">
                              {event.title}
                            </h4>
                            <p className="text-sm text-muted-foreground truncate">
                              {event.startTime && event.endTime
                                ? `${event.startTime} - ${event.endTime}`
                                : event.startTime || "All day"}
                              {event.location &&
                                ` \u2022 ${event.location}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          {event.recurrence &&
                            event.recurrence !== "none" && (
                              <Badge
                                variant="secondary"
                                className="text-xs hidden sm:inline-flex"
                              >
                                {event.recurrence}
                              </Badge>
                            )}
                          <span
                            className={cn(
                              "px-2.5 py-1 rounded-full text-xs font-medium",
                              event.parent === "A"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-orange-100 text-orange-700"
                            )}
                          >
                            {event.parent === "A"
                              ? onboardingData?.parentAName || "Parent A"
                              : onboardingData?.parentBName || "Parent B"}
                          </span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ================================================================ */}
        {/* Sidebar                                                          */}
        {/* ================================================================ */}
        <div className="space-y-8">
          {/* ---- Auto-Plan Promo Card ---- */}
          <motion.div variants={itemVariants}>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 text-white shadow-lg">
              {/* Decorative background elements */}
              <div className="absolute top-[-20%] right-[-20%] w-36 h-36 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute bottom-[-15%] left-[-10%] w-28 h-28 rounded-full bg-purple-300/20 blur-xl" />
              <div className="absolute top-1/2 right-4 w-16 h-16 rounded-full bg-white/5 blur-lg" />

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-yellow-200" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-100">
                    Smart Planning
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl mb-2">
                  Auto-Plan {new Date().getFullYear() + 1}
                </h3>
                <p className="text-indigo-100 text-sm mb-5 leading-relaxed">
                  Generate a complete co-parenting schedule in seconds using
                  smart defaults and your preferences.
                </p>
                <Link href="/calendar">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm font-semibold"
                  >
                    Start Planning
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* ---- Activity Suggestions ---- */}
          <motion.div variants={itemVariants}>
            <ActivitySuggestions />
          </motion.div>

          {/* ---- Quick Add Section ---- */}
          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-display">
                  Quick Add
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/calendar" className="block">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-white hover:bg-muted/50 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2 text-primary" /> Add Event
                  </Button>
                </Link>
                <Link href="/messages" className="block">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-white hover:bg-muted/50 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 mr-2 text-primary" />{" "}
                    Send Message
                  </Button>
                </Link>
                <Link href="/expenses" className="block">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-white hover:bg-muted/50 transition-colors"
                  >
                    <DollarSign className="w-4 h-4 mr-2 text-primary" /> New
                    Expense
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* ---- Family Summary (if onboarding done) ---- */}
          {onboardingDone && onboardingData && (
            <motion.div variants={itemVariants}>
              <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-white">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <h3 className="font-display font-bold text-sm text-emerald-800">
                      Family Setup Complete
                    </h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    {onboardingData.familyDisplayName && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Heart className="h-3.5 w-3.5" />
                        <span>{onboardingData.familyDisplayName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span>
                        {onboardingData.parentAName}
                        {onboardingData.parentBName &&
                          ` & ${onboardingData.parentBName}`}
                      </span>
                    </div>
                    {children.length > 0 && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Baby className="h-3.5 w-3.5" />
                        <span>
                          {children.length}{" "}
                          {children.length === 1 ? "child" : "children"}
                        </span>
                      </div>
                    )}
                    {onboardingData.custodySchedule?.pattern && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="capitalize">
                          {onboardingData.custodySchedule.pattern.replace(
                            /_/g,
                            " "
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                  <Link href="/settings">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 w-full text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100/50"
                    >
                      Edit Settings
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ================================================================ */}
      {/* Event Details Dialog                                              */}
      {/* ================================================================ */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {selectedEvent.title}
                </DialogTitle>
                <DialogDescription>
                  {selectedEvent.date &&
                    format(selectedEvent.date, "EEEE, MMMM do, yyyy")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {(selectedEvent.startTime || selectedEvent.endTime) && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Time</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedEvent.startTime}
                        {selectedEvent.endTime &&
                          ` - ${selectedEvent.endTime}`}{" "}
                        {selectedEvent.timeZone}
                      </p>
                    </div>
                  </div>
                )}
                {selectedEvent.location && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedEvent.location}
                      </p>
                    </div>
                  </div>
                )}
                {selectedEvent.description && (
                  <div>
                    <p className="text-sm font-medium mb-1">Description</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium",
                      selectedEvent.parent === "A"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-orange-100 text-orange-700"
                    )}
                  >
                    {selectedEvent.parent === "A"
                      ? onboardingData?.parentAName || "Parent A"
                      : onboardingData?.parentBName || "Parent B"}
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-sm font-medium capitalize"
                  >
                    {selectedEvent.type}
                  </Badge>
                  {selectedEvent.recurrence &&
                    selectedEvent.recurrence !== "none" && (
                      <Badge variant="outline" className="text-sm capitalize">
                        {selectedEvent.recurrence}
                      </Badge>
                    )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
