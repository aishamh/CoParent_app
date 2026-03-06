import { useState } from "react";
import Layout from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { format, parseISO, startOfYear, endOfYear, eachMonthOfInterval, getDay, getDaysInMonth, startOfMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Plus, Edit, Trash2, Calendar as CalendarIcon, Download, Upload, Share2, Filter, X, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Event, InsertEvent, Child } from "@shared/schema";
import { readICSFile, validateICSFile, convertICSEventsToEvents } from "@/lib/ics-parser";

// Form data mirrors InsertEvent (snake_case) plus address fields for the UI
interface EventFormData {
  child_id?: number;
  title: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  time_zone: string;
  parent: string;
  type: string;
  recurrence: string;
  recurrence_interval: number;
  recurrence_end: string;
  recurrence_days: string;
  description: string;
  location: string;
  address: string;
  city: string;
  postal_code: string;
}

const DEFAULT_FORM_DATA: EventFormData = {
  child_id: undefined,
  title: "",
  start_date: "",
  end_date: "",
  start_time: "09:00",
  end_time: "10:00",
  time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  parent: "A",
  type: "custody",
  recurrence: "none",
  recurrence_interval: 1,
  recurrence_end: "",
  recurrence_days: "[]",
  description: "",
  location: "",
  address: "",
  city: "",
  postal_code: "",
};

