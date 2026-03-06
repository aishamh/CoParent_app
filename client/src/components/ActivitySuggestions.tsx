import { SUGGESTED_ACTIVITIES } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, ArrowRight, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function ActivitySuggestions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addToPlanMutation = useMutation({
    mutationFn: async (eventData: Record<string, unknown>) => {
      const newEvent = {
        child_id: (eventData.child_id as number | null) || null,
        title: eventData.title as string,
        start_date: eventData.start_date as string,
        end_date: eventData.end_date as string,
        start_time: (eventData.start_time as string) || "00:00",
        end_time: (eventData.end_time as string) || "23:59",
        time_zone: (eventData.time_zone as string) || "Europe/Oslo",
        parent: (eventData.parent as string) || "A",
        type: (eventData.type as string) || "custody",
        description: (eventData.description as string | null) || null,
        location: (eventData.location as string | null) || null,
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
        title: "Activity added to plan",
        description: "The activity has been added to your calendar.",
      });
    },
    onError: (error: Error) => {
      console.error("Error adding activity:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add activity to plan.",
      });
    },
  });

  const handleAddToPlan = (activity: typeof SUGGESTED_ACTIVITIES[0]) => {
    const today = new Date().toISOString().split("T")[0];
    const eventData: Record<string, unknown> = {
      child_id: null,
      title: activity.title,
      start_date: today,
      end_date: today,
      start_time: "09:00",
      end_time: "10:00",
      time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      parent: "A",
      type: "custody",
      description: activity.description,
      location: "",
    };

    addToPlanMutation.mutate(eventData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold">Suggested Activities</h2>
        <Button variant="link" className="text-primary" onClick={() => window.location.href = '/activities'}>
          View All
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {SUGGESTED_ACTIVITIES.slice(0, 3).map((activity) => (
          <Card key={activity.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow group">
            <div className="relative h-32 overflow-hidden">
              <img
                src={activity.image}
                alt={activity.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <Badge className="absolute top-2 right-2 bg-white/90 text-foreground backdrop-blur-sm hover:bg-white">
                {activity.category}
              </Badge>
            </div>
            <CardHeader className="p-4 pb-2">
              <h3 className="font-display font-bold text-lg">{activity.title}</h3>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
              <p className="line-clamp-2 mb-3">{activity.description}</p>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {activity.ageRange} yrs
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {activity.duration}
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
               <Button
                 variant="outline"
                 size="sm"
                 className="w-full group-hover:bg-secondary group-hover:border-secondary transition-colors"
                 onClick={() => handleAddToPlan(activity)}
                 disabled={addToPlanMutation.isPending}
               >
                 <Calendar className="w-4 h-4 mr-2" />
                 {addToPlanMutation.isPending ? "Adding..." : "Add to Plan"}
                 <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
               </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
