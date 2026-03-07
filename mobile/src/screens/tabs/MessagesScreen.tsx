import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import { format, isToday, isYesterday, isSameDay, parseISO } from "date-fns";

import { useAuth } from "../../auth/useAuth";
import { useTheme } from "../../theme/useTheme";
import {
  useMessages,
  useSendMessage,
  useMarkAsRead,
  useUnreadCount,
} from "../../hooks/useMessages";
import { useFamilyMembers } from "../../hooks/useFamily";
import { useRefreshOnFocus } from "../../hooks/useRefreshOnFocus";
import type { Message } from "../../types/schema";
import type { ColorPalette } from "../../constants/colors";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TestMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string | null;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  content_hash: string;
  isTest: true;
}

type AnyMessage = Message | TestMessage;

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
const MAX_CHAR_COUNT = 2000;

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

function toDate(input: string | Date): Date {
  if (input instanceof Date) return input;
  return parseISO(input);
}

function formatDateLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMMM d");
}

function formatTimestamp(date: Date): string {
  return format(date, "h:mm a");
}

function formatConversationTime(date: Date): string {
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MM/dd/yy");
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function pickAutoResponse(lastUsedIndex: number): { text: string; index: number } {
  let idx = Math.floor(Math.random() * AUTO_RESPONSES.length);
  while (idx === lastUsedIndex && AUTO_RESPONSES.length > 1) {
    idx = Math.floor(Math.random() * AUTO_RESPONSES.length);
  }
  return { text: AUTO_RESPONSES[idx], index: idx };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TypingIndicator({ colors }: { colors: ColorPalette }) {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      );

    const animation = Animated.parallel([
      animateDot(dot1, 0),
      animateDot(dot2, 150),
      animateDot(dot3, 300),
    ]);
    animation.start();

    return () => animation.stop();
  }, [dot1, dot2, dot3]);

  return (
    <View style={typingStyles.container}>
      <View style={[typingStyles.avatar, { backgroundColor: colors.border }]}>
        <Text style={[typingStyles.avatarText, { color: colors.mutedForeground }]}>
          ...
        </Text>
      </View>
      <View style={[typingStyles.bubble, { backgroundColor: colors.muted }]}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              typingStyles.dot,
              { backgroundColor: colors.mutedForeground, opacity: dot },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const typingStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 10,
    fontWeight: "600",
  },
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});

function DateDivider({ date, colors }: { date: Date; colors: ColorPalette }) {
  return (
    <View style={dividerStyles.container}>
      <View style={[dividerStyles.line, { backgroundColor: colors.border }]} />
      <Text style={[dividerStyles.label, { color: colors.mutedForeground }]}>
        {formatDateLabel(date)}
      </Text>
      <View style={[dividerStyles.line, { backgroundColor: colors.border }]} />
    </View>
  );
}

const dividerStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
  },
});

