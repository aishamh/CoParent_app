import { useState, useCallback, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { updateProfile, createChild } from "@/lib/api";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Users,
  Home,
  Building2,
  Baby,
  GraduationCap,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Pencil,
  Trash2,
  Check,
  Sparkles,
  Heart,
  BookOpen,
  Palette,
  Loader2,
  Sun,
  Snowflake,
  TreePine,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChildData {
  id: string;
  name: string;
  age: number | "";
  gender: string;
  interests: string[];
}

interface ChildGoals {
  childId: string;
  academic: string;
  lifeSkills: string;
  hobbies: string;
}

interface CustodySchedule {
  pattern: "every_weekend" | "every_other_week" | "custom_split" | "";
  arrivalDay: string;
  arrivalTime: string;
  departureDay: string;
  departureTime: string;
  customPercentage: number;
  summerSplit: "50_50" | "alternating" | "custom";
  winterSplit: "50_50" | "alternating" | "custom";
  holidaySplit: "50_50" | "alternating" | "custom";
}

type HouseholdType = "single" | "two" | "";

interface OnboardingData {
  parentAName: string;
  parentBName: string;
  familyDisplayName: string;
  householdType: HouseholdType;
  children: ChildData[];
  goals: ChildGoals[];
  custodySchedule: CustodySchedule;
}

// ---------------------------------------------------------------------------
// Step metadata
// ---------------------------------------------------------------------------

const STEP_META = [
  {
    title: "Family Profile",
    subtitle: "Let's start with who's in the family",
    icon: Users,
  },
  {
    title: "Household Type",
    subtitle: "How is your family organized?",
    icon: Home,
  },
  {
    title: "Your Children",
    subtitle: "Tell us about your kids",
    icon: Baby,
  },
  {
    title: "Education Goals",
    subtitle: "What do you want them to learn?",
    icon: GraduationCap,
  },
  {
    title: "Custody Schedule",
    subtitle: "Set up your co-parenting schedule",
    icon: CalendarDays,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Direction for animations: +1 = forward, -1 = backward
  const [direction, setDirection] = useState(1);
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // ---- Onboarding state ----
  const [data, setData] = useState<OnboardingData>(() => {
    // Attempt to restore from localStorage
    try {
      const stored = localStorage.getItem("onboarding_data");
      if (stored) return JSON.parse(stored) as OnboardingData;
    } catch {
      // ignore
    }
    return {
      parentAName: user?.email?.split("@")[0] ?? "",
      parentBName: "",
      familyDisplayName: "",
      householdType: "",
      children: [],
      goals: [],
      custodySchedule: {
        pattern: "",
        arrivalDay: "Friday",
        arrivalTime: "15:00",
        departureDay: "Sunday",
        departureTime: "18:00",
        customPercentage: 50,
        summerSplit: "50_50",
        winterSplit: "50_50",
        holidaySplit: "50_50",
      },
    };
  });

  // Persist to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem("onboarding_data", JSON.stringify(data));
  }, [data]);

  // Determine total steps (skip custody step if single household)
  const totalSteps = data.householdType === "two" ? 5 : 4;
  const progressPercent = ((currentStep + 1) / totalSteps) * 100;

  // Map logical step index to actual step
  const getActualStep = (index: number): number => {
    if (data.householdType !== "two" && index >= 4) return index;
    return index;
  };

  // ---- Step validation ----
  const canProceed = useCallback((): boolean => {
    switch (currentStep) {
      case 0: // Family Profile
        return data.parentAName.trim().length > 0;
      case 1: // Household Type
        return data.householdType !== "";
      case 2: // Children
        return data.children.length > 0 && data.children.every((c) => c.name.trim().length > 0 && c.age !== "");
      case 3: // Education Goals
        return true; // optional
      case 4: // Custody Schedule
        return data.custodySchedule.pattern !== "";
      default:
        return true;
    }
  }, [currentStep, data]);

  const isOptionalStep = (step: number): boolean => {
    return step === 3; // Education Goals
  };

  // ---- Navigation ----
  const goNext = () => {
    if (currentStep === totalSteps - 1) {
      handleComplete();
      return;
    }
    // Skip custody step if single household and we're on step 3
    let nextStep = currentStep + 1;
    if (data.householdType !== "two" && nextStep === 4) {
      // We'd go past the end
      handleComplete();
      return;
    }
    setDirection(1);
    setCurrentStep(nextStep);
  };

  const goBack = () => {
    if (currentStep === 0) return;
    setDirection(-1);
    setCurrentStep(currentStep - 1);
  };

  // ---- Save & complete ----
  const handleComplete = async () => {
    setSaving(true);

    try {
      // Save via API if user is authenticated
      if (user) {
        await updateProfile(user.id, {
          parent_a_name: data.parentAName,
          parent_b_name: data.parentBName,
          role: "parentA",
        });

        for (const child of data.children) {
          await createChild({
            name: child.name,
            age: typeof child.age === "number" ? child.age : 0,
            gender: child.gender || "not specified",
            interests: child.interests.join(", "),
          });
        }
      }
    } catch (err) {
      console.error("Error saving onboarding data:", err);
      // Continue anyway -- data is in localStorage
    }

    // Mark complete
    localStorage.setItem("onboarding_completed", "true");

    setSaving(false);

    toast({
      title: "Welcome to CoParent!",
      description:
        "Your family profile has been set up. Let's get started!",
    });

    navigate("/dashboard");
  };

  // ---- Update helpers ----
  const update = <K extends keyof OnboardingData>(
    key: K,
    value: OnboardingData[K]
  ) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  // ---- Render ----
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/60 via-white to-amber-50/40 flex flex-col">
      {/* ---------- Top bar ---------- */}
      <header className="w-full px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-foreground tracking-tight">
            CoParent
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          Step {currentStep + 1} of {totalSteps}
        </span>
      </header>

      {/* ---------- Progress bar ---------- */}
      <div className="px-6 md:px-12 lg:px-24">
        <Progress value={progressPercent} className="h-2 rounded-full" />
      </div>

      {/* ---------- Stepper dots ---------- */}
      <div className="flex items-center justify-center gap-3 mt-6">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const stepIndex =
            data.householdType !== "two" && i >= 4 ? i + 1 : i;
          const meta = STEP_META[stepIndex] ?? STEP_META[i];
          const Icon = meta.icon;
          const isActive = i === currentStep;
          const isCompleted = i < currentStep;

          return (
            <button
              key={i}
              onClick={() => {
                if (i < currentStep) {
                  setDirection(-1);
                  setCurrentStep(i);
                }
              }}
              disabled={i > currentStep}
              className={cn(
                "flex items-center gap-2 transition-all duration-300",
                i > currentStep && "opacity-40 cursor-default"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                  isActive &&
                    "bg-teal-600 border-teal-600 text-white scale-110 shadow-lg shadow-teal-200",
                  isCompleted &&
                    "bg-teal-100 border-teal-400 text-teal-700",
                  !isActive &&
                    !isCompleted &&
                    "bg-white border-gray-200 text-gray-400"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              {/* Show label only on larger screens */}
              <span
                className={cn(
                  "hidden lg:inline text-sm font-medium transition-colors",
                  isActive && "text-teal-700",
                  isCompleted && "text-teal-600",
                  !isActive && !isCompleted && "text-gray-400"
                )}
              >
                {meta.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* ---------- Content area ---------- */}
      <div className="flex-1 flex items-start md:items-center justify-center px-4 md:px-6 py-8">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Step header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-200/50 mb-4"
                >
                  {(() => {
                    const Icon = STEP_META[currentStep]?.icon ?? Users;
                    return <Icon className="w-7 h-7" />;
                  })()}
                </motion.div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  {STEP_META[currentStep]?.title}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {STEP_META[currentStep]?.subtitle}
                </p>
              </div>

              {/* Step content */}
              <Card className="border-0 shadow-xl shadow-black/5 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6 md:p-8">
                  {currentStep === 0 && (
                    <StepFamilyProfile data={data} update={update} userEmail={user?.email} />
                  )}
                  {currentStep === 1 && (
                    <StepHouseholdType data={data} update={update} />
                  )}
                  {currentStep === 2 && (
                    <StepChildren data={data} update={update} />
                  )}
                  {currentStep === 3 && (
                    <StepEducationGoals data={data} update={update} />
                  )}
                  {currentStep === 4 && (
                    <StepCustodySchedule data={data} update={update} />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* ---------- Navigation buttons ---------- */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="ghost"
              onClick={goBack}
              disabled={currentStep === 0}
              className={cn(
                "gap-2 text-muted-foreground",
                currentStep === 0 && "invisible"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>

            <div className="flex items-center gap-3">
              {isOptionalStep(currentStep) && (
                <Button
                  variant="ghost"
                  onClick={goNext}
                  className="text-muted-foreground"
                >
                  Skip
                </Button>
              )}
              <Button
                onClick={goNext}
                disabled={!canProceed() || saving}
                className="gap-2 px-8 rounded-full shadow-lg shadow-teal-200/50 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white border-0 min-w-[140px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : currentStep === totalSteps - 1 ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Finish Setup
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// STEP 1: Family Profile
// ===========================================================================

function StepFamilyProfile({
  data,
  update,
  userEmail,
}: {
  data: OnboardingData;
  update: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void;
  userEmail?: string | null;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="parentA" className="text-sm font-medium">
          Parent A Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="parentA"
          placeholder="Your name"
          value={data.parentAName}
          onChange={(e) => update("parentAName", e.target.value)}
          className="h-11"
        />
        {userEmail && (
          <p className="text-xs text-muted-foreground">
            Logged in as {userEmail}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="parentB" className="text-sm font-medium">
          Parent B Name
        </Label>
        <Input
          id="parentB"
          placeholder="Co-parent's name (can be added later)"
          value={data.parentBName}
          onChange={(e) => update("parentBName", e.target.value)}
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">
          You can invite them later to share the account
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="familyName" className="text-sm font-medium">
          Family Display Name{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="familyName"
          placeholder='e.g. "The Johnson Family"'
          value={data.familyDisplayName}
          onChange={(e) => update("familyDisplayName", e.target.value)}
          className="h-11"
        />
      </div>
    </div>
  );
}

// ===========================================================================
// STEP 2: Household Type
// ===========================================================================

function StepHouseholdType({
  data,
  update,
}: {
  data: OnboardingData;
  update: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void;
}) {
  const options: {
    value: HouseholdType;
    icon: typeof Home;
    title: string;
    description: string;
    detail: string;
  }[] = [
    {
      value: "single",
      icon: Home,
      title: "Single Household",
      description: "We live together",
      detail: "Share one login, one profile",
    },
    {
      value: "two",
      icon: Building2,
      title: "Two Households",
      description: "Separated / Co-parenting",
      detail: "Each parent has their own login and schedule",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {options.map((opt) => {
        const isSelected = data.householdType === opt.value;
        const Icon = opt.icon;
        return (
          <motion.button
            key={opt.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => update("householdType", opt.value)}
            className={cn(
              "relative flex flex-col items-center text-center p-8 rounded-2xl border-2 transition-all duration-200 cursor-pointer",
              isSelected
                ? "border-teal-500 bg-teal-50/80 shadow-lg shadow-teal-100"
                : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
            )}
          >
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center"
              >
                <Check className="w-3.5 h-3.5 text-white" />
              </motion.div>
            )}
            <div
              className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                isSelected
                  ? "bg-teal-500 text-white"
                  : "bg-gray-100 text-gray-500"
              )}
            >
              <Icon className="w-7 h-7" />
            </div>
            <h3
              className={cn(
                "text-lg font-semibold mb-1",
                isSelected ? "text-teal-900" : "text-foreground"
              )}
            >
              {opt.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              {opt.description}
            </p>
            <p
              className={cn(
                "text-xs font-medium px-3 py-1 rounded-full",
                isSelected
                  ? "bg-teal-100 text-teal-700"
                  : "bg-gray-100 text-gray-500"
              )}
            >
              {opt.detail}
            </p>
          </motion.button>
        );
      })}
    </div>
  );
}

// ===========================================================================
// STEP 3: Children
// ===========================================================================

function StepChildren({
  data,
  update,
}: {
  data: OnboardingData;
  update: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void;
}) {
  const [showForm, setShowForm] = useState(data.children.length === 0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ChildData>({
    id: generateId(),
    name: "",
    age: "",
    gender: "",
    interests: [],
  });
  const [interestInput, setInterestInput] = useState("");
  const interestRef = useRef<HTMLInputElement>(null);

  const resetDraft = () => {
    setDraft({
      id: generateId(),
      name: "",
      age: "",
      gender: "",
      interests: [],
    });
    setInterestInput("");
    setEditingId(null);
  };

  const addInterest = () => {
    const val = interestInput.trim();
    if (val && !draft.interests.includes(val)) {
      setDraft((prev) => ({
        ...prev,
        interests: [...prev.interests, val],
      }));
      setInterestInput("");
      interestRef.current?.focus();
    }
  };

  const removeInterest = (interest: string) => {
    setDraft((prev) => ({
      ...prev,
      interests: prev.interests.filter((i) => i !== interest),
    }));
  };

  const handleSaveChild = () => {
    if (!draft.name.trim() || draft.age === "") return;

    if (editingId) {
      const updated = data.children.map((c) =>
        c.id === editingId ? { ...draft, id: editingId } : c
      );
      update("children", updated);
    } else {
      update("children", [...data.children, draft]);
    }

    // Also ensure goals entry exists for this child
    const childId = editingId || draft.id;
    if (!data.goals.find((g) => g.childId === childId)) {
      update("goals", [
        ...data.goals,
        { childId, academic: "", lifeSkills: "", hobbies: "" },
      ]);
    }

    resetDraft();
    setShowForm(false);
  };

  const handleEdit = (child: ChildData) => {
    setDraft({ ...child });
    setEditingId(child.id);
    setShowForm(true);
  };

  const handleRemove = (id: string) => {
    update(
      "children",
      data.children.filter((c) => c.id !== id)
    );
    update(
      "goals",
      data.goals.filter((g) => g.childId !== id)
    );
  };

  return (
    <div className="space-y-6">
      {/* Existing children list */}
      {data.children.length > 0 && (
        <div className="space-y-3">
          {data.children.map((child) => (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 rounded-xl border bg-gray-50/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                  {child.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{child.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Age {child.age}
                    {child.gender ? ` \u00B7 ${child.gender}` : ""}
                    {child.interests.length > 0
                      ? ` \u00B7 ${child.interests.length} interest${child.interests.length > 1 ? "s" : ""}`
                      : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-teal-600"
                  onClick={() => handleEdit(child)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-red-500"
                  onClick={() => handleRemove(child.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / edit form */}
      <AnimatePresence mode="wait">
        {showForm ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 p-5 rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Child's Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="First name"
                    value={draft.name}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="h-11 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Age <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={18}
                    placeholder="Age"
                    value={draft.age}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        age: e.target.value === "" ? "" : parseInt(e.target.value, 10),
                      }))
                    }
                    className="h-11 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Gender{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Select
                  value={draft.gender}
                  onValueChange={(val) =>
                    setDraft((prev) => ({ ...prev, gender: val }))
                  }
                >
                  <SelectTrigger className="h-11 bg-white">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Boy">Boy</SelectItem>
                    <SelectItem value="Girl">Girl</SelectItem>
                    <SelectItem value="Non-binary">Non-binary</SelectItem>
                    <SelectItem value="Prefer not to say">
                      Prefer not to say
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Interests tag input */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Interests / Activities{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    ref={interestRef}
                    placeholder="e.g. Soccer, Piano, Drawing..."
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addInterest();
                      }
                    }}
                    className="h-11 bg-white"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addInterest}
                    className="h-11 px-4 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {draft.interests.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {draft.interests.map((interest) => (
                      <Badge
                        key={interest}
                        variant="secondary"
                        className="gap-1 pr-1 cursor-pointer hover:bg-destructive/10"
                        onClick={() => removeInterest(interest)}
                      >
                        {interest}
                        <X className="w-3 h-3" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Form actions */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  onClick={handleSaveChild}
                  disabled={!draft.name.trim() || draft.age === ""}
                  className="gap-2 bg-teal-600 hover:bg-teal-700 text-white border-0"
                >
                  <Check className="w-4 h-4" />
                  {editingId ? "Update Child" : "Add Child"}
                </Button>
                {(data.children.length > 0 || editingId) && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      resetDraft();
                      setShowForm(false);
                    }}
                    className="text-muted-foreground"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="add-btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Button
              variant="outline"
              onClick={() => {
                resetDraft();
                setShowForm(true);
              }}
              className="w-full h-14 border-dashed border-2 border-gray-300 hover:border-teal-400 hover:bg-teal-50/50 text-muted-foreground hover:text-teal-700 transition-colors gap-2"
            >
              <Plus className="w-5 h-5" />
              Add {data.children.length > 0 ? "Another" : "a"} Child
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {data.children.length === 0 && !showForm && (
        <p className="text-center text-sm text-muted-foreground">
          Add at least one child to continue
        </p>
      )}
    </div>
  );
}

// ===========================================================================
// STEP 4: Education Goals
// ===========================================================================

function StepEducationGoals({
  data,
  update,
}: {
  data: OnboardingData;
  update: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void;
}) {
  const updateGoal = (
    childId: string,
    field: keyof Omit<ChildGoals, "childId">,
    value: string
  ) => {
    const existing = data.goals.find((g) => g.childId === childId);
    if (existing) {
      update(
        "goals",
        data.goals.map((g) =>
          g.childId === childId ? { ...g, [field]: value } : g
        )
      );
    } else {
      update("goals", [
        ...data.goals,
        { childId, academic: "", lifeSkills: "", hobbies: "", [field]: value },
      ]);
    }
  };

  if (data.children.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>Add children first to set education goals.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {data.children.map((child) => {
        const goals = data.goals.find((g) => g.childId === child.id) ?? {
          childId: child.id,
          academic: "",
          lifeSkills: "",
          hobbies: "",
        };

        return (
          <motion.div
            key={child.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 pb-2 border-b">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center text-white font-bold text-xs">
                {child.name.charAt(0).toUpperCase()}
              </div>
              <h3 className="font-semibold text-foreground">{child.name}</h3>
              <span className="text-xs text-muted-foreground">
                Age {child.age}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  <Label className="text-sm font-medium">Academic Goals</Label>
                </div>
                <Textarea
                  placeholder="e.g. Improve reading skills, learn multiplication tables..."
                  value={goals.academic}
                  onChange={(e) =>
                    updateGoal(child.id, "academic", e.target.value)
                  }
                  rows={2}
                  className="resize-none bg-white"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <Label className="text-sm font-medium">Life Skills</Label>
                </div>
                <Textarea
                  placeholder="e.g. Cooking basics, money management, social skills..."
                  value={goals.lifeSkills}
                  onChange={(e) =>
                    updateGoal(child.id, "lifeSkills", e.target.value)
                  }
                  rows={2}
                  className="resize-none bg-white"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-purple-500" />
                  <Label className="text-sm font-medium">
                    Hobbies & Interests to Explore
                  </Label>
                </div>
                <Textarea
                  placeholder="e.g. Learn guitar, try pottery, join a sports team..."
                  value={goals.hobbies}
                  onChange={(e) =>
                    updateGoal(child.id, "hobbies", e.target.value)
                  }
                  rows={2}
                  className="resize-none bg-white"
                />
              </div>
            </div>
          </motion.div>
        );
      })}

      <p className="text-xs text-center text-muted-foreground pt-2">
        These goals will help us suggest personalized activities and learning
        plans for your children.
      </p>
    </div>
  );
}

// ===========================================================================
// STEP 5: Custody Schedule (only for two households)
// ===========================================================================

function StepCustodySchedule({
  data,
  update,
}: {
  data: OnboardingData;
  update: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void;
}) {
  const schedule = data.custodySchedule;

  const updateSchedule = (
    field: keyof CustodySchedule,
    value: string | number
  ) => {
    update("custodySchedule", { ...schedule, [field]: value });
  };

  const patterns: {
    value: CustodySchedule["pattern"];
    title: string;
    description: string;
    icon: typeof CalendarDays;
  }[] = [
    {
      value: "every_weekend",
      title: "Every Weekend",
      description: "Arrives Friday, leaves Sunday",
      icon: CalendarDays,
    },
    {
      value: "every_other_week",
      title: "Every Other Week",
      description: "Alternating full weeks",
      icon: CalendarDays,
    },
    {
      value: "custom_split",
      title: "Custom Split",
      description: "Set your own percentage",
      icon: CalendarDays,
    },
  ];

  const splitOptions: { value: string; label: string }[] = [
    { value: "50_50", label: "50/50 Split" },
    { value: "alternating", label: "Alternating Years" },
    { value: "custom", label: "Custom" },
  ];

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return (
    <div className="space-y-8">
      {/* Pattern selection */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Custody Pattern</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {patterns.map((p) => {
            const isSelected = schedule.pattern === p.value;
            return (
              <motion.button
                key={p.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => updateSchedule("pattern", p.value)}
                className={cn(
                  "flex flex-col items-center text-center p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                  isSelected
                    ? "border-teal-500 bg-teal-50/80 shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300"
                )}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2"
                  >
                    <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </motion.div>
                )}
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors",
                    isSelected
                      ? "bg-teal-500 text-white"
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  <p.icon className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-sm mb-0.5">{p.title}</h4>
                <p className="text-xs text-muted-foreground">
                  {p.description}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Timing details */}
      {schedule.pattern && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Custom percentage slider */}
          {schedule.pattern === "custom_split" && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">
                Time Split: Parent A {schedule.customPercentage}% / Parent B{" "}
                {100 - schedule.customPercentage}%
              </Label>
              <div className="relative pt-2">
                <input
                  type="range"
                  min={10}
                  max={90}
                  step={5}
                  value={schedule.customPercentage}
                  onChange={(e) =>
                    updateSchedule("customPercentage", parseInt(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>10%</span>
                  <span>50/50</span>
                  <span>90%</span>
                </div>
              </div>
            </div>
          )}

          {/* Arrival/Departure */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Arrival Day</Label>
              <Select
                value={schedule.arrivalDay}
                onValueChange={(v) => updateSchedule("arrivalDay", v)}
              >
                <SelectTrigger className="h-11 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {days.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Arrival Time</Label>
              <Input
                type="time"
                value={schedule.arrivalTime}
                onChange={(e) =>
                  updateSchedule("arrivalTime", e.target.value)
                }
                className="h-11 bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Departure Day</Label>
              <Select
                value={schedule.departureDay}
                onValueChange={(v) => updateSchedule("departureDay", v)}
              >
                <SelectTrigger className="h-11 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {days.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Departure Time</Label>
              <Input
                type="time"
                value={schedule.departureTime}
                onChange={(e) =>
                  updateSchedule("departureTime", e.target.value)
                }
                className="h-11 bg-white"
              />
            </div>
          </div>

          {/* Vacation rules */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TreePine className="w-4 h-4 text-green-600" />
              <Label className="text-sm font-semibold">Vacation Rules</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Summer */}
              <div className="space-y-2 p-4 rounded-xl border bg-amber-50/50">
                <div className="flex items-center gap-2 mb-1">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <Label className="text-sm font-medium">Summer Break</Label>
                </div>
                <Select
                  value={schedule.summerSplit}
                  onValueChange={(v) => updateSchedule("summerSplit", v)}
                >
                  <SelectTrigger className="h-10 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {splitOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Winter */}
              <div className="space-y-2 p-4 rounded-xl border bg-blue-50/50">
                <div className="flex items-center gap-2 mb-1">
                  <Snowflake className="w-4 h-4 text-blue-500" />
                  <Label className="text-sm font-medium">Winter Break</Label>
                </div>
                <Select
                  value={schedule.winterSplit}
                  onValueChange={(v) => updateSchedule("winterSplit", v)}
                >
                  <SelectTrigger className="h-10 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {splitOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Holidays */}
              <div className="space-y-2 p-4 rounded-xl border bg-red-50/50">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-4 h-4 text-red-500" />
                  <Label className="text-sm font-medium">
                    Christmas / Holidays
                  </Label>
                </div>
                <Select
                  value={schedule.holidaySplit}
                  onValueChange={(v) => updateSchedule("holidaySplit", v)}
                >
                  <SelectTrigger className="h-10 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {splitOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
