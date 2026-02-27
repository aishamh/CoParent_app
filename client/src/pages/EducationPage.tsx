import Layout from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getReadingList,
  getSchoolTasks,
  getHandoverNotes,
  createReadingListItem,
  createHandoverNote,
} from "@/lib/api";
import type { Child } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  Circle,
  BookOpen,
  GraduationCap,
  ExternalLink,
  Plus,
  Target,
  Sparkles,
  ClipboardList,
  MessageCircle,
  X,
  Edit3,
  Save,
  Clock,
  MapPin,
  CalendarPlus,
  Lightbulb,
  Palette,
  Music,
  Waves,
  Trophy,
  TreePine,
  UtensilsCrossed,
  BookOpenCheck,
  Calculator,
  FileText,
} from "lucide-react";
import generatedImage from "@assets/generated_images/abstract_open_book_and_learning_symbols_in_soft_colors.png";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EducationGoal {
  childId: number;
  freeText: string;
  academicTags: string[];
  lifeSkillTags: string[];
}

interface AISuggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ElementType;
  duration: string;
  location?: string;
  matchedGoal: string;
}

// ---------------------------------------------------------------------------
// Predefined tag options
// ---------------------------------------------------------------------------

const ACADEMIC_TAG_OPTIONS = [
  "Math",
  "Reading",
  "Science",
  "Writing",
  "History",
  "Geography",
  "Languages",
  "Coding",
  "Art",
  "Music",
];

const LIFE_SKILL_TAG_OPTIONS = [
  "Cooking",
  "Time management",
  "Money skills",
  "Social skills",
  "Swimming",
  "Sport",
  "Nature",
  "Gardening",
  "Cleaning",
  "First aid",
];

// ---------------------------------------------------------------------------
// AI Suggestion Engine (rule-based, client-side only)
// ---------------------------------------------------------------------------

interface SuggestionRule {
  keywords: string[];
  suggestions: Omit<AISuggestion, "id" | "matchedGoal">[];
}