function MessageBubble({
  content,
  timestamp,
  isMine,
  isRead,
  isTest,
  colors,
}: {
  content: string;
  timestamp: Date;
  isMine: boolean;
  isRead: boolean;
  isTest?: boolean;
  colors: ColorPalette;
}) {
  const bubbleBackground = isMine ? colors.primary : colors.muted;
  const textColor = isMine ? colors.primaryForeground : colors.foreground;
  const metaColor = isMine ? "rgba(255,255,255,0.65)" : colors.mutedForeground;

  return (
    <View
      style={[
        bubbleStyles.container,
        isMine ? bubbleStyles.containerSent : bubbleStyles.containerReceived,
      ]}
    >
      <View
        style={[
          bubbleStyles.bubble,
          { backgroundColor: bubbleBackground },
          isMine ? bubbleStyles.bubbleSent : bubbleStyles.bubbleReceived,
          isTest && { borderWidth: 1, borderColor: colors.amber, borderStyle: "dashed" },
        ]}
      >
        <Text style={[bubbleStyles.text, { color: textColor }]}>{content}</Text>
        <View
          style={[
            bubbleStyles.meta,
            isMine ? bubbleStyles.metaSent : bubbleStyles.metaReceived,
          ]}
        >
          <Text style={[bubbleStyles.time, { color: metaColor }]}>
            {formatTimestamp(timestamp)}
          </Text>
          {isMine && (
            <Icon
              name={isRead ? "check-circle" : "check"}
              size={12}
              color={metaColor}
              style={bubbleStyles.readIcon}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  container: {
    marginVertical: 2,
    maxWidth: "78%",
    paddingHorizontal: 16,
  },
  containerSent: {
    alignSelf: "flex-end",
  },
  containerReceived: {
    alignSelf: "flex-start",
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleSent: {
    borderBottomRightRadius: 4,
  },
  bubbleReceived: {
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  metaSent: {
    justifyContent: "flex-end",
  },
  metaReceived: {
    justifyContent: "flex-start",
  },
  time: {
    fontSize: 10,
  },
  readIcon: {
    marginLeft: 2,
  },
});

function ConversationRow({
  conversation,
  isSelected,
  onPress,
  colors,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onPress: () => void;
  colors: ColorPalette;
}) {
  const avatarBg = conversation.isTestConversation
    ? "rgba(245, 158, 11, 0.15)"
    : colors.accent;
  const avatarTextColor = conversation.isTestConversation
    ? colors.amber
    : colors.accentForeground;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        rowStyles.container,
        { borderBottomColor: colors.border },
        isSelected && { backgroundColor: colors.accent },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Conversation with ${conversation.partnerName}`}
    >
      <View style={[rowStyles.avatar, { backgroundColor: avatarBg }]}>
        <Text style={[rowStyles.avatarText, { color: avatarTextColor }]}>
          {getInitials(conversation.partnerName)}
        </Text>
        {conversation.isTestConversation && (
          <View style={[rowStyles.testBadge, { backgroundColor: colors.amber }]}>
            <Icon name="zap" size={8} color="#fff" />
          </View>
        )}
      </View>

      <View style={rowStyles.content}>
        <View style={rowStyles.topRow}>
          <Text
            style={[rowStyles.name, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {conversation.partnerName}
          </Text>
          <Text style={[rowStyles.time, { color: colors.mutedForeground }]}>
            {formatConversationTime(conversation.lastMessageAt)}
          </Text>
        </View>
        <View style={rowStyles.bottomRow}>
          <Text
            style={[rowStyles.preview, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            {conversation.lastMessage}
          </Text>
          {conversation.unreadCount > 0 && (
            <View
              style={[rowStyles.unreadDot, { backgroundColor: colors.primary }]}
            >
              <Text style={[rowStyles.unreadText, { color: colors.primaryForeground }]}>
                {conversation.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
  },
  testBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  preview: {
    fontSize: 13,
    flex: 1,
  },
  unreadDot: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: "700",
  },
});

function EmptyConversations({
  onCompose,
  onEnableTestMode,
  colors,
}: {
  onCompose: () => void;
  onEnableTestMode: () => void;
  colors: ColorPalette;
}) {
  return (
    <View style={emptyStyles.container}>
      <View style={[emptyStyles.iconCircle, { backgroundColor: colors.accent }]}>
        <Icon name="message-circle" size={40} color={colors.primary} />
      </View>
      <Text style={[emptyStyles.title, { color: colors.foreground }]}>
        Start a Conversation
      </Text>
      <Text style={[emptyStyles.subtitle, { color: colors.mutedForeground }]}>
        Send secure, court-admissible messages to your co-parent. All messages are
        encrypted, timestamped, and cannot be edited or deleted.
      </Text>
      <View style={emptyStyles.actions}>
        <TouchableOpacity
          onPress={onCompose}
          style={[emptyStyles.primaryBtn, { backgroundColor: colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel="New Message"
        >
          <Icon name="plus" size={16} color={colors.primaryForeground} />
          <Text style={[emptyStyles.primaryBtnText, { color: colors.primaryForeground }]}>
            New Message
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onEnableTestMode}
          style={[emptyStyles.outlineBtn, { borderColor: colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel="Try Test Mode"
        >
          <Icon name="zap" size={16} color={colors.primary} />
          <Text style={[emptyStyles.outlineBtnText, { color: colors.primary }]}>
            Try Test Mode
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  outlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

function ComposerBar({
  value,
  onChangeText,
  onSend,
  isSending,
  isTestMode,
  colors,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isSending: boolean;
  isTestMode: boolean;
  colors: ColorPalette;
}) {
  const inputRef = useRef<TextInput>(null);
  const canSend = value.trim().length > 0 && !isSending;

  const handleSend = () => {
    if (!canSend) return;
    ReactNativeHapticFeedback.trigger("impactLight");
    onSend();
    inputRef.current?.focus();
  };

  return (
    <View
      style={[
        composerStyles.container,
        { borderTopColor: colors.border, backgroundColor: colors.card },
      ]}
    >
      <View style={composerStyles.inputRow}>
        <TextInput
          ref={inputRef}
          style={[
            composerStyles.input,
            { backgroundColor: colors.muted, color: colors.foreground },
          ]}
          placeholder={isTestMode ? "Message (test)..." : "Type a secure message..."}
          placeholderTextColor={colors.mutedForeground}
          value={value}
          onChangeText={onChangeText}
          multiline
          maxLength={MAX_CHAR_COUNT}
          blurOnSubmit={false}
          accessibilityLabel="Message input"
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!canSend}
          style={[
            composerStyles.sendBtn,
            { backgroundColor: canSend ? colors.primary : colors.border },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          accessibilityState={{ disabled: !canSend }}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <Icon
              name="send"
              size={18}
              color={canSend ? colors.primaryForeground : colors.mutedForeground}
            />
          )}
        </TouchableOpacity>
      </View>
      <View style={composerStyles.footer}>
        <Text style={[composerStyles.charCount, { color: colors.mutedForeground }]}>
          {value.length}/{MAX_CHAR_COUNT}
        </Text>
        {!isTestMode && (
          <View style={composerStyles.noticeRow}>
            <Icon name="shield" size={10} color={colors.mutedForeground} />
            <Text style={[composerStyles.noticeText, { color: colors.mutedForeground }]}>
              Permanently recorded. Cannot be edited or deleted.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const composerStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    marginTop: 4,
  },
  charCount: {
    fontSize: 10,
  },
  noticeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  noticeText: {
    fontSize: 10,
  },
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function MessagesScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { data: apiMessages = [], isLoading, refetch } = useMessages();
  const { data: familyMembers = [] } = useFamilyMembers();
  const sendMessageMutation = useSendMessage();
  const markReadMutation = useMarkAsRead();

  useRefreshOnFocus(["messages", "familyMembers"]);

  // -- View state: "list" or "thread" --
  const [viewMode, setViewMode] = useState<"list" | "thread">("list");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // -- Test mode state --
  const [testModeEnabled, setTestModeEnabled] = useState(false);
  const [testMessages, setTestMessages] = useState<TestMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const lastAutoResponseIdxRef = useRef(-1);

  // -- Input state --
  const [messageInput, setMessageInput] = useState("");

  // -- Refs --
  const flatListRef = useRef<FlatList<AnyMessage>>(null);

  const myId = user?.id ?? "me";
  const coParent = familyMembers.find((member) => member.id !== user?.id);
  const coParentName =
    coParent?.display_name || coParent?.username || "Co-Parent";

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const conversations = useMemo<Conversation[]>(() => {
    const map = new Map<string, Conversation>();

    for (const msg of apiMessages) {
      const partnerId =
        msg.sender_id === myId ? msg.receiver_id : msg.sender_id;
      const existing = map.get(partnerId);
      const msgDate = toDate(msg.created_at);

      if (!existing || msgDate > existing.lastMessageAt) {
        const unread = apiMessages.filter(
          (m) =>
            m.sender_id === partnerId &&
            m.receiver_id === myId &&
            !m.is_read,
        ).length;

        const partner = familyMembers.find((fm) => fm.id === partnerId);
        const partnerName =
          partner?.display_name || partner?.username || partnerId;

        map.set(partnerId, {
          partnerId,
          partnerName,
          lastMessage: msg.content,
          lastMessageAt: msgDate,
          unreadCount: unread,
        });
      }
    }

    if (testModeEnabled) {
      const lastTest =
        testMessages.length > 0 ? testMessages[testMessages.length - 1] : null;

      map.set(TEST_PARENT_B_ID, {
        partnerId: TEST_PARENT_B_ID,
        partnerName: coParentName,
        lastMessage: lastTest?.content || "Start a test conversation...",
        lastMessageAt: lastTest ? toDate(lastTest.created_at) : new Date(),
        unreadCount: 0,
        isTestConversation: true,
      });
    }

    return Array.from(map.values()).sort(
      (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime(),
    );
  }, [apiMessages, testMessages, testModeEnabled, myId, familyMembers, coParentName]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.partnerName.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q),
    );
  }, [conversations, searchQuery]);

  const activeMessages = useMemo<AnyMessage[]>(() => {
    if (!selectedConversationId) return [];

    if (selectedConversationId === TEST_PARENT_B_ID) {
      return [...testMessages].reverse();
    }

    return apiMessages
      .filter(
        (m) =>
          (m.sender_id === myId && m.receiver_id === selectedConversationId) ||
          (m.receiver_id === myId && m.sender_id === selectedConversationId),
      )
      .sort(
        (a, b) =>
          toDate(b.created_at).getTime() - toDate(a.created_at).getTime(),
      );
  }, [selectedConversationId, apiMessages, testMessages, myId]);

  const selectedConversation = conversations.find(
    (c) => c.partnerId === selectedConversationId,
  );

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!selectedConversationId || selectedConversationId === TEST_PARENT_B_ID)
      return;

    const unread = apiMessages.filter(
      (m) =>
        m.sender_id === selectedConversationId &&
        m.receiver_id === myId &&
        !m.is_read,
    );
    for (const msg of unread) {
      markReadMutation.mutate(Number(msg.id));
    }
  }, [selectedConversationId, apiMessages, myId]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSelectConversation = useCallback((partnerId: string) => {
    setSelectedConversationId(partnerId);
    setViewMode("thread");
    setMessageInput("");
  }, []);

  const handleBackToList = useCallback(() => {
    setViewMode("list");
    setSelectedConversationId(null);
  }, []);

  const handleToggleTestMode = useCallback(
    (enabled: boolean) => {
      setTestModeEnabled(enabled);
      if (enabled) {
        setSelectedConversationId(TEST_PARENT_B_ID);
        setViewMode("thread");
      } else {
        if (selectedConversationId === TEST_PARENT_B_ID) {
          setSelectedConversationId(null);
          setViewMode("list");
        }
        setTestMessages([]);
        setIsTyping(false);
      }
    },
    [selectedConversationId],
  );

  const handleSendMessage = useCallback(() => {
    const text = messageInput.trim();
    if (!text) return;

    if (selectedConversationId === TEST_PARENT_B_ID) {
      const now = new Date().toISOString();
      const newMsg: TestMessage = {
        id: `test-${Date.now()}`,
        sender_id: myId,
        receiver_id: TEST_PARENT_B_ID,
        subject: null,
        content: text,
        is_read: true,
        read_at: now,
        created_at: now,
        content_hash: "test-hash",
        isTest: true,
      };
      setTestMessages((prev) => [...prev, newMsg]);
      setMessageInput("");

      const delay = 1000 + Math.random() * 1500;
      setTimeout(() => {
        setIsTyping(true);
      }, delay);

      setTimeout(() => {
        setIsTyping(false);
        const { text: responseText, index } = pickAutoResponse(
          lastAutoResponseIdxRef.current,
        );
        lastAutoResponseIdxRef.current = index;
        const responseNow = new Date().toISOString();
        const responseMsg: TestMessage = {
          id: `test-resp-${Date.now()}`,
          sender_id: TEST_PARENT_B_ID,
          receiver_id: myId,
          subject: null,
          content: responseText,
          is_read: true,
          read_at: responseNow,
          created_at: responseNow,
          content_hash: "test-hash",
          isTest: true,
        };
        setTestMessages((prev) => [...prev, responseMsg]);
      }, delay + 1000 + Math.random() * 1000);
    } else if (selectedConversationId && coParent) {
      sendMessageMutation.mutate({
        receiver_id: Number(coParent.id),
        content: text,
      });
      setMessageInput("");
    }
  }, [messageInput, selectedConversationId, myId, coParent, sendMessageMutation]);

  // ---------------------------------------------------------------------------
  // Render: Conversation list
  // ---------------------------------------------------------------------------

  const renderConversationList = () => (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.listHeader, { backgroundColor: colors.primary }]}>
        <View style={styles.listHeaderTop}>
          <View style={styles.listHeaderTitleRow}>
            <Icon name="shield" size={20} color={colors.primaryForeground} />
            <Text style={[styles.listHeaderTitle, { color: colors.primaryForeground }]}>
              Messages
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              if (coParent) {
                handleSelectConversation(coParent.id);
              }
            }}
            style={styles.composeBtn}
            accessibilityRole="button"
            accessibilityLabel="New message"
          >
            <Icon name="plus" size={22} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={15} color="rgba(255,255,255,0.5)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            accessibilityLabel="Search conversations"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              accessibilityLabel="Clear search"
            >
              <Icon name="x" size={15} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Test mode toggle */}
      <View
        style={[
          styles.testModeRow,
          { borderBottomColor: colors.border, backgroundColor: colors.muted },
        ]}
      >
        <View style={styles.testModeLeft}>
          <Icon name="zap" size={15} color={colors.amber} />
          <Text style={[styles.testModeLabel, { color: colors.foreground }]}>
            Test Mode
          </Text>
        </View>
        <Switch
          value={testModeEnabled}
          onValueChange={handleToggleTestMode}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.primaryForeground}
          accessibilityLabel="Toggle test mode"
        />
      </View>

      {testModeEnabled && (
        <View style={[styles.testModeBanner, { backgroundColor: "rgba(245,158,11,0.08)" }]}>
          <Text style={[styles.testModeBannerText, { color: colors.amber }]}>
            Simulating conversation with {coParentName}
          </Text>
        </View>
      )}

      {/* Conversation list */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredConversations.length === 0 ? (
        <EmptyConversations
          onCompose={() => {
            if (coParent) {
              handleSelectConversation(coParent.id);
            }
          }}
          onEnableTestMode={() => handleToggleTestMode(true)}
          colors={colors}
        />
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.partnerId}
          renderItem={({ item }) => (
            <ConversationRow
              conversation={item}
              isSelected={selectedConversationId === item.partnerId}
              onPress={() => handleSelectConversation(item.partnerId)}
              colors={colors}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.conversationListContent}
        />
      )}

      {/* Court-admissible notice */}
      <View
        style={[styles.courtNotice, { borderTopColor: colors.border }]}
      >
        <Icon name="lock" size={11} color={colors.mutedForeground} />
        <Text style={[styles.courtNoticeText, { color: colors.mutedForeground }]}>
          End-to-end encrypted. Messages are immutable and court-admissible.
        </Text>
      </View>
    </View>
  );

  // ---------------------------------------------------------------------------
  // Render: Thread view
  // ---------------------------------------------------------------------------

  const isTestThread = selectedConversationId === TEST_PARENT_B_ID;
  const partnerName =
    selectedConversation?.partnerName || selectedConversationId || "";

  const renderThreadItem = useCallback(
    ({ item, index }: { item: AnyMessage; index: number }) => {
      const msgDate = toDate(item.created_at);
      const isMine = item.sender_id === myId;

      // For inverted FlatList the "next" item in the array is actually the
      // message that appeared *before* this one chronologically.
      const nextItemInArray =
        index < activeMessages.length - 1 ? activeMessages[index + 1] : null;
      const showDateDivider =
        !nextItemInArray ||
        !isSameDay(msgDate, toDate(nextItemInArray.created_at));

      return (
        <View>
          <MessageBubble
            content={item.content}
            timestamp={msgDate}
            isMine={isMine}
            isRead={item.is_read}
            isTest={"isTest" in item && (item as TestMessage).isTest}
            colors={colors}
          />
          {showDateDivider && <DateDivider date={msgDate} colors={colors} />}
        </View>
      );
    },
    [activeMessages, myId, colors],
  );

  const renderThreadHeader = useCallback(() => {
    if (!isTyping) return null;
    return <TypingIndicator colors={colors} />;
  }, [isTyping, colors]);

  const renderThreadView = () => (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      {/* Thread header */}
      <View style={[styles.threadHeader, { backgroundColor: colors.primary }]}>
        <TouchableOpacity
          onPress={handleBackToList}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back to conversations"
        >
          <Icon name="arrow-left" size={22} color={colors.primaryForeground} />
        </TouchableOpacity>

        <View
          style={[
            styles.threadAvatar,
            {
              backgroundColor: isTestThread
                ? "rgba(245,158,11,0.2)"
                : "rgba(255,255,255,0.2)",
            },
          ]}
        >
          <Text
            style={[
              styles.threadAvatarText,
              {
                color: isTestThread
                  ? colors.amber
                  : colors.primaryForeground,
              },
            ]}
          >
            {getInitials(partnerName)}
          </Text>
        </View>

        <View style={styles.threadHeaderInfo}>
          <Text
            style={[styles.threadHeaderName, { color: colors.primaryForeground }]}
            numberOfLines={1}
          >
            {partnerName}
          </Text>
          <View style={styles.threadHeaderSubRow}>
            <Icon
              name={isTestThread ? "zap" : "lock"}
              size={11}
              color="rgba(255,255,255,0.65)"
            />
            <Text style={styles.threadHeaderSub}>
              {isTestThread ? "Test conversation" : "Secure channel"}
            </Text>
          </View>
        </View>

        {isTestThread && (
          <View style={[styles.testBadgeHeader, { backgroundColor: colors.amber }]}>
            <Text style={styles.testBadgeText}>Test</Text>
          </View>
        )}
      </View>

      {/* Court-admissible banner */}
      {!isTestThread && (
        <View
          style={[
            styles.admissibleBanner,
            {
              backgroundColor: "rgba(245,158,11,0.06)",
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Icon name="shield" size={13} color={colors.amber} />
          <Text style={[styles.admissibleText, { color: colors.amber }]}>
            Court-admissible: Messages are timestamped, hashed, and permanently stored.
          </Text>
        </View>
      )}

      {/* Test mode banner */}
      {isTestThread && (
        <View
          style={[
            styles.admissibleBanner,
            {
              backgroundColor: "rgba(245,158,11,0.06)",
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Icon name="zap" size={13} color={colors.amber} />
          <Text style={[styles.admissibleText, { color: colors.amber }]}>
            Test Mode Active -- Messages are local only. {coParentName} will
            auto-respond.
          </Text>
        </View>
      )}

      {/* Messages */}
      {activeMessages.length === 0 && !isLoading ? (
        <View style={styles.emptyThread}>
          <View style={[styles.emptyThreadIcon, { backgroundColor: colors.accent }]}>
            <Icon name="message-square" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.emptyThreadText, { color: colors.mutedForeground }]}>
            {isTestThread
              ? `Send a message to start practicing with ${coParentName}.`
              : "No messages yet. Send the first message to start the conversation."}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={activeMessages}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderThreadItem}
          ListHeaderComponent={renderThreadHeader}
          inverted
          contentContainerStyle={styles.threadList}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={refetch}
        />
      )}

      {/* Composer */}
      <ComposerBar
        value={messageInput}
        onChangeText={setMessageInput}
        onSend={handleSendMessage}
        isSending={sendMessageMutation.isPending}
        isTestMode={isTestThread}
        colors={colors}
      />
    </View>
  );

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        {viewMode === "list" ? renderConversationList() : renderThreadView()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },

  // -- List header --
  listHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  listHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  listHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  listHeaderTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  composeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  // -- Search --
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#ffffff",
    paddingVertical: 0,
  },

  // -- Test mode --
  testModeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  testModeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  testModeLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  testModeBanner: {
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  testModeBannerText: {
    fontSize: 12,
  },

  // -- Conversation list --
  conversationListContent: {
    paddingBottom: 8,
  },

  // -- Court notice --
  courtNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  courtNoticeText: {
    fontSize: 10,
  },

  // -- Thread header --
  threadHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  threadAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  threadAvatarText: {
    fontSize: 14,
    fontWeight: "700",
  },
  threadHeaderInfo: {
    flex: 1,
  },
  threadHeaderName: {
    fontSize: 16,
    fontWeight: "600",
  },
  threadHeaderSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  threadHeaderSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
  },
  testBadgeHeader: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  testBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#ffffff",
  },

  // -- Admissible banner --
  admissibleBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  admissibleText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },

  // -- Thread messages --
  threadList: {
    paddingVertical: 8,
  },
  emptyThread: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyThreadIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyThreadText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  // -- Loader --
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
