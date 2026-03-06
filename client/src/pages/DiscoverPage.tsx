import { useState, useEffect, useMemo, useCallback } from "react";
import Layout from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getChildren, api } from "@/lib/api";
import type { Child } from "@shared/schema";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MapPin,
  Clock,
  Navigation,
  Loader2,
  Calendar,
  Star,
  Film,
  FerrisWheel,
  Blocks,
  Building2,
  TreePine,
  Activity,
  Palette,
  Waves,
  ChevronRight,
  Heart,
  Users,
  DollarSign,
  Sparkles,
  Compass,
  Filter,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
}

interface DiscoverActivity {
  id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  ageRange: string;
  priceIndicator: "Free" | "$" | "$$" | "$$$";
  hours: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  website?: string;
}

type CategoryKey =
  | "all"
  | "cinema"
  | "amusement"
  | "play"
  | "museum"
  | "outdoor"
  | "sports"
  | "arts"
  | "swimming";

interface CategoryInfo {
  key: CategoryKey;
  label: string;
  icon: React.ElementType;
  gradient: string;
  iconColor: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES: CategoryInfo[] = [
  {
    key: "cinema",
    label: "Cinema & Movies",
    icon: Film,
    gradient: "from-violet-500 to-purple-600",
    iconColor: "text-violet-100",
  },
  {
    key: "amusement",
    label: "Amusement Parks",
    icon: FerrisWheel,
    gradient: "from-rose-500 to-pink-600",
    iconColor: "text-rose-100",
  },
  {
    key: "play",
    label: "Play Centers",
    icon: Blocks,
    gradient: "from-amber-500 to-orange-600",
    iconColor: "text-amber-100",
  },
  {
    key: "museum",
    label: "Museums",
    icon: Building2,
    gradient: "from-cyan-500 to-teal-600",
    iconColor: "text-cyan-100",
  },
  {
    key: "outdoor",
    label: "Outdoor & Parks",
    icon: TreePine,
    gradient: "from-emerald-500 to-green-600",
    iconColor: "text-emerald-100",
  },
  {
    key: "sports",
    label: "Sports & Recreation",
    icon: Activity,
    gradient: "from-blue-500 to-indigo-600",
    iconColor: "text-blue-100",
  },
  {
    key: "arts",
    label: "Arts & Crafts",
    icon: Palette,
    gradient: "from-fuchsia-500 to-pink-600",
    iconColor: "text-fuchsia-100",
  },
  {
    key: "swimming",
    label: "Swimming & Water",
    icon: Waves,
    gradient: "from-sky-500 to-blue-600",
    iconColor: "text-sky-100",
  },
];

const FEATURED_ACTIVITIES: DiscoverActivity[] = [
  {
    id: "leo-lekeland",
    name: "Leo's Lekeland",
    description:
      "Norway's largest indoor play center with trampolines, climbing walls, ball pits, and slides. Perfect for rainy days with kids of all ages. Includes a dedicated toddler zone and cafe for parents.",
    category: "play",
    image: "https://images.unsplash.com/photo-1566454825481-9c31bd88c36f?w=800&h=600&fit=crop",
    ageRange: "1-12 years",
    priceIndicator: "$$",
    hours: "Mon-Fri 10:00-18:00, Sat-Sun 10:00-19:00",
    address: "Snaroyveien 36, 1364 Fornebu",
    latitude: 59.8965,
    longitude: 10.6134,
    rating: 4.3,
    reviewCount: 1247,
    tags: ["Indoor", "Trampolines", "Birthday Parties"],
    website: "https://leoslekeland.no",
  },
  {
    id: "tusenfryd",
    name: "TusenFryd",
    description:
      "Norway's premier amusement park featuring thrilling roller coasters, water rides, and family-friendly attractions. Home to SpinSpider, ThunderCoaster, and the beloved BadeFryd water park during summer.",
    category: "amusement",
    image: "https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=800&h=600&fit=crop",
    ageRange: "All ages",
    priceIndicator: "$$$",
    hours: "Open May-Oct, 10:00-20:00 (varies by season)",
    address: "Vinterbrovegen 25, 1407 Vinterbro",
    latitude: 59.7487,
    longitude: 10.7822,
    rating: 4.1,
    reviewCount: 3589,
    tags: ["Roller Coasters", "Water Park", "Seasonal"],
    website: "https://tusenfryd.no",
  },
  {
    id: "oslo-kino",
    name: "Oslo Kino - Colosseum",
    description:
      "Oslo's iconic cinema at Colosseum, one of Europe's largest and most beautiful movie theaters. Regular family matinees, kids' film festivals, and comfortable seating for the whole family.",
    category: "cinema",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=600&fit=crop",
    ageRange: "3+ years",
    priceIndicator: "$",
    hours: "Daily 10:00-23:00",
    address: "Fridtjof Nansens vei 6, 0369 Oslo",
    latitude: 59.9272,
    longitude: 10.7178,
    rating: 4.5,
    reviewCount: 2890,
    tags: ["Family Movies", "3D", "Candy Bar"],
    website: "https://oslokino.no",
  },
  {
    id: "bo-sommarland",
    name: "Bo Sommarland",
    description:
      "Scandinavia's largest water park with over 100 activities including enormous water slides, wave pools, lazy rivers, and outdoor adventure areas. A full-day family destination in Telemark.",
    category: "swimming",
    image: "https://images.unsplash.com/photo-1590870753986-59a8eb8cf72d?w=800&h=600&fit=crop",
    ageRange: "All ages",
    priceIndicator: "$$$",
    hours: "Open Jun-Aug, 10:00-19:00",
    address: "Trimvegen 3, 3802 Bo i Telemark",
    latitude: 59.4167,
    longitude: 9.0667,
    rating: 4.4,
    reviewCount: 4210,
    tags: ["Water Slides", "Wave Pool", "Seasonal"],
    website: "https://sommarland.no",
  },
  {
    id: "barnas-kulturhus",
    name: "Barnas Kulturhus",
    description:
      "A vibrant cultural center dedicated to children, offering theater performances, art workshops, music classes, and interactive exhibitions. A creative haven for young minds in the heart of Oslo.",
    category: "arts",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=600&fit=crop",
    ageRange: "2-10 years",
    priceIndicator: "$",
    hours: "Tue-Sun 10:00-16:00",
    address: "Schweigaards gate 14, 0185 Oslo",
    latitude: 59.9103,
    longitude: 10.7614,
    rating: 4.6,
    reviewCount: 876,
    tags: ["Theater", "Art Workshops", "Music"],
    website: "https://barnaskulturhus.no",
  },
  {
    id: "teknisk-museum",
    name: "Norsk Teknisk Museum",
    description:
      "Norway's national museum of science, technology, and medicine. Hands-on exhibits, interactive science labs, and the famous Teknoteket maker space make learning an adventure for curious kids.",
    category: "museum",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop",
    ageRange: "4+ years",
    priceIndicator: "$$",
    hours: "Tue-Sun 10:00-18:00 (Wed until 20:00)",
    address: "Kjelsasveien 143, 0491 Oslo",
    latitude: 59.9509,
    longitude: 10.7764,
    rating: 4.5,
    reviewCount: 2134,
    tags: ["Science", "Interactive", "Maker Space"],
    website: "https://tekniskmuseum.no",
  },
  {
    id: "frognerparken",
    name: "Frognerparken & Vigelandsanlegget",
    description:
      "Oslo's largest public park featuring the world-famous Vigeland sculpture installation. Sprawling green lawns, playgrounds, splash pads in summer, and ice skating in winter. Always free to visit.",
    category: "outdoor",
    image: "https://images.unsplash.com/photo-1568393691622-c7ba131d63b4?w=800&h=600&fit=crop",
    ageRange: "All ages",
    priceIndicator: "Free",
    hours: "Open 24 hours (park), Playground 07:00-21:00",
    address: "Nobels gate 32, 0268 Oslo",
    latitude: 59.9271,
    longitude: 10.7003,
    rating: 4.7,
    reviewCount: 5672,
    tags: ["Sculptures", "Playground", "Picnic"],
  },
  {
    id: "holmenkollen",
    name: "Holmenkollen Ski Museum & Jump",
    description:
      "Visit the legendary Holmenkollen ski jump and explore the world's oldest ski museum. Includes a zipline experience from the top of the jump with panoramic views of the Oslo fjord.",
    category: "sports",
    image: "https://images.unsplash.com/photo-1551524559-8af4e6624178?w=800&h=600&fit=crop",
    ageRange: "5+ years",
    priceIndicator: "$$",
    hours: "Daily 10:00-17:00 (May-Sep until 20:00)",
    address: "Kongeveien 5, 0787 Oslo",
    latitude: 59.9639,
    longitude: 10.6673,
    rating: 4.4,
    reviewCount: 3102,
    tags: ["Ski Jump", "Zipline", "Museum"],
    website: "https://holmenkollen.com",
  },
  {
    id: "munch-museum",
    name: "MUNCH Museum",
    description:
      "The striking waterfront museum housing Edvard Munch's masterpieces. Family-friendly art workshops on weekends, guided tours for kids, and interactive digital experiences throughout the galleries.",
    category: "museum",
    image: "https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=800&h=600&fit=crop",
    ageRange: "5+ years",
    priceIndicator: "$$",
    hours: "Tue-Sun 10:00-18:00 (Thu-Sat until 21:00)",
    address: "Edvard Munchs plass 1, 0194 Oslo",
    latitude: 59.9065,
    longitude: 10.7563,
    rating: 4.3,
    reviewCount: 1789,
    tags: ["Art", "Kids Workshops", "Architecture"],
    website: "https://munchmuseet.no",
  },
  {
    id: "tryvann-vinterpark",
    name: "Oslo Vinterpark",
    description:
      "Oslo's closest alpine ski resort with slopes for all levels, children's area with magic carpet lifts, and ski school. In summer, it transforms into a mountain bike and hiking destination.",
    category: "sports",
    image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=600&fit=crop",
    ageRange: "3+ years",
    priceIndicator: "$$",
    hours: "Winter: Mon-Fri 10:00-21:00, Sat-Sun 09:30-17:00",
    address: "Tryvannsveien 64, 0791 Oslo",
    latitude: 59.9833,
    longitude: 10.6667,
    rating: 4.0,
    reviewCount: 1456,
    tags: ["Skiing", "Kids Slopes", "Ski School"],
    website: "https://oslovinterpark.no",
  },
  {
    id: "sorenga",
    name: "Sorenga Sjobad",
    description:
      "Oslo's popular urban seawater pool complex at the waterfront. Features a children's pool, diving boards, floating saunas, and stunning fjord views. A summer must-visit for families.",
    category: "swimming",
    image: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&h=600&fit=crop",
    ageRange: "All ages",
    priceIndicator: "Free",
    hours: "Open Jun-Aug, 07:00-21:00",
    address: "Sorenga 1, 0194 Oslo",
    latitude: 59.9038,
    longitude: 10.7519,
    rating: 4.2,
    reviewCount: 1034,
    tags: ["Outdoor Pool", "Diving", "Fjord Views"],
  },
  {
    id: "international-museum",
    name: "Internasjonalt Barnekunstmuseum",
    description:
      "The International Museum of Children's Art -- the only museum in the world dedicated entirely to art created by children. Features rotating exhibits, creative workshops, and a global perspective on childhood creativity.",
    category: "arts",
    image: "https://images.unsplash.com/photo-1560421683-6856ea585c78?w=800&h=600&fit=crop",
    ageRange: "3-15 years",
    priceIndicator: "$",
    hours: "Tue-Sun 11:00-16:00",
    address: "Lille Frens vei 4, 0369 Oslo",
    latitude: 59.9274,
    longitude: 10.7085,
    rating: 4.1,
    reviewCount: 423,
    tags: ["Children's Art", "Workshops", "Global"],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function renderStars(rating: number) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.3;
  const stars: React.ReactNode[] = [];
  for (let i = 0; i < 5; i++) {
    if (i < full) {
      stars.push(
        <Star
          key={i}
          className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
        />
      );
    } else if (i === full && half) {
      stars.push(
        <span key={i} className="relative inline-block w-3.5 h-3.5">
          <Star className="absolute w-3.5 h-3.5 text-muted-foreground/30" />
          <span className="absolute overflow-hidden w-[50%]">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          </span>
        </span>
      );
    } else {
      stars.push(
        <Star
          key={i}
          className="w-3.5 h-3.5 text-muted-foreground/30"
        />
      );
    }
  }
  return stars;
}

function priceColor(price: string): string {
  switch (price) {
    case "Free":
      return "bg-emerald-100 text-emerald-700";
    case "$":
      return "bg-blue-100 text-blue-700";
    case "$$":
      return "bg-amber-100 text-amber-700";
    case "$$$":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ActivityCardSkeleton() {
  return (
    <Card className="overflow-hidden border-none shadow-md">
      <Skeleton className="h-52 w-full rounded-none" />
      <CardHeader className="p-4 pb-2 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Skeleton className="h-9 w-full rounded-md" />
      </CardFooter>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function DiscoverPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Dialog state
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] =
    useState<DiscoverActivity | null>(null);
  const [planForm, setPlanForm] = useState({
    date: new Date().toISOString().split("T")[0],
    startTime: "10:00",
    endTime: "12:00",
    childId: "",
    parent: "A",
  });

  // Queries
  const { data: children = [] } = useQuery({
    queryKey: ["children"],
    queryFn: getChildren,
  });

  // Mutations
  const addEventMutation = useMutation({
    mutationFn: async (eventData: {
      childId: number | null;
      title: string;
      startDate: string;
      endDate: string;
      startTime: string;
      endTime: string;
      parent: string;
      description: string;
      location: string;
    }) => {
      const newEvent = {
        child_id: eventData.childId,
        title: eventData.title,
        start_date: eventData.startDate,
        end_date: eventData.endDate,
        start_time: eventData.startTime,
        end_time: eventData.endTime,
        time_zone: "Europe/Oslo",
        parent: eventData.parent,
        type: "activity",
        description: eventData.description,
        location: eventData.location,
        recurrence: null,
        recurrence_interval: 1,
        recurrence_end: null,
        recurrence_days: null,
      };
      const result = await api.createEvent(newEvent);
      if (!result) throw new Error("Failed to create event");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Added to calendar!",
        description: `${selectedActivity?.name} has been added to your family calendar.`,
      });
      setCalendarDialogOpen(false);
      setSelectedActivity(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Could not add to calendar",
        description: error.message || "Something went wrong. Please try again.",
      });
    },
  });

  // Simulate initial load
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Geolocation
  const getUserLocation = useCallback(() => {
    setLoadingLocation(true);
    if (!("geolocation" in navigator)) {
      setLoadingLocation(false);
      toast({
        variant: "destructive",
        title: "Geolocation not supported",
        description: "Your browser does not support location services.",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const loc: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        // Reverse geocode
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.latitude}&lon=${loc.longitude}`,
            { signal: controller.signal }
          );
          clearTimeout(timeout);
          if (res.ok) {
            const data = await res.json();
            loc.city =
              data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              data.address?.suburb ||
              "Your area";
          } else {
            loc.city = "Your area";
          }
        } catch {
          loc.city = "Your area";
        }

        setUserLocation(loc);
        setLoadingLocation(false);
        toast({
          title: "Location detected",
          description: `Showing activities near ${loc.city}.`,
        });
      },
      () => {
        setLoadingLocation(false);
        // Default to Oslo centre when denied
        setUserLocation({
          latitude: 59.9139,
          longitude: 10.7522,
          city: "Oslo",
        });
        toast({
          title: "Using default location",
          description:
            "Location access denied. Showing activities near Oslo.",
        });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, [toast]);

  // Auto-request location on mount
  useEffect(() => {
    getUserLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Computed: filtered and enriched activities
  const activitiesWithDistance = useMemo(() => {
    return FEATURED_ACTIVITIES.map((a) => ({
      ...a,
      distance: userLocation
        ? calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            a.latitude,
            a.longitude
          )
        : null,
    }));
  }, [userLocation]);

  const filteredActivities = useMemo(() => {
    return activitiesWithDistance.filter((a) => {
      const matchesCategory =
        activeCategory === "all" || a.category === activeCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.tags.some((t) =>
          t.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchesCategory && matchesSearch;
    });
  }, [activitiesWithDistance, activeCategory, searchQuery]);

  const nearbyActivities = useMemo(() => {
    return [...filteredActivities]
      .filter((a) => a.distance !== null)
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
      .slice(0, 6);
  }, [filteredActivities]);

  // Handlers
  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const openCalendarDialog = (activity: DiscoverActivity) => {
    setSelectedActivity(activity);
    setPlanForm({
      date: new Date().toISOString().split("T")[0],
      startTime: "10:00",
      endTime: "12:00",
      childId: children.length > 0 ? String(children[0].id) : "",
      parent: "A",
    });
    setCalendarDialogOpen(true);
  };

  const handleAddToCalendar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;

    addEventMutation.mutate({
      childId: planForm.childId ? Number(planForm.childId) : null,
      title: selectedActivity.name,
      startDate: planForm.date,
      endDate: planForm.date,
      startTime: planForm.startTime,
      endTime: planForm.endTime,
      parent: planForm.parent,
      description: selectedActivity.description,
      location: selectedActivity.address,
    });
  };

  const handleImageError = (id: string) => {
    setImageErrors((prev) => new Set(prev).add(id));
  };

  const getImageSrc = (activity: DiscoverActivity) => {
    if (imageErrors.has(activity.id)) {
      // Fallback to picsum with a deterministic seed
      let hash = 0;
      for (let i = 0; i < activity.name.length; i++) {
        hash = (hash << 5) - hash + activity.name.charCodeAt(i);
        hash = hash & hash;
      }
      return `https://picsum.photos/seed/${Math.abs(hash)}/800/600`;
    }
    return activity.image;
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <Layout>
      <div className="space-y-10 pb-12">
        {/* =============================================================== */}
        {/* HERO SECTION                                                    */}
        {/* =============================================================== */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-indigo-700 p-8 md:p-12">
          {/* Decorative shapes */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Compass className="w-5 h-5 text-white/80" />
              <span className="text-sm font-medium text-white/80 uppercase tracking-wider">
                Explore
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-3 leading-tight">
              Discover Activities{" "}
              <span className="text-white/90">Near You</span>
            </h1>
            <p className="text-white/75 text-base md:text-lg mb-8 max-w-lg">
              Find family-friendly events, venues, and experiences to make every
              parenting day special.
            </p>

            {/* Search bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search activities, venues, categories..."
                  className="pl-12 h-12 bg-white/95 border-white/20 text-foreground rounded-xl shadow-lg focus-visible:ring-white/40 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Button
                onClick={getUserLocation}
                disabled={loadingLocation}
                className="h-12 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/25 backdrop-blur-sm px-6 shrink-0"
              >
                {loadingLocation ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4 mr-2" />
                )}
                {userLocation
                  ? userLocation.city || "Located"
                  : "Find Me"}
              </Button>
            </div>

            {/* Location indicator */}
            {userLocation && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-2 text-sm text-white/70"
              >
                <MapPin className="w-4 h-4" />
                <span>
                  Showing activities near{" "}
                  <strong className="text-white">
                    {userLocation.city || "your location"}
                  </strong>
                </span>
              </motion.div>
            )}
          </div>
        </section>

        {/* =============================================================== */}
        {/* CATEGORIES GRID                                                 */}
        {/* =============================================================== */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground">
                Browse Categories
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Tap a category to filter activities
              </p>
            </div>
            {activeCategory !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveCategory("all")}
                className="text-muted-foreground"
              >
                Clear filter
                <X className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-4"
          >
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.key;
              return (
                <motion.button
                  key={cat.key}
                  variants={itemVariants}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() =>
                    setActiveCategory(isActive ? "all" : cat.key)
                  }
                  className={`
                    relative overflow-hidden rounded-xl p-4 md:p-5 text-left transition-all duration-200
                    bg-gradient-to-br ${cat.gradient}
                    ${isActive ? "ring-2 ring-offset-2 ring-primary shadow-xl scale-[1.02]" : "shadow-md hover:shadow-lg"}
                  `}
                >
                  <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
                  <Icon className={`w-7 h-7 md:w-8 md:h-8 mb-2 ${cat.iconColor}`} />
                  <p className="text-sm md:text-base font-semibold text-white leading-tight">
                    {cat.label}
                  </p>
                  {isActive && (
                    <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-white rounded-full shadow" />
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </section>

        {/* =============================================================== */}
        {/* NEARBY ACTIVITIES (sorted by distance)                          */}
        {/* =============================================================== */}
        {userLocation && nearbyActivities.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-100">
                <MapPin className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground">
                  Closest to You
                </h2>
                <p className="text-sm text-muted-foreground">
                  Sorted by distance from {userLocation.city || "your location"}
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <ActivityCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {nearbyActivities.map((activity) => (
                  <motion.div key={activity.id} variants={itemVariants}>
                    <Card className="group overflow-hidden border-none shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full bg-card">
                      {/* Image */}
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={getImageSrc(activity)}
                          alt={activity.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          onError={() => handleImageError(activity.id)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        <Button
                          size="icon"
                          variant="secondary"
                          className="absolute top-3 right-3 rounded-full w-8 h-8 bg-white/80 hover:bg-white backdrop-blur-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(activity.id);
                          }}
                        >
                          <Heart
                            className={`w-4 h-4 transition-colors ${
                              favorites.has(activity.id)
                                ? "fill-red-500 text-red-500"
                                : "text-muted-foreground"
                            }`}
                          />
                        </Button>
                        <div className="absolute bottom-3 left-3 flex gap-2">
                          <Badge className="bg-black/50 backdrop-blur-md text-white border-none text-xs">
                            {CATEGORIES.find((c) => c.key === activity.category)?.label || activity.category}
                          </Badge>
                          {activity.distance !== null && (
                            <Badge className="bg-teal-600/80 backdrop-blur-md text-white border-none text-xs">
                              <MapPin className="w-3 h-3 mr-1" />
                              {activity.distance.toFixed(1)} km
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <CardHeader className="p-4 pb-1">
                        <h3 className="font-display font-bold text-lg leading-tight line-clamp-1">
                          {activity.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          {renderStars(activity.rating)}
                          <span className="text-xs text-muted-foreground ml-1">
                            {activity.rating} ({activity.reviewCount.toLocaleString()})
                          </span>
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 pt-2 flex-1 space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {activity.description}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${priceColor(activity.priceIndicator)}`}
                          >
                            {activity.priceIndicator === "Free" ? (
                              "Free"
                            ) : (
                              <>
                                <DollarSign className="w-3 h-3 mr-0.5" />
                                {activity.priceIndicator}
                              </>
                            )}
                          </Badge>
                          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                            <Users className="w-3 h-3 mr-1" />
                            {activity.ageRange}
                          </Badge>
                        </div>
                      </CardContent>

                      <CardFooter className="p-4 pt-0">
                        <Button
                          className="w-full"
                          size="sm"
                          onClick={() => openCalendarDialog(activity)}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Add to Calendar
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </section>
        )}

        {/* =============================================================== */}
        {/* FEATURED ACTIVITIES                                             */}
        {/* =============================================================== */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground">
                {activeCategory !== "all"
                  ? `${CATEGORIES.find((c) => c.key === activeCategory)?.label || "Filtered"} Activities`
                  : "Featured Activities"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {filteredActivities.length} activit
                {filteredActivities.length === 1 ? "y" : "ies"} found
                {searchQuery && ` for "${searchQuery}"`}
              </p>
            </div>
          </div>

          {/* Active filter chips */}
          {(activeCategory !== "all" || searchQuery) && (
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <Filter className="w-4 h-4 text-muted-foreground" />
              {activeCategory !== "all" && (
                <Badge
                  variant="secondary"
                  className="pl-2 pr-1 gap-1 cursor-pointer hover:bg-secondary/80"
                  onClick={() => setActiveCategory("all")}
                >
                  {CATEGORIES.find((c) => c.key === activeCategory)?.label}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              {searchQuery && (
                <Badge
                  variant="secondary"
                  className="pl-2 pr-1 gap-1 cursor-pointer hover:bg-secondary/80"
                  onClick={() => setSearchQuery("")}
                >
                  "{searchQuery}"
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <ActivityCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredActivities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                No activities found
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">
                Try adjusting your search or clearing filters to see more
                results.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
              >
                Clear all filters
              </Button>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredActivities.map((activity) => (
                  <motion.div
                    key={activity.id}
                    variants={itemVariants}
                    layout
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  >
                    <Card className="group overflow-hidden border-none shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full bg-card">
                      {/* Image */}
                      <div className="relative h-52 overflow-hidden">
                        <img
                          src={getImageSrc(activity)}
                          alt={activity.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          onError={() => handleImageError(activity.id)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                        {/* Top badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                          <Badge className="bg-black/50 backdrop-blur-md text-white border-none text-xs">
                            {CATEGORIES.find((c) => c.key === activity.category)
                              ?.label || activity.category}
                          </Badge>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="rounded-full w-8 h-8 bg-white/80 hover:bg-white backdrop-blur-sm shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(activity.id);
                            }}
                          >
                            <Heart
                              className={`w-4 h-4 transition-colors ${
                                favorites.has(activity.id)
                                  ? "fill-red-500 text-red-500"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </Button>
                        </div>

                        {/* Bottom overlay info */}
                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="font-display font-bold text-lg text-white leading-tight drop-shadow-md line-clamp-1">
                            {activity.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-0.5">
                              {renderStars(activity.rating)}
                            </div>
                            <span className="text-xs text-white/80">
                              {activity.rating} ({activity.reviewCount.toLocaleString()})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <CardContent className="p-4 flex-1 space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {activity.description}
                        </p>

                        {/* Meta info */}
                        <div className="flex flex-wrap gap-1.5">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${priceColor(activity.priceIndicator)}`}
                          >
                            {activity.priceIndicator === "Free" ? (
                              "Free"
                            ) : (
                              <>
                                <DollarSign className="w-3 h-3 mr-0.5" />
                                {activity.priceIndicator}
                              </>
                            )}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="text-xs bg-purple-100 text-purple-700"
                          >
                            <Users className="w-3 h-3 mr-1" />
                            {activity.ageRange}
                          </Badge>
                          {activity.distance !== null && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-teal-100 text-teal-700"
                            >
                              <MapPin className="w-3 h-3 mr-1" />
                              {activity.distance.toFixed(1)} km
                            </Badge>
                          )}
                        </div>

                        {/* Hours */}
                        <div className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <span className="line-clamp-1">{activity.hours}</span>
                        </div>

                        {/* Address */}
                        <div className="flex items-start gap-2 text-xs text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <span className="line-clamp-1">{activity.address}</span>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          {activity.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </CardContent>

                      <CardFooter className="p-4 pt-0 gap-2">
                        {activity.website && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            asChild
                          >
                            <a
                              href={activity.website}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Website
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </a>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          className={activity.website ? "flex-1" : "w-full"}
                          onClick={() => openCalendarDialog(activity)}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Add to Calendar
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

        {/* =============================================================== */}
        {/* ADD TO CALENDAR DIALOG                                          */}
        {/* =============================================================== */}
        <Dialog open={calendarDialogOpen} onOpenChange={setCalendarDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add to Calendar</DialogTitle>
              <DialogDescription>
                Schedule{" "}
                <strong>{selectedActivity?.name}</strong> on your family
                calendar.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddToCalendar} className="space-y-4 mt-2">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="event-date">Date</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={planForm.date}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, date: e.target.value })
                  }
                  required
                />
              </div>

              {/* Time range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={planForm.startTime}
                    onChange={(e) =>
                      setPlanForm({ ...planForm, startTime: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={planForm.endTime}
                    onChange={(e) =>
                      setPlanForm({ ...planForm, endTime: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* Child */}
              <div className="space-y-2">
                <Label>Child</Label>
                <Select
                  value={planForm.childId}
                  onValueChange={(v) =>
                    setPlanForm({ ...planForm, childId: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a child" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child: any) => (
                      <SelectItem key={child.id} value={String(child.id)}>
                        {child.name}
                      </SelectItem>
                    ))}
                    {children.length === 0 && (
                      <SelectItem value="none" disabled>
                        No children added
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Parent */}
              <div className="space-y-2">
                <Label>Parent</Label>
                <Select
                  value={planForm.parent}
                  onValueChange={(v) =>
                    setPlanForm({ ...planForm, parent: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Parent A</SelectItem>
                    <SelectItem value="B">Parent B</SelectItem>
                    <SelectItem value="both">Both Parents</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Activity info summary */}
              {selectedActivity && (
                <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{selectedActivity.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{selectedActivity.hours}</span>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCalendarDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={addEventMutation.isPending}>
                  {addEventMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 mr-2" />
                      Add to Calendar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