const SUGGESTION_RULES: SuggestionRule[] = [
  {
    keywords: ["math", "matte", "calculation", "numbers", "fractions", "algebra"],
    suggestions: [
      {
        title: "Visit Oslo Science Museum",
        description:
          "Interactive math exhibits that make learning fun. Great for kids of all ages with hands-on puzzles and geometry challenges.",
        category: "Math",
        icon: Calculator,
        duration: "2-3 hours",
        location: "Teknisk Museum, Oslo",
      },
      {
        title: "Math Puzzle Games Evening",
        description:
          "Spend an evening with Sudoku, tangrams, and logic puzzles. Builds problem-solving skills while having fun together.",
        category: "Math",
        icon: Calculator,
        duration: "1-2 hours",
      },
      {
        title: "Grocery Store Math Challenge",
        description:
          "Turn grocery shopping into a math lesson: estimating totals, calculating discounts, and comparing unit prices.",
        category: "Math",
        icon: Calculator,
        duration: "1 hour",
        location: "Your local supermarket",
      },
    ],
  },
  {
    keywords: ["reading", "lesing", "books", "literacy", "literature"],
    suggestions: [
      {
        title: "Library Visit at Deichman",
        description:
          "Explore the stunning Deichman Bjorvika library with its amazing children's section, reading nooks, and regular story-time events.",
        category: "Reading",
        icon: BookOpenCheck,
        duration: "2-3 hours",
        location: "Deichman Bjorvika, Oslo",
      },
      {
        title: "Start a Family Book Club",
        description:
          "Pick a book together each month. Discuss characters, plot, and lessons learned. Great for building comprehension and critical thinking.",
        category: "Reading",
        icon: BookOpenCheck,
        duration: "Ongoing",
      },
      {
        title: "Audiobook & Nature Walk",
        description:
          "Combine a nature walk with listening to an audiobook together. Fresh air and storytelling make a perfect pair.",
        category: "Reading",
        icon: BookOpenCheck,
        duration: "1-2 hours",
        location: "Nordmarka trails",
      },
    ],
  },
  {
    keywords: ["nature", "natur", "outdoor", "environment", "animals", "plants"],
    suggestions: [
      {
        title: "Nature Walk at Frognerparken",
        description:
          "Explore seasonal changes, identify trees and birds, and enjoy the Vigeland sculptures. Pack a nature journal for sketching.",
        category: "Nature",
        icon: TreePine,
        duration: "2-3 hours",
        location: "Frognerparken, Oslo",
      },
      {
        title: "Botanical Garden Visit",
        description:
          "Discover plants from around the world at the University Botanical Garden. Perfect for learning about ecosystems and biodiversity.",
        category: "Nature",
        icon: TreePine,
        duration: "1.5-2 hours",
        location: "Botanisk Hage, Toyen",
      },
      {
        title: "Bug Hunt & Nature Journal",
        description:
          "Equip your child with a magnifying glass and journal. Search for insects, leaves, and fungi. Identify species together at home.",
        category: "Nature",
        icon: TreePine,
        duration: "1-2 hours",
      },
    ],
  },
  {
    keywords: ["cooking", "baking", "food", "kitchen", "matlaging"],
    suggestions: [
      {
        title: "Kids Cooking Class",
        description:
          "Enroll in a local children's cooking class to learn basic kitchen skills, food safety, and healthy eating habits.",
        category: "Cooking",
        icon: UtensilsCrossed,
        duration: "2 hours",
        location: "Baker Hansen, Oslo",
      },
      {
        title: "Bake Together Weekend",
        description:
          "Choose a recipe together, shop for ingredients, measure, mix, and bake. Teaches math, reading, and patience in one activity.",
        category: "Cooking",
        icon: UtensilsCrossed,
        duration: "2-3 hours",
      },
      {
        title: "World Cuisine Exploration",
        description:
          "Each week, pick a country and cook a traditional dish. Combines geography, culture, and kitchen skills in a delicious way.",
        category: "Cooking",
        icon: UtensilsCrossed,
        duration: "2 hours",
      },
    ],
  },
  {
    keywords: ["art", "kunst", "drawing", "painting", "creative", "craft"],
    suggestions: [
      {
        title: "Art Workshop at Barnas Kulturhus",
        description:
          "Drop-in art workshops designed for children with professional materials and guidance. Great for sparking creativity.",
        category: "Art",
        icon: Palette,
        duration: "2 hours",
        location: "Barnas Kulturhus, Oslo",
      },
      {
        title: "Drawing Class at Kunstnernes Hus",
        description:
          "Structured drawing lessons for children with age-appropriate techniques and inspiration from real artworks.",
        category: "Art",
        icon: Palette,
        duration: "1.5 hours",
        location: "Kunstnernes Hus, Oslo",
      },
      {
        title: "DIY Craft Afternoon",
        description:
          "Set up a craft station at home with recycled materials. Build, paint, and create -- perfect for rainy days.",
        category: "Art",
        icon: Palette,
        duration: "1-3 hours",
      },
    ],
  },
  {
    keywords: ["music", "musikk", "instrument", "singing", "sang"],
    suggestions: [
      {
        title: "Music Class for Kids",
        description:
          "Group music classes introduce rhythm, melody, and instruments. Perfect for building confidence and musical appreciation.",
        category: "Music",
        icon: Music,
        duration: "1 hour",
        location: "Oslo Kulturskole",
      },
      {
        title: "Concert at Konserthuset",
        description:
          "Family-friendly concerts introduce children to orchestral music in a welcoming environment with engaging performances.",
        category: "Music",
        icon: Music,
        duration: "1.5 hours",
        location: "Oslo Konserthus",
      },
      {
        title: "Kitchen Band Jam Session",
        description:
          "Use pots, pans, and wooden spoons to explore rhythm and beats. Add singing and movement for a full musical experience.",
        category: "Music",
        icon: Music,
        duration: "30-60 min",
      },
    ],
  },
  {
    keywords: ["swimming", "svomming", "water", "vann"],
    suggestions: [
      {
        title: "Swimming Lessons at Toyenbadet",
        description:
          "Professional swimming instruction in a modern facility. Builds water confidence, safety skills, and physical fitness.",
        category: "Swimming",
        icon: Waves,
        duration: "1 hour",
        location: "Toyenbadet, Oslo",
      },
      {
        title: "Beach Day at Sorenga",
        description:
          "Practice swimming in a safe seawater pool. Pack a picnic and combine exercise with relaxation on sunny days.",
        category: "Swimming",
        icon: Waves,
        duration: "Half day",
        location: "Sorenga Sjobad, Oslo",
      },
    ],
  },
  {
    keywords: ["sport", "football", "fotball", "climbing", "exercise", "physical", "idrett"],
    suggestions: [
      {
        title: "Football Training",
        description:
          "Join a local football club for team sports, coordination, and social skills. Most clubs welcome beginners of all ages.",
        category: "Sport",
        icon: Trophy,
        duration: "1.5 hours",
        location: "Local football club",
      },
      {
        title: "Climbing at Klatreverket",
        description:
          "Indoor climbing builds strength, problem-solving, and confidence. Great for kids with energy to burn.",
        category: "Sport",
        icon: Trophy,
        duration: "1.5-2 hours",
        location: "Klatreverket, Oslo",
      },
      {
        title: "Family Bike Ride",
        description:
          "Explore Oslo's bike paths together. Great exercise combined with navigation skills and traffic safety awareness.",
        category: "Sport",
        icon: Trophy,
        duration: "1-3 hours",
      },
    ],
  },
  {
    keywords: ["science", "vitenskap", "experiment", "chemistry", "physics", "biology"],
    suggestions: [
      {
        title: "Science Experiments at Home",
        description:
          "Simple experiments with household items: baking soda volcanoes, crystal growing, and water filtration. Real science, real fun.",
        category: "Science",
        icon: Lightbulb,
        duration: "1-2 hours",
      },
      {
        title: "Teknisk Museum Visit",
        description:
          "Hands-on science and technology exhibits designed for curious minds. Regular workshops and demonstrations for children.",
        category: "Science",
        icon: Lightbulb,
        duration: "2-3 hours",
        location: "Teknisk Museum, Oslo",
      },
    ],
  },
  {
    keywords: ["coding", "programming", "koding", "computer", "technology"],
    suggestions: [
      {
        title: "Scratch Coding Workshop",
        description:
          "Learn visual programming with Scratch. Create animations, games, and interactive stories while building logical thinking.",
        category: "Coding",
        icon: Lightbulb,
        duration: "1-2 hours",
      },
      {
        title: "Robot Building Day",
        description:
          "Build and program simple robots with LEGO Mindstorms or similar kits. Engineering meets creativity.",
        category: "Coding",
        icon: Lightbulb,
        duration: "2-3 hours",
        location: "Deichman Bjorvika, Oslo",
      },
    ],
  },
  {
    keywords: ["writing", "skriving", "story", "creative writing", "journal"],
    suggestions: [
      {
        title: "Story Writing Challenge",
        description:
          "Write a short story together using writing prompts. Develops vocabulary, imagination, and narrative structure.",
        category: "Writing",
        icon: FileText,
        duration: "1 hour",
      },
      {
        title: "Pen Pal Exchange",
        description:
          "Start a pen pal exchange with a child in another country. Combines writing practice with cultural awareness.",
        category: "Writing",
        icon: FileText,
        duration: "Ongoing",
      },
    ],
  },
];

