import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMessages, sendMessage, markMessageAsRead, getCurrentUser } from "../lib/api";
import Layout from "@/components/Layout";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Skeleton } from "../components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { useToast } from "../hooks/use-toast";
import {
  Send,
  Lock,
  Shield,
  MessageSquare,
  CheckCheck,
  Check,
  Search,
  Plus,
  ArrowLeft,
  Smile,
  Paperclip,
  FlaskConical,
  MessageCircle,
  Users,
  X,
} from "lucide-react";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import type { Message } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TestMessage {
  id: string;
  senderId: string;
  receiverId: string;
  subject: string | null;
  content: string;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  contentHash: string;
  senderIp: string | null;
  isTest: true;
}

interface Conversation {
  partnerId: string;
  partnerName: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
  isTestConversation?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TEST_PARENT_B_ID = "test-parent-b";

const AUTO_RESPONSES = [
  "Got it, thanks for letting me know.",
  "That works for me. I'll adjust my schedule.",
  "Can we discuss the pickup time?",
  "I'll handle that this weekend.",
  "Sounds good. I'll make sure everything is ready.",
  "Thanks for the update! I appreciate you keeping me in the loop.",
  "OK, I've noted that down. Let me know if anything changes.",
  "I agree, that makes sense for the kids.",
  "Let me check my calendar and get back to you.",
  "Perfect. I'll take care of it on my end.",
  "Could you send me the details when you get a chance?",
  "I think that's a fair arrangement. Let's go with it.",
  "Thanks! The kids will love that.",
  "I'm available that day. Works for me.",
  "Let's try to sort this out before the weekend.",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getParentNames(): { parentA: string; parentB: string } {
  try {
    const raw = localStorage.getItem("onboarding_data");
    if (raw) {
      const data = JSON.parse(raw);
      return {
        parentA: data.parentAName || data.userName || "You",
        parentB: data.parentBName || data.coParentName || "Co-Parent",
      };
    }
  } catch {
    /* ignore */
  }
  return { parentA: "You", parentB: "Co-Parent" };
}

function formatDateLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMMM d, yyyy");
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function pickAutoResponse(lastUsedIndex: number): { text: string; index: number } {
  let idx = Math.floor(Math.random() * AUTO_RESPONSES.length);
  // avoid repeating the last response
  while (idx === lastUsedIndex && AUTO_RESPONSES.length > 1) {
    idx = Math.floor(Math.random() * AUTO_RESPONSES.length);
  }
  return { text: AUTO_RESPONSES[idx], index: idx };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex items-end gap-2 px-4 py-1"
    >
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarFallback className="bg-slate-200 text-slate-600 text-xs">
          B
        </AvatarFallback>
      </Avatar>
      <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block w-2 h-2 rounded-full bg-slate-400"
            animate={{ y: [0, -5, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function DateDivider({ date }: { date: Date }) {
  return (
    <div className="flex items-center gap-3 py-4 px-4">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-xs font-medium text-slate-400 select-none">
        {formatDateLabel(date)}
      </span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

function MessageBubble({
  content,
  timestamp,
  isMine,
  isRead,
  isTest,
  showTail,
}: {
  content: string;
  timestamp: Date;
  isMine: boolean;
  isRead: boolean;
  isTest?: boolean;
  showTail: boolean;
}) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={`flex ${isMine ? "justify-end" : "justify-start"} px-4 py-0.5`}
          >
            <div
              className={`relative max-w-[75%] md:max-w-[60%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words
                ${
                  isMine
                    ? `bg-teal-600 text-white ${
                        showTail ? "rounded-2xl rounded-br-sm" : "rounded-2xl"
                      }`
                    : `bg-slate-100 text-slate-900 ${
                        showTail ? "rounded-2xl rounded-bl-sm" : "rounded-2xl"
                      }`
                }
                ${isTest ? "border border-dashed border-amber-300/60" : ""}
              `}
            >
              {content}
              <span
                className={`flex items-center gap-1 mt-1 text-[10px] ${
                  isMine ? "text-teal-200 justify-end" : "text-slate-400 justify-start"
                }`}
              >
                {format(new Date(timestamp), "h:mm a")}
                {isMine && (
                  isRead ? (
                    <CheckCheck className="h-3 w-3 text-teal-200" />
                  ) : (
                    <Check className="h-3 w-3 text-teal-300/70" />
                  )
                )}
              </span>
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side={isMine ? "left" : "right"}>
          <p className="text-xs">
            {format(new Date(timestamp), "EEEE, MMM d, yyyy 'at' h:mm:ss a")}
          </p>
          {isTest && <p className="text-xs text-amber-400 mt-0.5">Test message</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ConversationSkeleton() {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-3 w-10" />
        </div>
      ))}
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
          <Skeleton
            className={`h-12 rounded-2xl ${i % 2 === 0 ? "w-48" : "w-56"}`}
          />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  onCompose,
  onEnableTest,
}: {
  onCompose: () => void;
  onEnableTest: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center h-full text-center px-8 py-12"
    >
      {/* Illustration */}
      <div className="relative mb-8">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center">
          <MessageCircle className="w-14 h-14 text-teal-400" />
        </div>
        <motion.div
          className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center shadow-lg"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Send className="w-4 h-4 text-white" />
        </motion.div>
        <motion.div
          className="absolute -bottom-1 -left-3 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Shield className="w-4 h-4 text-slate-500" />
        </motion.div>
      </div>

      <h3 className="text-xl font-semibold text-slate-800 mb-2">
        Start a Conversation
      </h3>
      <p className="text-slate-500 max-w-sm mb-8 text-sm leading-relaxed">
        Send secure, court-admissible messages to your co-parent. All messages
        are encrypted, timestamped, and cannot be edited or deleted.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={onCompose} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="h-4 w-4 mr-2" />
          New Message
        </Button>
        <Button variant="outline" onClick={onEnableTest}>
          <FlaskConical className="h-4 w-4 mr-2" />
          Try Test Mode
        </Button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function MessagesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // UI state
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Test mode state
  const [testModeEnabled, setTestModeEnabled] = useState(false);
  const [testMessages, setTestMessages] = useState<TestMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [lastAutoResponseIdx, setLastAutoResponseIdx] = useState(-1);

  // Input state
  const [messageInput, setMessageInput] = useState("");
  const [composeData, setComposeData] = useState({
    receiverId: "",
    subject: "",
    content: "",
  });

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Parent names
  const { parentA, parentB } = useMemo(() => getParentNames(), []);

  // ---------------------------------------------------------------------------
  // API queries
  // ---------------------------------------------------------------------------

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
  });

  const { data: apiMessages = [], isLoading } = useQuery({
    queryKey: ["messages"],
    queryFn: () => getMessages(),
  });

  const sendMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      toast({
        title: "Message sent",
        description: "Your message has been securely delivered and recorded.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message. Please try again.",
      });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: markMessageAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const myId = user?.id || currentUser?.id || "me";

  // Build conversations from real messages + test messages
  const conversations = useMemo<Conversation[]>(() => {
    const map = new Map<string, Conversation>();

    // Real messages
    for (const msg of apiMessages) {
      const partnerId =
        msg.senderId === myId ? msg.receiverId : msg.senderId;
      const existing = map.get(partnerId);
      const msgDate = new Date(msg.createdAt);

      if (!existing || msgDate > existing.lastMessageAt) {
        const unread = apiMessages.filter(
          (m) =>
            m.senderId === partnerId &&
            m.receiverId === myId &&
            !m.isRead
        ).length;
        map.set(partnerId, {
          partnerId,
          partnerName: partnerId,
          lastMessage: msg.content,
          lastMessageAt: msgDate,
          unreadCount: unread,
        });
      }
    }

    // Test conversation (if test mode enabled and there are test messages)
    if (testModeEnabled) {
      const testMsgs = testMessages;
      const lastTest = testMsgs.length > 0 ? testMsgs[testMsgs.length - 1] : null;
      const existing = map.get(TEST_PARENT_B_ID);
      if (!existing || (lastTest && new Date(lastTest.createdAt) > existing.lastMessageAt)) {
        map.set(TEST_PARENT_B_ID, {
          partnerId: TEST_PARENT_B_ID,
          partnerName: parentB,
          lastMessage: lastTest?.content || "Start a test conversation...",
          lastMessageAt: lastTest ? new Date(lastTest.createdAt) : new Date(),
          unreadCount: 0,
          isTestConversation: true,
        });
      } else if (!map.has(TEST_PARENT_B_ID)) {
        map.set(TEST_PARENT_B_ID, {
          partnerId: TEST_PARENT_B_ID,
          partnerName: parentB,
          lastMessage: "Start a test conversation...",
          lastMessageAt: new Date(),
          unreadCount: 0,
          isTestConversation: true,
        });
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
    );
  }, [apiMessages, testMessages, testModeEnabled, myId, parentB]);

  // Messages for the selected conversation
  const activeMessages = useMemo(() => {
    if (!selectedConversationId) return [];

    if (selectedConversationId === TEST_PARENT_B_ID) {
      return testMessages;
    }

    return apiMessages
      .filter(
        (m) =>
          (m.senderId === myId && m.receiverId === selectedConversationId) ||
          (m.receiverId === myId && m.senderId === selectedConversationId)
      )
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }, [selectedConversationId, apiMessages, testMessages, myId]);

  const selectedConversation = conversations.find(
    (c) => c.partnerId === selectedConversationId
  );

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.partnerName.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length, isTyping]);

  // Mark unread messages as read when conversation is selected
  useEffect(() => {
    if (!selectedConversationId || selectedConversationId === TEST_PARENT_B_ID) return;
    const unread = apiMessages.filter(
      (m) =>
        m.senderId === selectedConversationId &&
        m.receiverId === myId &&
        !m.isRead
    );
    for (const msg of unread) {
      markReadMutation.mutate(msg.id);
    }
  }, [selectedConversationId, apiMessages, myId]);

  // Auto-select test conversation when test mode is first enabled
  useEffect(() => {
    if (testModeEnabled && !selectedConversationId) {
      setSelectedConversationId(TEST_PARENT_B_ID);
      setShowMobileChat(true);
    }
  }, [testModeEnabled]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSendMessage = useCallback(() => {
    const text = messageInput.trim();
    if (!text) return;

    if (selectedConversationId === TEST_PARENT_B_ID) {
      // Test mode: add to local state
      const newMsg: TestMessage = {
        id: `test-${Date.now()}`,
        senderId: myId,
        receiverId: TEST_PARENT_B_ID,
        subject: null,
        content: text,
        isRead: true,
        readAt: new Date(),
        createdAt: new Date(),
        contentHash: "test-hash",
        senderIp: null,
        isTest: true,
      };
      setTestMessages((prev) => [...prev, newMsg]);
      setMessageInput("");

      // Auto-respond after 1-2 seconds
      setIsTyping(true);
      const delay = 1000 + Math.random() * 1500;
      setTimeout(() => {
        setIsTyping(false);
        const { text: responseText, index } = pickAutoResponse(lastAutoResponseIdx);
        setLastAutoResponseIdx(index);
        const responseMsg: TestMessage = {
          id: `test-resp-${Date.now()}`,
          senderId: TEST_PARENT_B_ID,
          receiverId: myId,
          subject: null,
          content: responseText,
          isRead: true,
          readAt: new Date(),
          createdAt: new Date(),
          contentHash: "test-hash",
          senderIp: null,
          isTest: true,
        };
        setTestMessages((prev) => [...prev, responseMsg]);
      }, delay);
    } else if (selectedConversationId) {
      // Real message
      sendMutation.mutate({
        receiverId: selectedConversationId,
        subject: "",
        content: text,
      });
      setMessageInput("");
    }
  }, [messageInput, selectedConversationId, myId, lastAutoResponseIdx, sendMutation]);

  const handleComposeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMutation.mutate(composeData, {
      onSuccess: () => {
        setIsComposeOpen(false);
        setComposeData({ receiverId: "", subject: "", content: "" });
        setSelectedConversationId(composeData.receiverId);
        setShowMobileChat(true);
      },
    });
  };

  const handleSelectConversation = (partnerId: string) => {
    setSelectedConversationId(partnerId);
    setShowMobileChat(true);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleToggleTestMode = (enabled: boolean) => {
    setTestModeEnabled(enabled);
    if (enabled) {
      setSelectedConversationId(TEST_PARENT_B_ID);
      setShowMobileChat(true);
      toast({
        title: "Test Mode Enabled",
        description: `You can now practice messaging as ${parentA}. ${parentB} will auto-respond.`,
      });
    } else {
      if (selectedConversationId === TEST_PARENT_B_ID) {
        setSelectedConversationId(null);
        setShowMobileChat(false);
      }
      setTestMessages([]);
      setIsTyping(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderConversationList = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="shrink-0 bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Messages
          </h1>
          <Button
            size="icon"
            variant="ghost"
            className="text-white/90 hover:text-white hover:bg-white/10 h-8 w-8"
            onClick={() => setIsComposeOpen(true)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-300" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/15 text-white placeholder-teal-200 text-sm rounded-lg pl-9 pr-3 py-2 outline-none focus:bg-white/25 transition-colors"
          />
        </div>
      </div>

      {/* Test mode toggle */}
      <div className="shrink-0 px-4 py-3 border-b border-slate-100 bg-slate-50/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-slate-700">Test Mode</span>
          </div>
          <Switch
            checked={testModeEnabled}
            onCheckedChange={handleToggleTestMode}
          />
        </div>
        {testModeEnabled && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-amber-600 mt-1.5"
          >
            Simulating conversation with {parentB}
          </motion.p>
        )}
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <ConversationSkeleton />
        ) : filteredConversations.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400">
            {searchQuery ? "No conversations found" : "No conversations yet"}
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredConversations.map((conv) => (
              <button
                key={conv.partnerId}
                onClick={() => handleSelectConversation(conv.partnerId)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                  selectedConversationId === conv.partnerId
                    ? "bg-teal-50/60"
                    : ""
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback
                      className={
                        conv.isTestConversation
                          ? "bg-amber-100 text-amber-700 text-sm font-semibold"
                          : "bg-teal-100 text-teal-700 text-sm font-semibold"
                      }
                    >
                      {getInitials(conv.partnerName)}
                    </AvatarFallback>
                  </Avatar>
                  {conv.isTestConversation && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                      <FlaskConical className="h-2.5 w-2.5 text-white" />
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-slate-800 truncate">
                      {conv.partnerName}
                    </span>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {isToday(conv.lastMessageAt)
                        ? format(conv.lastMessageAt, "h:mm a")
                        : isYesterday(conv.lastMessageAt)
                        ? "Yesterday"
                        : format(conv.lastMessageAt, "MM/dd/yy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-500 truncate flex-1">
                      {conv.lastMessage}
                    </p>
                    {conv.unreadCount > 0 && (
                      <Badge className="bg-teal-600 text-white text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center rounded-full">
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Court-admissible notice */}
      <div className="shrink-0 border-t border-slate-100 px-4 py-2 bg-slate-50/50">
        <p className="text-[10px] text-slate-400 flex items-center gap-1.5 justify-center">
          <Lock className="h-3 w-3" />
          End-to-end encrypted. Messages are immutable and court-admissible.
        </p>
      </div>
    </div>
  );

  const renderChatView = () => {
    const isTest = selectedConversationId === TEST_PARENT_B_ID;
    const partnerName = selectedConversation?.partnerName || selectedConversationId || "";

    return (
      <div className="flex flex-col h-full bg-white">
        {/* Chat header */}
        <div className="shrink-0 bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-3 text-white flex items-center gap-3 shadow-sm">
          {/* Back button on mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white/90 hover:text-white hover:bg-white/10 h-8 w-8 shrink-0"
            onClick={handleBackToList}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback
              className={
                isTest
                  ? "bg-amber-100 text-amber-700 text-sm font-semibold"
                  : "bg-white/20 text-white text-sm font-semibold"
              }
            >
              {getInitials(partnerName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{partnerName}</p>
            <p className="text-[11px] text-teal-200 flex items-center gap-1">
              {isTest ? (
                <>
                  <FlaskConical className="h-3 w-3" />
                  Test conversation
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" />
                  Secure channel
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {isTest && (
              <Badge className="bg-amber-400/90 text-amber-900 text-[10px] font-medium border-0 shrink-0">
                Test Mode
              </Badge>
            )}
          </div>
        </div>

        {/* Test mode banner */}
        <AnimatePresence>
          {isTest && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="shrink-0 bg-amber-50 border-b border-amber-200 px-4 py-2 overflow-hidden"
            >
              <p className="text-xs text-amber-700 flex items-center gap-2">
                <FlaskConical className="h-3.5 w-3.5 shrink-0" />
                <span>
                  <strong>Test Mode Active</strong> -- Messages are stored locally and{" "}
                  {parentB} will auto-respond. No data is sent to the server.
                </span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat messages area */}
        <div
          className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50/50 to-white"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 0%, rgba(20, 184, 166, 0.03), transparent 70%)",
          }}
        >
          {isLoading && !isTest ? (
            <ChatSkeleton />
          ) : activeMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mb-4">
                <MessageSquare className="h-7 w-7 text-teal-300" />
              </div>
              <p className="text-sm text-slate-500 max-w-xs">
                {isTest
                  ? `Send a message to start practicing with ${parentB}.`
                  : "No messages yet. Send the first message to start the conversation."}
              </p>
            </div>
          ) : (
            <div className="py-2">
              {activeMessages.map((msg, idx) => {
                const msgDate = new Date(msg.createdAt);
                const prevMsg = idx > 0 ? activeMessages[idx - 1] : null;
                const nextMsg =
                  idx < activeMessages.length - 1
                    ? activeMessages[idx + 1]
                    : null;
                const showDateDivider =
                  !prevMsg || !isSameDay(msgDate, new Date(prevMsg.createdAt));
                const isMine = msg.senderId === myId;
                const nextIsSameSender =
                  nextMsg && nextMsg.senderId === msg.senderId;
                const showTail = !nextIsSameSender;

                return (
                  <div key={msg.id}>
                    {showDateDivider && <DateDivider date={msgDate} />}
                    <MessageBubble
                      content={msg.content}
                      timestamp={msgDate}
                      isMine={isMine}
                      isRead={msg.isRead}
                      isTest={"isTest" in msg && msg.isTest}
                      showTail={showTail}
                    />
                  </div>
                );
              })}
              <AnimatePresence>{isTyping && <TypingIndicator />}</AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message input bar */}
        <div className="shrink-0 border-t border-slate-100 bg-white px-3 py-2.5">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isTest
                    ? `Message ${parentB} (test)...`
                    : "Type a secure message..."
                }
                rows={1}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm outline-none focus:border-teal-300 focus:bg-white focus:ring-1 focus:ring-teal-200 transition-all max-h-32 overflow-y-auto"
                style={{
                  minHeight: "40px",
                  height: "auto",
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height =
                    Math.min(target.scrollHeight, 128) + "px";
                }}
              />
              {!isTest && (
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
              )}
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || sendMutation.isPending}
              size="icon"
              className={`h-10 w-10 rounded-full shrink-0 transition-all ${
                messageInput.trim()
                  ? "bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-200"
                  : "bg-slate-200 text-slate-400"
              }`}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {!isTest && (
            <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1 px-2">
              <Shield className="h-3 w-3" />
              Messages are permanently recorded and cannot be edited or deleted.
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderEmptyChat = () => (
    <EmptyState
      onCompose={() => setIsComposeOpen(true)}
      onEnableTest={() => handleToggleTestMode(true)}
    />
  );

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <Layout>
      <div className="-m-4 md:-m-8 flex flex-col" style={{ height: "calc(100vh - 0px)" }}>
        {/* Desktop: side-by-side layout */}
        <div className="flex flex-1 min-h-0">
          {/* Conversation list -- hidden on mobile when chat is open */}
          <div
            className={`${
              showMobileChat ? "hidden" : "flex"
            } md:flex flex-col w-full md:w-80 lg:w-96 md:border-r border-slate-200 shrink-0 min-h-0`}
          >
            {renderConversationList()}
          </div>

          {/* Chat view */}
          <div
            className={`${
              showMobileChat ? "flex" : "hidden"
            } md:flex flex-col flex-1 min-h-0 min-w-0`}
          >
            {selectedConversationId ? renderChatView() : renderEmptyChat()}
          </div>
        </div>
      </div>

      {/* Compose dialog */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <form onSubmit={handleComposeSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                  <Send className="h-4 w-4 text-teal-600" />
                </div>
                New Secure Message
              </DialogTitle>
              <DialogDescription>
                All messages are permanently recorded and cannot be edited or deleted.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="compose-receiverId">To</Label>
                <Input
                  id="compose-receiverId"
                  placeholder="Enter co-parent's user ID"
                  value={composeData.receiverId}
                  onChange={(e) =>
                    setComposeData({ ...composeData, receiverId: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="compose-subject">
                  Subject{" "}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </Label>
                <Input
                  id="compose-subject"
                  placeholder="e.g., School pickup schedule"
                  value={composeData.subject}
                  onChange={(e) =>
                    setComposeData({ ...composeData, subject: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="compose-content">Message</Label>
                <Textarea
                  id="compose-content"
                  placeholder="Type your message here..."
                  rows={5}
                  value={composeData.content}
                  onChange={(e) =>
                    setComposeData({ ...composeData, content: e.target.value })
                  }
                  required
                  className="resize-none"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2.5">
                <Lock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Court-admissible record:</strong> Messages are
                  timestamped, hashed, and permanently stored. They cannot be
                  edited or deleted once sent.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsComposeOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700"
                disabled={sendMutation.isPending}
              >
                {sendMutation.isPending ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="mr-2"
                    >
                      <Send className="h-4 w-4" />
                    </motion.div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
