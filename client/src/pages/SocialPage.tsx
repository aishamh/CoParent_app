import { useState } from "react";
import Layout from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFriends, createFriend, deleteFriend, getSocialEvents, createSocialEvent, updateSocialEvent } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, Calendar as CalendarIcon, MapPin, PartyPopper, Trash2 } from "lucide-react";

function parseKids(kids: string): string[] {
  try {
    const parsed = JSON.parse(kids);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatEventDate(dateStr: string): { month: string; day: string; full: string } {
  const date = new Date(dateStr);
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate().toString();
  const full = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return { month, day, full };
}

export default function SocialPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [isSuggestActivityOpen, setIsSuggestActivityOpen] = useState(false);
  const [friendData, setFriendData] = useState({ name: "", email: "", relation: "", kids: "" });
  const [activityData, setActivityData] = useState({ title: "", date: "", time: "", location: "", friend_id: "" });
  const [selectedFriendName, setSelectedFriendName] = useState("");

  const { data: friends = [], isLoading: friendsLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: () => getFriends()
  });

  const { data: socialEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["socialEvents"],
    queryFn: () => getSocialEvents()
  });

  const pendingEvents = socialEvents.filter((e) => e.rsvp_status === "pending");
  const upcomingEvents = socialEvents.filter((e) => e.rsvp_status !== "declined");

  const createFriendMutation = useMutation({
    mutationFn: (data: { name: string; email: string; relation: string; kids: string }) => {
      const kidsArray = data.kids
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
      return createFriend({
        name: data.name,
        email: data.email || null,
        relation: data.relation,
        kids: JSON.stringify(kidsArray),
      });
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      toast({
        title: "Friend added!",
        description: `${variables.name} has been added to your circle.`,
      });
      setIsAddFriendOpen(false);
      setFriendData({ name: "", email: "", relation: "", kids: "" });
    },
    onError: () => {
      toast({
        title: "Failed to add friend",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteFriendMutation = useMutation({
    mutationFn: (id: number) => deleteFriend(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      toast({
        title: "Friend removed",
        description: "Friend has been removed from your circle.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to remove friend",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createEventMutation = useMutation({
    mutationFn: (data: { title: string; date: string; location: string; friend_id: string }) => {
      return createSocialEvent({
        title: data.title,
        date: data.date,
        location: data.location || null,
        friend_id: data.friend_id ? parseInt(data.friend_id) : null,
        rsvp_status: "pending",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["socialEvents"] });
      toast({
        title: "Activity suggested!",
        description: "Your playdate suggestion has been created.",
      });
      setIsSuggestActivityOpen(false);
      setActivityData({ title: "", date: "", time: "", location: "", friend_id: "" });
      setSelectedFriendName("");
    },
    onError: () => {
      toast({
        title: "Failed to create activity",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, rsvp_status }: { id: number; rsvp_status: string }) =>
      updateSocialEvent(id, { rsvp_status }),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["socialEvents"] });
      const action = variables.rsvp_status === "accepted" ? "accepted" : "declined";
      toast({
        title: action === "accepted" ? "Invitation accepted!" : "Invitation declined",
        description: `You've ${action} the invitation.`,
        variant: action === "declined" ? "destructive" : "default",
      });
    },
    onError: () => {
      toast({
        title: "Failed to update RSVP",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    createFriendMutation.mutate(friendData);
  };

  const handleSuggestActivity = (e: React.FormEvent) => {
    e.preventDefault();
    createEventMutation.mutate(activityData);
  };

  const handleAcceptInvite = (eventId: number) => {
    updateEventMutation.mutate({ id: eventId, rsvp_status: "accepted" });
  };

  const handleDeclineInvite = (eventId: number) => {
    updateEventMutation.mutate({ id: eventId, rsvp_status: "declined" });
  };

  const handlePlanActivity = (friend: { id: number; name: string }) => {
    setActivityData({ title: "", date: "", time: "", location: "", friend_id: String(friend.id) });
    setSelectedFriendName(friend.name);
    setIsSuggestActivityOpen(true);
  };

  if (friendsLoading || eventsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }
  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Social & Friends</h1>
            <p className="text-muted-foreground">Plan playdates and shared activities with friends and family.</p>
          </div>
          <Dialog open={isAddFriendOpen} onOpenChange={setIsAddFriendOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" /> Add Friend
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddFriend}>
                <DialogHeader>
                  <DialogTitle>Add a Friend</DialogTitle>
                  <DialogDescription>
                    Invite friends and family to coordinate playdates and activities.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Friend's Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={friendData.name}
                      onChange={(e) => setFriendData({ ...friendData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address (optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={friendData.email}
                      onChange={(e) => setFriendData({ ...friendData, email: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Add their email to invite them to join the app
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="relation">Relationship</Label>
                    <Select value={friendData.relation} onValueChange={(value) => setFriendData({ ...friendData, relation: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="friend">Friend</SelectItem>
                        <SelectItem value="family">Family</SelectItem>
                        <SelectItem value="neighbor">Neighbor</SelectItem>
                        <SelectItem value="coworker">Co-worker</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kids">Their Kids' Names (optional)</Label>
                    <Input
                      id="kids"
                      placeholder="Separate with commas"
                      value={friendData.kids}
                      onChange={(e) => setFriendData({ ...friendData, kids: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddFriendOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createFriendMutation.isPending}>
                    {createFriendMutation.isPending ? "Saving..." : "Send Invite"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Friends List */}
          <div className="lg:col-span-2 space-y-6">
             <h2 className="text-xl font-display font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Your Circle
             </h2>
             {friends.length === 0 ? (
               <Card className="border-none shadow-sm soft-shadow">
                 <CardContent className="p-8 text-center">
                   <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                   <p className="text-muted-foreground">
                     No friends yet — add your first friend to start planning playdates!
                   </p>
                   <Button
                     variant="outline"
                     className="mt-4"
                     onClick={() => setIsAddFriendOpen(true)}
                   >
                     <UserPlus className="w-4 h-4 mr-2" /> Add Friend
                   </Button>
                 </CardContent>
               </Card>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {friends.map((friend) => {
                    const kids = parseKids(friend.kids);
                    return (
                      <Card key={friend.id} className="border-none shadow-sm soft-shadow hover:bg-muted/20 transition-colors cursor-pointer">
                         <CardContent className="p-4 flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                               <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                 {friend.avatar || friend.name.charAt(0).toUpperCase()}
                               </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                               <div className="flex items-center justify-between">
                                  <h3 className="font-bold text-foreground">{friend.name}</h3>
                                  <Badge variant="secondary" className="text-xs font-normal">{friend.relation}</Badge>
                               </div>
                               <p className="text-xs text-muted-foreground mt-1">
                                  {kids.length > 0 ? `Kids: ${kids.join(", ")}` : "No kids listed"}
                               </p>
                            </div>
                         </CardContent>
                         <div className="px-4 pb-4 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-8 text-xs"
                              onClick={() => handlePlanActivity({ id: friend.id, name: friend.name })}
                            >
                              Plan Activity
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground">View Profile</Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteFriendMutation.mutate(friend.id);
                              }}
                              disabled={deleteFriendMutation.isPending}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                         </div>
                      </Card>
                    );
                  })}
               </div>
             )}

             <div className="mt-8">
                <h2 className="text-xl font-display font-bold mb-4">Upcoming Social Events</h2>
                {upcomingEvents.length === 0 ? (
                  <Card className="border-none shadow-sm soft-shadow">
                    <CardContent className="p-8 text-center">
                      <CalendarIcon className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        No upcoming events yet. Suggest an activity to get started!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-none shadow-sm soft-shadow">
                     <CardContent className="p-0">
                        {upcomingEvents.map((event) => {
                          const { month, day } = formatEventDate(event.date);
                          const friend = event.friend_id
                            ? friends.find((f) => f.id === event.friend_id)
                            : null;
                          return (
                            <div key={event.id} className="flex items-center p-4 border-b last:border-0 hover:bg-muted/30 transition-colors">
                               <div className="bg-orange-100 text-orange-600 rounded-lg p-3 text-center min-w-[60px]">
                                  <span className="block text-xs font-bold uppercase">{month}</span>
                                  <span className="block text-xl font-bold">{day}</span>
                               </div>
                               <div className="ml-4 flex-1">
                                  <h4 className="font-bold text-foreground">{event.title}</h4>
                                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                     {event.location && (
                                       <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {event.location}</span>
                                     )}
                                     {friend && (
                                       <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> With {friend.name}</span>
                                     )}
                                  </div>
                               </div>
                               {event.rsvp_status === "pending" ? (
                                 <div className="flex gap-2">
                                   <Button
                                     size="sm"
                                     onClick={() => handleAcceptInvite(event.id)}
                                     disabled={updateEventMutation.isPending}
                                   >
                                     Accept
                                   </Button>
                                   <Button
                                     variant="outline"
                                     size="sm"
                                     onClick={() => handleDeclineInvite(event.id)}
                                     disabled={updateEventMutation.isPending}
                                   >
                                     Decline
                                   </Button>
                                 </div>
                               ) : (
                                 <Badge variant={event.rsvp_status === "accepted" ? "default" : "secondary"}>
                                   {event.rsvp_status === "accepted" ? "Going" : "RSVP"}
                                 </Badge>
                               )}
                            </div>
                          );
                        })}
                     </CardContent>
                  </Card>
                )}
             </div>
          </div>

          {/* Suggestions Sidebar */}
          <div className="space-y-6">
             <Card className="bg-gradient-to-br from-pink-500 to-rose-600 text-white border-none shadow-lg">
                <CardHeader>
                   <CardTitle className="text-white">Plan a Playdate</CardTitle>
                </CardHeader>
                <CardContent>
                   <p className="text-pink-100 text-sm mb-4">
                      {friends.length > 0
                        ? `You have ${friends.length} friend${friends.length === 1 ? "" : "s"} in your circle. Suggest an activity!`
                        : "Add friends to start planning playdates together."}
                   </p>
                   <Dialog open={isSuggestActivityOpen} onOpenChange={(open) => {
                     setIsSuggestActivityOpen(open);
                     if (!open) {
                       setActivityData({ title: "", date: "", time: "", location: "", friend_id: "" });
                       setSelectedFriendName("");
                     }
                   }}>
                     <DialogTrigger asChild>
                       <Button variant="secondary" className="w-full bg-white text-pink-600 hover:bg-white/90 border-none">
                         <PartyPopper className="w-4 h-4 mr-2" />
                         Suggest Activity
                       </Button>
                     </DialogTrigger>
                     <DialogContent>
                       <form onSubmit={handleSuggestActivity}>
                         <DialogHeader>
                           <DialogTitle>Suggest a Playdate Activity</DialogTitle>
                           <DialogDescription>
                             {selectedFriendName
                               ? `Propose an activity with ${selectedFriendName}.`
                               : "Propose an activity for a playdate with a friend."}
                           </DialogDescription>
                         </DialogHeader>
                         <div className="space-y-4 py-4">
                           <div className="space-y-2">
                             <Label htmlFor="activity">Activity</Label>
                             <Select value={activityData.title} onValueChange={(value) => setActivityData({ ...activityData, title: value })}>
                               <SelectTrigger>
                                 <SelectValue placeholder="Choose an activity" />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="Visit the Zoo">Visit the Zoo</SelectItem>
                                 <SelectItem value="Playground at the Park">Playground at the Park</SelectItem>
                                 <SelectItem value="Children's Museum">Children's Museum</SelectItem>
                                 <SelectItem value="Swimming Pool">Swimming Pool</SelectItem>
                                 <SelectItem value="Movie Theater">Movie Theater</SelectItem>
                                 <SelectItem value="Picnic & Outdoor Games">Picnic & Outdoor Games</SelectItem>
                               </SelectContent>
                             </Select>
                           </div>
                           {friends.length > 0 && (
                             <div className="space-y-2">
                               <Label htmlFor="friend">With Friend</Label>
                               <Select
                                 value={activityData.friend_id}
                                 onValueChange={(value) => setActivityData({ ...activityData, friend_id: value })}
                               >
                                 <SelectTrigger>
                                   <SelectValue placeholder="Select a friend (optional)" />
                                 </SelectTrigger>
                                 <SelectContent>
                                   {friends.map((f) => (
                                     <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                                   ))}
                                 </SelectContent>
                               </Select>
                             </div>
                           )}
                           <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                               <Label htmlFor="date">Date</Label>
                               <Input
                                 id="date"
                                 type="date"
                                 value={activityData.date}
                                 onChange={(e) => setActivityData({ ...activityData, date: e.target.value })}
                                 required
                               />
                             </div>
                             <div className="space-y-2">
                               <Label htmlFor="time">Time</Label>
                               <Input
                                 id="time"
                                 type="time"
                                 value={activityData.time}
                                 onChange={(e) => setActivityData({ ...activityData, time: e.target.value })}
                                 required
                               />
                             </div>
                           </div>
                           <div className="space-y-2">
                             <Label htmlFor="location">Location (optional)</Label>
                             <Input
                               id="location"
                               placeholder="e.g., Central Park"
                               value={activityData.location}
                               onChange={(e) => setActivityData({ ...activityData, location: e.target.value })}
                             />
                           </div>
                         </div>
                         <DialogFooter>
                           <Button type="button" variant="outline" onClick={() => setIsSuggestActivityOpen(false)}>
                             Cancel
                           </Button>
                           <Button type="submit" disabled={createEventMutation.isPending}>
                             {createEventMutation.isPending ? "Saving..." : "Send Suggestion"}
                           </Button>
                         </DialogFooter>
                       </form>
                     </DialogContent>
                   </Dialog>
                </CardContent>
             </Card>

             <Card>
                <CardHeader>
                   <CardTitle className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Pending Invites</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   {pendingEvents.length === 0 ? (
                     <p className="text-sm text-muted-foreground text-center py-2">No pending invites</p>
                   ) : (
                     pendingEvents.map((event) => {
                       const friend = event.friend_id
                         ? friends.find((f) => f.id === event.friend_id)
                         : null;
                       const { full: dateStr } = formatEventDate(event.date);
                       const initial = friend?.name?.charAt(0).toUpperCase() || "?";
                       return (
                         <div key={event.id} className="flex items-start gap-3">
                            <Avatar className="w-8 h-8">
                               <AvatarFallback className="bg-blue-100 text-blue-600">{initial}</AvatarFallback>
                            </Avatar>
                            <div>
                               <p className="text-sm font-medium">
                                 {friend ? `${friend.name} invited you to` : "You're invited to"} "{event.title}"
                               </p>
                               <p className="text-xs text-muted-foreground mt-0.5">
                                 {dateStr}
                                 {event.location ? ` - ${event.location}` : ""}
                               </p>
                               <div className="flex gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => handleAcceptInvite(event.id)}
                                    disabled={updateEventMutation.isPending}
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => handleDeclineInvite(event.id)}
                                    disabled={updateEventMutation.isPending}
                                  >
                                    Decline
                                  </Button>
                               </div>
                            </div>
                         </div>
                       );
                     })
                   )}
                </CardContent>
             </Card>
          </div>

        </div>
      </div>
    </Layout>
  );
}