function generateSuggestions(goals: EducationGoal[]): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const usedTitles = new Set<string>();

  for (const goal of goals) {
    const allText = [
      goal.freeText,
      ...goal.academicTags,
      ...goal.lifeSkillTags,
    ]
      .join(" ")
      .toLowerCase();

    for (const rule of SUGGESTION_RULES) {
      const matched = rule.keywords.some((kw) => allText.includes(kw));
      if (matched) {
        for (const s of rule.suggestions) {
          if (!usedTitles.has(s.title)) {
            usedTitles.add(s.title);
            suggestions.push({
              ...s,
              id: `${goal.childId}-${s.title.replace(/\s/g, "-").toLowerCase()}`,
              matchedGoal: rule.keywords[0],
            });
          }
        }
      }
    }
  }

  return suggestions;
}

// ---------------------------------------------------------------------------
// Utility: category colour mapping
// ---------------------------------------------------------------------------

function categoryColor(category: string): string {
  const map: Record<string, string> = {
    Math: "bg-blue-100 text-blue-700 border-blue-200",
    Reading: "bg-amber-100 text-amber-700 border-amber-200",
    Nature: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Cooking: "bg-orange-100 text-orange-700 border-orange-200",
    Art: "bg-pink-100 text-pink-700 border-pink-200",
    Music: "bg-purple-100 text-purple-700 border-purple-200",
    Swimming: "bg-cyan-100 text-cyan-700 border-cyan-200",
    Sport: "bg-red-100 text-red-700 border-red-200",
    Science: "bg-indigo-100 text-indigo-700 border-indigo-200",
    Coding: "bg-violet-100 text-violet-700 border-violet-200",
    Writing: "bg-teal-100 text-teal-700 border-teal-200",
  };
  return map[category] || "bg-gray-100 text-gray-700 border-gray-200";
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// ---------------------------------------------------------------------------
// localStorage helpers for goals
// ---------------------------------------------------------------------------

function loadGoalsFromStorage(childIds: number[]): EducationGoal[] {
  // First attempt to load from onboarding_data (set by onboarding wizard)
  try {
    const onboarding = localStorage.getItem("onboarding_data");
    if (onboarding) {
      const parsed = JSON.parse(onboarding);
      if (parsed.educationGoals && Array.isArray(parsed.educationGoals)) {
        return parsed.educationGoals as EducationGoal[];
      }
    }
  } catch {
    // ignore parse errors
  }

  // Then try the dedicated education_goals key
  try {
    const stored = localStorage.getItem("education_goals");
    if (stored) {
      return JSON.parse(stored) as EducationGoal[];
    }
  } catch {
    // ignore parse errors
  }

  // Default: empty goals for each child
  return childIds.map((id) => ({
    childId: id,
    freeText: "",
    academicTags: [],
    lifeSkillTags: [],
  }));
}

function saveGoalsToStorage(goals: EducationGoal[]) {
  localStorage.setItem("education_goals", JSON.stringify(goals));

  // Also update onboarding_data if it exists
  try {
    const onboarding = localStorage.getItem("onboarding_data");
    if (onboarding) {
      const parsed = JSON.parse(onboarding);
      parsed.educationGoals = goals;
      localStorage.setItem("onboarding_data", JSON.stringify(parsed));
    }
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Tag Picker sub-component
// ---------------------------------------------------------------------------

function TagPicker({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (tags: string[]) => void;
}) {
  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </Label>
      <div className="flex flex-wrap gap-2">
        {options.map((tag) => {
          const isActive = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                isActive
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
              }`}
            >
              {tag}
              {isActive && <X className="w-3 h-3 inline ml-1 -mr-0.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ===========================================================================
// Main Component
// ===========================================================================

export default function EducationPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Tab state
  const [activeTab, setActiveTab] = useState("goals");

  // Dialog states
  const [isBookDialogOpen, setIsBookDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);

  // Book form state
  const [bookFormData, setBookFormData] = useState({
    childId: 0,
    title: "",
    author: "",
    progress: 0,
    assignedTo: "Parent A",
    cover: "",
  });

  // Note form state
  const [noteFormData, setNoteFormData] = useState({
    childId: 0,
    parent: "A" as "A" | "B",
    message: "",
  });

  // Education goals state
  const [goals, setGoals] = useState<EducationGoal[]>([]);
  const [editingGoalChildId, setEditingGoalChildId] = useState<number | null>(null);
  const [goalsInitialized, setGoalsInitialized] = useState(false);

  // -------------------------------------------------------------------------
  // Data queries
  // -------------------------------------------------------------------------

  const { data: children = [] } = useQuery<Child[]>({
    queryKey: ["children"],
    queryFn: async () => {
      const res = await fetch("/api/children");
      if (!res.ok) throw new Error("Failed to fetch children");
      return res.json();
    },
  });

  const { data: readingList = [], isLoading: readingLoading } = useQuery({
    queryKey: ["reading-list"],
    queryFn: () => getReadingList(),
  });

  const { data: schoolTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["school-tasks"],
    queryFn: () => getSchoolTasks(),
  });

  const { data: handoverNotes = [], isLoading: notesLoading } = useQuery({
    queryKey: ["handover-notes"],
    queryFn: () => getHandoverNotes(),
  });

  // -------------------------------------------------------------------------
  // Initialise goals from localStorage once children are loaded
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (children.length > 0 && !goalsInitialized) {
      const childIds = children.map((c) => c.id);
      const loaded = loadGoalsFromStorage(childIds);

      // Make sure every child has a goal entry
      const merged = childIds.map(
        (id) =>
          loaded.find((g) => g.childId === id) || {
            childId: id,
            freeText: "",
            academicTags: [],
            lifeSkillTags: [],
          },
      );
      setGoals(merged);
      setGoalsInitialized(true);
    }
  }, [children, goalsInitialized]);

  // -------------------------------------------------------------------------
  // Goal helpers
  // -------------------------------------------------------------------------

  const updateGoal = useCallback(
    (childId: number, patch: Partial<EducationGoal>) => {
      setGoals((prev) => {
        const updated = prev.map((g) =>
          g.childId === childId ? { ...g, ...patch } : g,
        );
        return updated;
      });
    },
    [],
  );

  const saveGoals = useCallback(() => {
    saveGoalsToStorage(goals);
    setEditingGoalChildId(null);
    toast({ title: "Goals saved", description: "Education goals updated successfully." });
  }, [goals, toast]);

  // -------------------------------------------------------------------------
  // AI suggestions -- memoised based on goals
  // -------------------------------------------------------------------------

  const suggestions = useMemo(() => generateSuggestions(goals), [goals]);

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  const createBookMutation = useMutation({
    mutationFn: createReadingListItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reading-list"] });
      toast({
        title: "Book added",
        description: "The book has been added to the reading list.",
      });
      setIsBookDialogOpen(false);
      setBookFormData({
        childId: 0,
        title: "",
        author: "",
        progress: 0,
        assignedTo: "Parent A",
        cover: "",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add book.",
      });
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: createHandoverNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handover-notes"] });
      toast({
        title: "Note added",
        description: "Your handover note has been added.",
      });
      setIsNoteDialogOpen(false);
      setNoteFormData({ childId: 0, parent: "A", message: "" });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add note.",
      });
    },
  });

  // -------------------------------------------------------------------------
  // Form handlers
  // -------------------------------------------------------------------------

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookFormData.childId || bookFormData.childId === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a child.",
      });
      return;
    }
    if (!bookFormData.title || !bookFormData.author) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields.",
      });
      return;
    }
    createBookMutation.mutate(bookFormData as any);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteFormData.childId || noteFormData.childId === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a child.",
      });
      return;
    }
    if (!noteFormData.message || noteFormData.message.trim() === "") {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a message.",
      });
      return;
    }
    createNoteMutation.mutate(noteFormData as any);
  };

  const handleAddToCalendar = (suggestion: AISuggestion) => {
    toast({
      title: "Added to Calendar",
      description: `"${suggestion.title}" has been noted. Head to Year Planner to schedule it.`,
    });
  };

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (readingLoading || tasksLoading || notesLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm">Loading education hub...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <Layout>
      <motion.div
        className="space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* ----------------------------------------------------------------- */}
        {/* Hero Header */}
        {/* ----------------------------------------------------------------- */}
        <motion.div variants={itemVariants}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/30 to-pink-100/40 border border-primary/10 p-8 md:p-10">
            <div className="relative z-10 max-w-2xl">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-primary" />
                </div>
                Co-Education Hub
              </h1>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                Set education goals, get personalised activity suggestions, track reading
                progress, and coordinate school responsibilities together.
              </p>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 pointer-events-none hidden md:block">
              <img
                src={generatedImage}
                alt="Education"
                className="h-full w-full object-cover mix-blend-multiply"
              />
            </div>
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/5 pointer-events-none" />
            <div className="absolute -bottom-6 right-1/4 w-24 h-24 rounded-full bg-pink-200/20 pointer-events-none" />
          </div>
        </motion.div>

        {/* ----------------------------------------------------------------- */}
        {/* Tabs */}
        {/* ----------------------------------------------------------------- */}
        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-4 h-11">
              <TabsTrigger value="goals" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">Goals & AI</span>
                <span className="sm:hidden">Goals</span>
              </TabsTrigger>
              <TabsTrigger value="reading" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <BookOpen className="w-4 h-4" />
                Reading
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <ClipboardList className="w-4 h-4" />
                Tasks
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <MessageCircle className="w-4 h-4" />
                Notes
              </TabsTrigger>
            </TabsList>

            {/* ============================================================= */}
            {/* TAB: Goals & AI */}
            {/* ============================================================= */}
            <TabsContent value="goals" className="mt-6">
              <motion.div
                className="space-y-8"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
              >
                {/* ---------- Education Goals Section ---------- */}
                <motion.section variants={itemVariants} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-display font-bold">Education Goals</h2>
                  </div>

                  {children.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="py-12 flex flex-col items-center text-center">
                        <GraduationCap className="w-10 h-10 text-muted-foreground/40 mb-3" />
                        <p className="text-muted-foreground">
                          No children added yet. Add your children in Settings to set education goals.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {goals.map((goal) => {
                        const child = children.find((c) => c.id === goal.childId);
                        if (!child) return null;
                        const isEditing = editingGoalChildId === goal.childId;

                        return (
                          <motion.div key={goal.childId} variants={fadeIn}>
                            <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
                              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm">
                                      {child.name.charAt(0)}
                                    </div>
                                    <CardTitle className="text-base">
                                      {child.name}'s Goals
                                    </CardTitle>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (isEditing) {
                                        saveGoals();
                                      } else {
                                        setEditingGoalChildId(goal.childId);
                                      }
                                    }}
                                    className="gap-1.5"
                                  >
                                    {isEditing ? (
                                      <>
                                        <Save className="w-4 h-4" /> Save
                                      </>
                                    ) : (
                                      <>
                                        <Edit3 className="w-4 h-4" /> Edit
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-4 space-y-4">
                                {/* Free text goals */}
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    What do you want to teach {child.name}?
                                  </Label>
                                  {isEditing ? (
                                    <Textarea
                                      value={goal.freeText}
                                      onChange={(e) =>
                                        updateGoal(goal.childId, {
                                          freeText: e.target.value,
                                        })
                                      }
                                      placeholder="e.g., I want them to develop a love for reading and become confident in math..."
                                      rows={3}
                                      className="resize-none text-sm"
                                    />
                                  ) : (
                                    <p className="text-sm text-foreground min-h-[2rem]">
                                      {goal.freeText || (
                                        <span className="text-muted-foreground italic">
                                          Click Edit to add your goals
                                        </span>
                                      )}
                                    </p>
                                  )}
                                </div>

                                {/* Academic tags */}
                                {isEditing ? (
                                  <TagPicker
                                    label="Academic Focus Areas"
                                    options={ACADEMIC_TAG_OPTIONS}
                                    selected={goal.academicTags}
                                    onChange={(tags) =>
                                      updateGoal(goal.childId, { academicTags: tags })
                                    }
                                  />
                                ) : (
                                  <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                      Academic Focus
                                    </Label>
                                    <div className="flex flex-wrap gap-1.5">
                                      {goal.academicTags.length > 0 ? (
                                        goal.academicTags.map((tag) => (
                                          <Badge
                                            key={tag}
                                            variant="secondary"
                                            className="text-xs"
                                          >
                                            {tag}
                                          </Badge>
                                        ))
                                      ) : (
                                        <span className="text-xs text-muted-foreground italic">
                                          No academic focus areas set
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Life skills tags */}
                                {isEditing ? (
                                  <TagPicker
                                    label="Life Skills to Develop"
                                    options={LIFE_SKILL_TAG_OPTIONS}
                                    selected={goal.lifeSkillTags}
                                    onChange={(tags) =>
                                      updateGoal(goal.childId, { lifeSkillTags: tags })
                                    }
                                  />
                                ) : (
                                  <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                      Life Skills
                                    </Label>
                                    <div className="flex flex-wrap gap-1.5">
                                      {goal.lifeSkillTags.length > 0 ? (
                                        goal.lifeSkillTags.map((tag) => (
                                          <Badge
                                            key={tag}
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {tag}
                                          </Badge>
                                        ))
                                      ) : (
                                        <span className="text-xs text-muted-foreground italic">
                                          No life skills set
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.section>

                {/* ---------- AI Activity Suggestions ---------- */}
                <motion.section variants={itemVariants} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <h2 className="text-xl font-display font-bold">
                      AI Activity Suggestions
                    </h2>
                    <Badge variant="secondary" className="text-xs ml-1">
                      Based on your goals
                    </Badge>
                  </div>

                  {suggestions.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="py-12 flex flex-col items-center text-center">
                        <Sparkles className="w-10 h-10 text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground font-medium mb-1">
                          No suggestions yet
                        </p>
                        <p className="text-muted-foreground text-sm max-w-md">
                          Set education goals above with tags like "Math", "Reading", "Nature",
                          or "Cooking" to receive personalised activity suggestions for your
                          family.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <motion.div
                      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <AnimatePresence>
                        {suggestions.map((suggestion) => {
                          const IconComponent = suggestion.icon;
                          return (
                            <motion.div
                              key={suggestion.id}
                              variants={fadeIn}
                              layout
                            >
                              <Card className="h-full border-none shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden">
                                <CardContent className="p-5 flex flex-col h-full">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                      <IconComponent className="w-5 h-5 text-primary" />
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] ${categoryColor(suggestion.category)}`}
                                    >
                                      {suggestion.category}
                                    </Badge>
                                  </div>

                                  <h3 className="font-bold text-sm mb-1.5 text-foreground group-hover:text-primary transition-colors">
                                    {suggestion.title}
                                  </h3>
                                  <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-4">
                                    {suggestion.description}
                                  </p>

                                  <div className="space-y-2.5">
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {suggestion.duration}
                                      </span>
                                      {suggestion.location && (
                                        <span className="flex items-center gap-1">
                                          <MapPin className="w-3 h-3" />
                                          {suggestion.location}
                                        </span>
                                      )}
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full text-xs gap-1.5 hover:bg-primary hover:text-white transition-colors"
                                      onClick={() => handleAddToCalendar(suggestion)}
                                    >
                                      <CalendarPlus className="w-3.5 h-3.5" />
                                      Add to Calendar
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </motion.section>
              </motion.div>
            </TabsContent>

            {/* ============================================================= */}
            {/* TAB: Reading */}
            {/* ============================================================= */}
            <TabsContent value="reading" className="mt-6">
              <motion.div
                className="space-y-5"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
              >
                <motion.div
                  variants={itemVariants}
                  className="flex items-center justify-between"
                >
                  <h2 className="text-xl font-display font-bold flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Shared Reading List
                  </h2>
                  <Dialog open={isBookDialogOpen} onOpenChange={setIsBookDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Plus className="w-4 h-4" /> Add Book
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <form onSubmit={handleAddBook}>
                        <DialogHeader>
                          <DialogTitle>Add Book to Reading List</DialogTitle>
                          <DialogDescription>
                            Add a new book for your child to read.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="child">Child *</Label>
                            <Select
                              value={bookFormData.childId.toString()}
                              onValueChange={(value) =>
                                setBookFormData({
                                  ...bookFormData,
                                  childId: parseInt(value),
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select child" />
                              </SelectTrigger>
                              <SelectContent>
                                {children.map((child: Child) => (
                                  <SelectItem
                                    key={child.id}
                                    value={child.id.toString()}
                                  >
                                    {child.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="title">Title *</Label>
                            <Input
                              id="title"
                              value={bookFormData.title}
                              onChange={(e) =>
                                setBookFormData({
                                  ...bookFormData,
                                  title: e.target.value,
                                })
                              }
                              placeholder="e.g., Harry Potter"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="author">Author *</Label>
                            <Input
                              id="author"
                              value={bookFormData.author}
                              onChange={(e) =>
                                setBookFormData({
                                  ...bookFormData,
                                  author: e.target.value,
                                })
                              }
                              placeholder="e.g., J.K. Rowling"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="assignedTo">Currently with</Label>
                            <Select
                              value={bookFormData.assignedTo}
                              onValueChange={(value) =>
                                setBookFormData({
                                  ...bookFormData,
                                  assignedTo: value,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Parent A">Parent A</SelectItem>
                                <SelectItem value="Parent B">Parent B</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cover">Cover Image URL (optional)</Label>
                            <Input
                              id="cover"
                              value={bookFormData.cover}
                              onChange={(e) =>
                                setBookFormData({
                                  ...bookFormData,
                                  cover: e.target.value,
                                })
                              }
                              placeholder="https://example.com/cover.jpg"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            type="submit"
                            disabled={createBookMutation.isPending}
                          >
                            {createBookMutation.isPending ? "Adding..." : "Add Book"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </motion.div>

                {readingList.length === 0 ? (
                  <motion.div variants={itemVariants}>
                    <Card className="border-dashed">
                      <CardContent className="py-12 flex flex-col items-center text-center">
                        <BookOpen className="w-10 h-10 text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground font-medium mb-1">
                          No books yet
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Add books to track your children's reading progress together.
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    variants={containerVariants}
                  >
                    {readingList.map((book) => (
                      <motion.div key={book.id} variants={fadeIn}>
                        <Card className="flex overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 group">
                          <div className="w-24 shrink-0 bg-muted/30">
                            <img
                              src={
                                book.cover ||
                                "https://via.placeholder.com/150x200?text=Book"
                              }
                              alt={book.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="flex-1 p-4 flex flex-col justify-between">
                            <div>
                              <h3 className="font-bold text-sm line-clamp-1">
                                {book.title}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {book.author}
                              </p>
                            </div>
                            <div className="space-y-2 mt-3">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">{book.progress}%</span>
                              </div>
                              <Progress value={book.progress} className="h-1.5" />
                              <div className="flex justify-between items-center mt-2">
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] h-5"
                                >
                                  Currently with {book.assignedTo}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            </TabsContent>

            {/* ============================================================= */}
            {/* TAB: Tasks */}
            {/* ============================================================= */}
            <TabsContent value="tasks" className="mt-6">
              <motion.div
                className="space-y-5"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
              >
                <motion.div variants={itemVariants}>
                  <Card className="border-none shadow-sm overflow-hidden">
                    <div className="bg-[#0052cc]/5 p-4 border-b border-[#0052cc]/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#0052cc] rounded-md flex items-center justify-center text-white font-bold text-sm">
                          F
                        </div>
                        <span className="font-bold text-[#0052cc]">Fridge Skole</span>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-white text-green-600 border-green-200 flex items-center gap-1"
                      >
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Connected
                      </Badge>
                    </div>
                    <CardContent className="p-0">
                      {schoolTasks.length === 0 ? (
                        <div className="py-12 flex flex-col items-center text-center">
                          <ClipboardList className="w-10 h-10 text-muted-foreground/30 mb-3" />
                          <p className="text-muted-foreground font-medium mb-1">
                            No school tasks
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Tasks from Fridge Skole will appear here when assigned.
                          </p>
                        </div>
                      ) : (
                        schoolTasks.map((task) => (
                          <motion.div
                            key={task.id}
                            variants={fadeIn}
                            className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/30 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              {task.status === "completed" ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              ) : (
                                <Circle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                              )}
                              <div>
                                <p
                                  className={`font-medium ${
                                    task.status === "completed"
                                      ? "text-muted-foreground line-through"
                                      : "text-foreground"
                                  }`}
                                >
                                  {task.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Due: {task.dueDate}
                                </p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </motion.div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Current Focus */}
                <motion.div variants={itemVariants}>
                  <Card className="bg-primary/5 border-primary/10 shadow-none">
                    <CardHeader>
                      <CardTitle className="text-primary text-lg">
                        Current Focus
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-white p-3 rounded-lg border border-primary/10 shadow-sm">
                        <p className="text-sm font-medium text-foreground">
                          Math: Fractions & Decimals
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Focus on converting fractions to decimals this week.
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-primary/10 shadow-sm">
                        <p className="text-sm font-medium text-foreground">
                          Project: Solar System
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Needs styrofoam balls and paint by Thursday.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </TabsContent>

            {/* ============================================================= */}
            {/* TAB: Notes */}
            {/* ============================================================= */}
            <TabsContent value="notes" className="mt-6">
              <motion.div
                className="space-y-5"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
              >
                <motion.div
                  variants={itemVariants}
                  className="flex items-center justify-between"
                >
                  <h2 className="text-xl font-display font-bold flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    Handover Notes
                  </h2>
                  <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Plus className="w-4 h-4" /> Add Note
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <form onSubmit={handleAddNote}>
                        <DialogHeader>
                          <DialogTitle>Add Handover Note</DialogTitle>
                          <DialogDescription>
                            Leave a note for the other parent about important updates
                            or observations.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="note-child">Child *</Label>
                            <Select
                              value={noteFormData.childId.toString()}
                              onValueChange={(value) =>
                                setNoteFormData({
                                  ...noteFormData,
                                  childId: parseInt(value),
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select child" />
                              </SelectTrigger>
                              <SelectContent>
                                {children.map((child: Child) => (
                                  <SelectItem
                                    key={child.id}
                                    value={child.id.toString()}
                                  >
                                    {child.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="parent">From</Label>
                            <Select
                              value={noteFormData.parent}
                              onValueChange={(value) =>
                                setNoteFormData({
                                  ...noteFormData,
                                  parent: value as "A" | "B",
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="A">Parent A</SelectItem>
                                <SelectItem value="B">Parent B</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="message">Message *</Label>
                            <Textarea
                              id="message"
                              value={noteFormData.message}
                              onChange={(e) =>
                                setNoteFormData({
                                  ...noteFormData,
                                  message: e.target.value,
                                })
                              }
                              placeholder="e.g., Emma had a great day at school, learned about fractions..."
                              rows={4}
                              required
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            type="submit"
                            disabled={createNoteMutation.isPending}
                          >
                            {createNoteMutation.isPending
                              ? "Adding..."
                              : "Add Note"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </motion.div>

                {handoverNotes.length === 0 ? (
                  <motion.div variants={itemVariants}>
                    <Card className="border-dashed">
                      <CardContent className="py-12 flex flex-col items-center text-center">
                        <MessageCircle className="w-10 h-10 text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground font-medium mb-1">
                          No handover notes yet
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Leave notes for the other parent about school updates,
                          observations, or reminders.
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    className="space-y-3"
                    variants={containerVariants}
                  >
                    {handoverNotes.map((note) => (
                      <motion.div
                        key={note.id}
                        variants={fadeIn}
                        className="flex gap-3"
                      >
                        <div className="w-9 h-9 rounded-full bg-[hsl(15_50%_65%)]/20 flex items-center justify-center text-[hsl(15_50%_40%)] font-bold text-xs shrink-0">
                          P{note.parent}
                        </div>
                        <Card className="flex-1 border-none shadow-sm">
                          <CardContent className="p-4">
                            <p className="text-sm text-foreground leading-relaxed">
                              {note.message}
                            </p>
                            {note.createdAt && (
                              <p className="text-[11px] text-muted-foreground mt-2">
                                {new Date(note.createdAt).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