export default function CalendarPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Filter states
  const [filterParent, setFilterParent] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterChild, setFilterChild] = useState<string>("all");

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => api.getEvents(),
  });

  // Filter events
  const filteredEvents = events.filter((event: Event) => {
    if (filterParent !== "all" && event.parent !== filterParent) return false;
    if (filterType !== "all" && event.type !== filterType) return false;
    if (filterChild !== "all") {
      if (filterChild === "unassigned" && event.child_id) return false;
      if (filterChild !== "unassigned" && event.child_id?.toString() !== filterChild) return false;
    }
    return true;
  });

  const handleShare = () => {
    setIsShareOpen(true);
  };

  const getShareableLink = () => {
    const url = new URL(window.location.href);
    if (filterParent !== "all") url.searchParams.set('parent', filterParent);
    if (filterType !== "all") url.searchParams.set('type', filterType);
    if (filterChild !== "all") url.searchParams.set('child', filterChild);
    return url.toString();
  };

  const copyShareLink = () => {
    const link = getShareableLink();
    navigator.clipboard.writeText(link).then(() => {
      toast({
        title: "Link copied!",
        description: "Calendar link has been copied to clipboard.",
      });
      setIsShareOpen(false);
    }).catch(() => {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Could not copy the link to clipboard.",
      });
    });
  };

  const shareViaEmail = () => {
    const link = getShareableLink();
    const subject = encodeURIComponent(`Our Co-Parent Calendar - ${viewYear}`);
    const body = encodeURIComponent(`Check out our co-parenting calendar:\n\n${link}\n\nThis link includes our schedule and events.`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setIsShareOpen(false);
  };

  const exportAndShare = () => {
    handleExport();
    setIsShareOpen(false);
    toast({
      title: "Export + Share",
      description: "Calendar exported! You can now attach the .ics file to an email or message.",
    });
  };

  const handleExport = () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Co-Parent App//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    filteredEvents.forEach((event: Event) => {
      const startDateFormatted = event.start_date.replace(/-/g, '');
      const endDateFormatted = event.end_date.replace(/-/g, '');
      const startTimeFormatted = event.start_time.replace(/:/g, '');
      const endTimeFormatted = event.end_time.replace(/:/g, '');

      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`DTSTART:${startDateFormatted}T${startTimeFormatted}00`);
      icsContent.push(`DTEND:${endDateFormatted}T${endTimeFormatted}00`);
      icsContent.push(`SUMMARY:${event.title}`);
      icsContent.push(`DESCRIPTION:${event.description || ''}`);
      if (event.location) {
        icsContent.push(`LOCATION:${event.location}`);
      }
      icsContent.push('END:VEVENT');
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `coparent-calendar-${format(new Date(), 'yyyy-MM-dd')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Calendar exported",
      description: "Your calendar has been downloaded as an iCal file.",
    });
  };

  const clearFilters = () => {
    setFilterParent("all");
    setFilterType("all");
    setFilterChild("all");
  };

  const handleImportCalendar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateICSFile(file);
    if (!validation.valid) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: validation.error,
      });
      return;
    }

    try {
      toast({
        title: "Importing calendar...",
        description: "Please wait while we import your events.",
      });

      const icsEvents = await readICSFile(file);

      if (icsEvents.length === 0) {
        toast({
          variant: "destructive",
          title: "No events found",
          description: "The ICS file doesn't contain any events.",
        });
        return;
      }

      // convertICSEventsToEvents returns camelCase objects; convert to snake_case for Supabase
      const convertedEvents = convertICSEventsToEvents(icsEvents);

      let successCount = 0;
      let errorCount = 0;

      for (const eventData of convertedEvents) {
        try {
          const newEvent = {
            child_id: eventData.childId || null,
            title: eventData.title,
            start_date: eventData.startDate,
            end_date: eventData.endDate,
            start_time: eventData.startTime,
            end_time: eventData.endTime,
            time_zone: eventData.timeZone,
            parent: eventData.parent,
            type: eventData.type,
            recurrence: eventData.recurrence || null,
            recurrence_interval: eventData.recurrenceInterval || 1,
            recurrence_end: eventData.recurrenceEnd || null,
            recurrence_days: eventData.recurrenceDays || null,
            description: eventData.description || null,
            location: eventData.location || null,
          };
          await api.createEvent(newEvent);
          successCount++;
        } catch (importError: unknown) {
          console.error('Error creating event:', importError);
          errorCount++;
        }
      }

      queryClient.invalidateQueries({ queryKey: ["events"] });

      toast({
        title: "Import completed",
        description: `Successfully imported ${successCount} events${errorCount > 0 ? ` (${errorCount} failed)` : ''}.`,
      });
    } catch (importError: unknown) {
      console.error('Import error:', importError);
      toast({
        variant: "destructive",
        title: "Import failed",
        description: importError instanceof Error ? importError.message : "Failed to import calendar file.",
      });
    }

    e.target.value = '';
  };

  const { data: children = [] } = useQuery({
    queryKey: ["children"],
    queryFn: () => api.getChildren(),
  });

  const [formData, setFormData] = useState<EventFormData>({ ...DEFAULT_FORM_DATA });

  const [showRepeatOptions, setShowRepeatOptions] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (event: Record<string, unknown>) => {
      const result = await api.createEvent(event);
      if (!result) throw new Error("Failed to create event");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Event created",
        description: "The event has been added to the calendar.",
      });
      closeDialog();
    },
    onError: (error: Error) => {
      console.error("Event creation error:", error);
      toast({
        variant: "destructive",
        title: "Error creating event",
        description: error.message || "Failed to create event. Please try again.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      const result = await api.updateEvent(id, data);
      if (!result) throw new Error("Failed to update event");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Event updated",
        description: "The event has been updated.",
      });
      closeDialog();
    },
    onError: (error: Error) => {
      console.error("Event update error:", error);
      toast({
        variant: "destructive",
        title: "Error updating event",
        description: error.message || "Failed to update event. Please try again.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const success = await api.deleteEvent(id);
      if (!success) throw new Error("Failed to delete event");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Event deleted",
        description: "The event has been removed from the calendar.",
      });
      closeDialog();
    },
    onError: (error: Error) => {
      console.error("Event deletion error:", error);
      toast({
        variant: "destructive",
        title: "Error deleting event",
        description: error.message || "Failed to delete event. Please try again.",
      });
    },
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setIsEditMode(false);
    setSelectedEvent(null);
    setSelectedDate(null);
    setShowRepeatOptions(false);
    setFormData({ ...DEFAULT_FORM_DATA });
  };

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const existingEvent = events.find((e: Event) => {
      return dateStr >= e.start_date && dateStr <= e.end_date;
    });

    if (existingEvent) {
      setSelectedEvent(existingEvent);
      setFormData({
        child_id: existingEvent.child_id ?? undefined,
        title: existingEvent.title,
        start_date: existingEvent.start_date,
        end_date: existingEvent.end_date,
        start_time: existingEvent.start_time,
        end_time: existingEvent.end_time,
        time_zone: existingEvent.time_zone,
        parent: existingEvent.parent,
        type: existingEvent.type,
        recurrence: existingEvent.recurrence || "none",
        recurrence_interval: existingEvent.recurrence_interval || 1,
        recurrence_end: existingEvent.recurrence_end || "",
        recurrence_days: existingEvent.recurrence_days || "[]",
        description: existingEvent.description || "",
        location: existingEvent.location || "",
        address: existingEvent.address || "",
        city: existingEvent.city || "",
        postal_code: existingEvent.postal_code || "",
      });
      setIsEditMode(true);
      setIsDialogOpen(true);
    } else {
      setSelectedDate(dateStr);
      setFormData({
        ...formData,
        start_date: dateStr,
        end_date: dateStr,
      });
      setIsEditMode(false);
      setIsDialogOpen(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Separate address fields (UI-only) from the event data
    const { address, city, postal_code, recurrence, recurrence_end, recurrence_days, child_id, ...restFormData } = formData;

    const eventData: Record<string, unknown> = {
      ...restFormData,
      ...(child_id && child_id !== 0 ? { child_id } : {}),
      start_date: formData.start_date || new Date().toISOString().split('T')[0],
      end_date: formData.end_date || new Date().toISOString().split('T')[0],
      start_time: formData.start_time || "09:00",
      end_time: formData.end_time || "10:00",
      time_zone: formData.time_zone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      // Only include recurrence fields if they have meaningful values
      ...(recurrence && recurrence !== "none" ? { recurrence } : {}),
      ...(formData.recurrence_interval && formData.recurrence_interval !== 1 ? { recurrence_interval: formData.recurrence_interval } : {}),
      ...(recurrence_end ? { recurrence_end } : {}),
      ...(recurrence_days && recurrence_days !== "[]" ? { recurrence_days } : {}),
      // Include address fields that exist in the schema
      ...(address ? { address } : {}),
      ...(city ? { city } : {}),
      ...(postal_code ? { postal_code } : {}),
    };

    // Combine address info into description if present
    if (address || city || postal_code) {
      const addressParts = [address, city, postal_code].filter(Boolean);
      const currentDescription = (eventData.description as string) || "";
      eventData.description = currentDescription
        ? `${currentDescription}\n\nAddress: ${addressParts.join(", ")}`
        : `Address: ${addressParts.join(", ")}`;
    }

    if (isEditMode && selectedEvent) {
      updateMutation.mutate({
        id: selectedEvent.id,
        data: eventData,
      });
    } else {
      createMutation.mutate(eventData);
    }
  };

  const handleDelete = () => {
    if (selectedEvent) {
      deleteMutation.mutate(selectedEvent.id);
    }
  };

  // Calendar rendering
  const currentYear = new Date().getFullYear();
  const [viewYear, setViewYear] = useState(currentYear);
  const yearStart = startOfYear(new Date(viewYear, 0, 1));
  const yearEnd = endOfYear(yearStart);
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  const getEventForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return filteredEvents.find((e: Event) => dateStr >= e.start_date && dateStr <= e.end_date);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading calendar...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Yearly Plan</h1>
            <p className="text-muted-foreground mt-1">{viewYear} Schedule Overview</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setViewYear(viewYear - 1)}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> {viewYear - 1}
            </Button>
            <Button
              onClick={() => setViewYear(viewYear + 1)}
              variant="outline"
              size="sm"
            >
              {viewYear + 1} <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={() => {
                setIsEditMode(false);
                setIsDialogOpen(true);
              }}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Event
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex"
              onClick={() => setIsFilterOpen(true)}
            >
              <Filter className="w-4 h-4 mr-2" /> Filter
              {(filterParent !== "all" || filterType !== "all" || filterChild !== "all") && (
                <span className="ml-1 w-2 h-2 bg-primary rounded-full" />
              )}
            </Button>
            <Label
              htmlFor="ics-import"
              className="cursor-pointer"
            >
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('ics-import')?.click();
                }}
                asChild
              >
                <span>
                  <Upload className="w-4 h-4 mr-2" /> Import
                </span>
              </Button>
            </Label>
            <input
              id="ics-import"
              type="file"
              accept=".ics"
              onChange={handleImportCalendar}
              className="hidden"
            />
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
            <Button size="sm" className="bg-primary text-white hover:bg-primary/90" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-sm bg-white p-3 rounded-lg border border-border w-fit shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[hsl(150_30%_60%)]"></div>
            <span>Parent A</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[hsl(15_50%_65%)]"></div>
            <span>Parent B</span>
          </div>
          <div className="w-px h-4 bg-border mx-2"></div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <span>Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-400"></div>
            <span>Travel</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {months.map((month) => (
            <div key={month.toString()} className="bg-white rounded-xl p-4 shadow-sm border border-border/50">
              <h3 className="font-display font-bold text-lg mb-4 text-center">{format(month, 'MMMM')}</h3>

              <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
                  <div key={`${d}-${idx}`} className="font-medium">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for start of month */}
                {Array.from({ length: getDay(startOfMonth(month)) }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {/* Days */}
                {Array.from({ length: getDaysInMonth(month) }).map((_, i) => {
                  const date = new Date(viewYear, month.getMonth(), i + 1);
                  const event = getEventForDate(date);

                  let bgClass = "bg-transparent";

                  if (event) {
                    if (event.type === 'travel') {
                      bgClass = "bg-purple-100 text-purple-700 ring-1 ring-purple-200";
                    } else if (event.type === 'holiday') {
                      bgClass = "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200";
                    } else if (event.parent === 'A') {
                      bgClass = "bg-[hsl(150_30%_60%)]/20 text-[hsl(150_30%_30%)]";
                    } else {
                      bgClass = "bg-[hsl(15_50%_65%)]/20 text-[hsl(15_50%_40%)]";
                    }
                  }

                  return (
                    <TooltipProvider key={i}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "aspect-square flex items-center justify-center rounded-md text-sm cursor-pointer transition-all hover:scale-110",
                              bgClass,
                              !event && "hover:bg-muted"
                            )}
                            onClick={() => handleDateClick(date)}
                          >
                            {i + 1}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{format(date, 'MMM do, yyyy')}</p>
                          {event ? (
                            <div className="text-xs text-muted-foreground">
                              <p className="font-semibold text-foreground capitalize">{event.title}</p>
                              <p className="capitalize">{event.type} • Parent {event.parent}</p>
                              <p>{event.start_time} - {event.end_time} ({event.time_zone})</p>
                              {event.start_date !== event.end_date && (
                                <p>{format(parseISO(event.start_date), 'MMM do')} - {format(parseISO(event.end_date), 'MMM do')}</p>
                              )}
                              {event.recurrence && event.recurrence !== 'none' && (
                                <p className="text-primary">Repeats {event.recurrence}</p>
                              )}
                              {event.location && <p>📍 {event.location}</p>}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Click to add event
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Event Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{isEditMode ? "Edit Event" : "Create Event"}</DialogTitle>
                <DialogDescription>
                  {isEditMode ? "Update the event details" : "Add a new event to the calendar"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Custody - Parent A"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                {/* Date and Time Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => {
                        const newStartDate = e.target.value;
                        setFormData({
                          ...formData,
                          start_date: newStartDate,
                          end_date: formData.end_date && formData.start_date && formData.end_date < formData.start_date
                            ? newStartDate
                            : formData.end_date
                        });
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Start Time *</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date *</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      min={formData.start_date}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">End Time *</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Time Zone and Duration Display */}
                <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Time Zone:</span>
                    <span className="font-medium">{formData.time_zone}</span>
                  </div>
                  {formData.start_date && formData.end_date && formData.start_time && formData.end_time && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">
                        {format(parseISO(formData.start_date), 'MMM do, yyyy')} at {formData.start_time} - {formData.end_time}
                        {formData.start_date !== formData.end_date && (
                          <> to {format(parseISO(formData.end_date), 'MMM do, yyyy')}</>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Child and Parent Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="child_id">Child</Label>
                    <Select
                      value={formData.child_id?.toString() || "all"}
                      onValueChange={(value: string) => setFormData({ ...formData, child_id: value === "all" ? undefined : parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All children" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All children</SelectItem>
                        {children.map((child: Child) => (
                          <SelectItem key={child.id} value={child.id.toString()}>
                            {child.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parent">Parent *</Label>
                    <Select
                      value={formData.parent}
                      onValueChange={(value: string) => setFormData({ ...formData, parent: value })}
                      required
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
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <Label htmlFor="type">Event Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: string) => setFormData({ ...formData, type: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custody">Custody</SelectItem>
                      <SelectItem value="holiday">Holiday</SelectItem>
                      <SelectItem value="activity">Activity</SelectItem>
                      <SelectItem value="travel">Travel</SelectItem>
                      <SelectItem value="medical">Medical</SelectItem>
                      <SelectItem value="school">School</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Repeat Section */}
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="recurrence">Repeat</Label>
                    <Select
                      value={formData.recurrence || "none"}
                      onValueChange={(value: string) => {
                        setFormData({ ...formData, recurrence: value });
                        setShowRepeatOptions(value !== "none");
                      }}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Does not repeat</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="custom">Custom...</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {showRepeatOptions && (
                    <div className="space-y-3 bg-muted/50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Repeats</span>
                        <span className="text-sm font-medium capitalize">
                          {formData.recurrence === "biweekly" ? "every 2 weeks" : formData.recurrence}
                        </span>
                      </div>

                      {formData.recurrence === "weekly" && (
                        <div className="space-y-2">
                          <Label className="text-xs">Repeat on these days</Label>
                          <div className="flex gap-1">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                              <button
                                key={`${day}-${idx}`}
                                type="button"
                                className={cn(
                                  "w-8 h-8 rounded-md text-xs font-medium transition-colors",
                                  JSON.parse(formData.recurrence_days || "[]").includes(idx)
                                    ? "bg-primary text-white"
                                    : "bg-background border border-border hover:bg-muted"
                                )}
                                onClick={() => {
                                  const days: number[] = JSON.parse(formData.recurrence_days || "[]");
                                  const newDays = days.includes(idx)
                                    ? days.filter((d: number) => d !== idx)
                                    : [...days, idx];
                                  setFormData({ ...formData, recurrence_days: JSON.stringify(newDays) });
                                }}
                              >
                                {day}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="recurrence_end" className="text-xs">Ends</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="recurrence_end"
                            type="date"
                            value={formData.recurrence_end || ""}
                            onChange={(e) => setFormData({ ...formData, recurrence_end: e.target.value })}
                            placeholder="Never"
                            min={formData.start_date}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Location & Address */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location Name</Label>
                    <Input
                      id="location"
                      placeholder="e.g., Home, School, Central Park"
                      value={formData.location || ""}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Street Address</Label>
                      <Input
                        id="address"
                        placeholder="123 Main St"
                        value={formData.address || ""}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="Oslo"
                        value={formData.city || ""}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Postal/ZIP Code</Label>
                    <Input
                      id="postal_code"
                      placeholder="0001"
                      value={formData.postal_code || ""}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    />
                  </div>

                  {(formData.address || formData.city || formData.postal_code) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const fullAddress = [formData.address, formData.city, formData.postal_code]
                          .filter(Boolean)
                          .join(', ');
                        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
                        window.open(mapUrl, '_blank');
                      }}
                      className="w-full"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      View on Google Maps
                    </Button>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Add any additional notes..."
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter className="gap-2">
                {isEditMode && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDialog}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {isEditMode ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Filter Dialog */}
        <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Filter Calendar</DialogTitle>
              <DialogDescription>
                Filter events by parent, type, or child
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Parent</Label>
                <Select value={filterParent} onValueChange={setFilterParent}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Parents</SelectItem>
                    <SelectItem value="A">Parent A</SelectItem>
                    <SelectItem value="B">Parent B</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Event Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="custody">Custody</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="activity">Activity</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                    <SelectItem value="school">School</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Child</Label>
                <Select value={filterChild} onValueChange={setFilterChild}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Children</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {children.map((child: Child) => (
                      <SelectItem key={child.id} value={child.id.toString()}>
                        {child.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex-1"
              >
                Clear All
              </Button>
              <Button
                onClick={() => setIsFilterOpen(false)}
                className="flex-1"
              >
                Apply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Share Dialog */}
        <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Share Calendar</DialogTitle>
              <DialogDescription>
                Share your co-parenting calendar with your co-parent or others
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Copy Link */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Shareable Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={getShareableLink()}
                    readOnly
                    className="flex-1"
                  />
                  <Button onClick={copyShareLink} size="sm">
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this link to give access to your calendar
                </p>
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm font-medium mb-3">Share via</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Email */}
                  <Button
                    variant="outline"
                    onClick={shareViaEmail}
                    className="h-auto py-3 flex flex-col items-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    <span className="text-sm">Email</span>
                  </Button>

                  {/* Export & Attach */}
                  <Button
                    variant="outline"
                    onClick={exportAndShare}
                    className="h-auto py-3 flex flex-col items-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    <span className="text-sm">Export & File</span>
                  </Button>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                <p className="font-medium mb-1">Tips:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Copy the link and send it via your preferred messaging app</li>
                  <li>Export to .ics and import into Google Calendar, Apple Calendar, or Outlook</li>
                  <li>Use the Import button to add events from other calendars</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsShareOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
