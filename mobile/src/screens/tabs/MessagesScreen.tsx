import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Linking } from "react-native";
import { Linking, Platform } from "react-native";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import { format, isToday, isYesterday, isSameDay, parseISO } from "date-fns";
import { launchImageLibrary, launchCamera } from "react-native-image-picker";

import { useAuth } from "../../auth/useAuth";
import { useTheme } from "../../theme/useTheme";
import {
  useMessages,
  useSendMessage,
  useMarkAsRead,
  useUnreadCount,
} from "../../hooks/useMessages";
import { useFamilyMembers, useFamily } from "../../hooks/useFamily";
import { useRefreshOnFocus } from "../../hooks/useRefreshOnFocus";
import { checkTone } from "../../api/toneCheck";
import { uploadAttachment } from "../../api/photos";
import ToneWarning from "../../components/messaging/ToneWarning";
import { MessageListSkeleton } from "../../components/ui/SkeletonLayouts";
import type { Message, ToneCheckResult } from "../../types/schema";
import type { ColorPalette } from "../../constants/colors";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Conversation {
  partnerId: string;
  partnerName: string;
  lastMessage: string;
  lastMessageAt: Date;
  isLastMessageMine: boolean;
  unreadCount: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_CHAR_COUNT = 2000;
const CHAR_WARNING_RATIO = 0.8;
const CHAR_DANGER_RATIO = 0.95;
const SCROLL_FAB_THRESHOLD = 300;

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

function charCountColor(length: number, colors: ColorPalette): string {
  const ratio = length / MAX_CHAR_COUNT;
  if (ratio >= CHAR_DANGER_RATIO) return colors.destructive;
  if (ratio >= CHAR_WARNING_RATIO) return colors.amber;
  return colors.mutedForeground;
}

function truncateHash(hash: string): string {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}\u2026${hash.slice(-8)}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

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
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  label: { fontSize: 12, fontWeight: "500" },
});

// ---------------------------------------------------------------------------

function MessageBubble({
  content,
  subject,
  timestamp,
  isMine,
  isRead,
  isGroupEnd,
  contentHash,
  attachmentUrl,
  attachmentType,
  colors,
}: {
  content: string;
  subject: string | null;
  timestamp: Date;
  isMine: boolean;
  isRead: boolean;
  isGroupEnd: boolean;
  contentHash: string;
  attachmentUrl: string | null;
  attachmentType: string | null;
  colors: ColorPalette;
}) {
  const bubbleBg = isMine ? colors.primary : colors.muted;
  const textColor = isMine ? colors.primaryForeground : colors.foreground;
  const metaColor = isMine ? "rgba(255,255,255,0.6)" : colors.mutedForeground;

  const showMessageDetails = () => {
    ReactNativeHapticFeedback.trigger("impactMedium");
    Alert.alert(
      "Message Integrity",
      [
        `Sent: ${format(timestamp, "MMM d, yyyy 'at' h:mm:ss a")}`,
        `SHA-256: ${contentHash}`,
        "",
        "This hash cryptographically verifies the message content has not been altered.",
      ].join("\n"),
      [{ text: "OK" }],
    );
  };

  return (
    <TouchableOpacity
      onLongPress={showMessageDetails}
      delayLongPress={400}
      activeOpacity={0.85}
      accessibilityLabel={`${isMine ? "You" : "Co-Parent"}: ${content}`}
      accessibilityHint="Long press to view message integrity details"
      style={[
        bubbleStyles.container,
        isMine ? bubbleStyles.containerSent : bubbleStyles.containerReceived,
        isGroupEnd ? bubbleStyles.groupEnd : bubbleStyles.groupMiddle,
      ]}
    >
      <View
        style={[
          bubbleStyles.bubble,
          { backgroundColor: bubbleBg },
          isMine
            ? isGroupEnd
              ? bubbleStyles.tailSent
              : bubbleStyles.noTail
            : isGroupEnd
              ? bubbleStyles.tailReceived
              : bubbleStyles.noTail,
        ]}
      >
        {subject ? (
          <Text
            style={[bubbleStyles.subject, { color: textColor }]}
            numberOfLines={1}
          >
            {subject}
          </Text>
        ) : null}

        {attachmentUrl && attachmentType === "image" && !attachmentUrl.startsWith("data:") && (
          <Image
            source={{ uri: attachmentUrl }}
            style={bubbleStyles.attachmentImage}
            resizeMode="cover"
          />
        )}

        {attachmentUrl && attachmentType === "file" && (
          <View style={[bubbleStyles.fileAttachment, { backgroundColor: isMine ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.05)" }]}>
            <Icon name="paperclip" size={14} color={textColor} />
            <Text style={[bubbleStyles.fileText, { color: textColor }]} numberOfLines={1}>
              Attachment
            </Text>
          </View>
        )}

        <Text style={[bubbleStyles.text, { color: textColor }]}>{content}</Text>

        {isGroupEnd && (
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
        )}
      </View>
    </TouchableOpacity>
  );
}

const bubbleStyles = StyleSheet.create({
  container: { maxWidth: "78%", paddingHorizontal: 16 },
  containerSent: { alignSelf: "flex-end" },
  containerReceived: { alignSelf: "flex-start" },
  groupEnd: { marginBottom: 6, marginTop: 1 },
  groupMiddle: { marginVertical: 1 },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  tailSent: { borderBottomRightRadius: 4 },
  tailReceived: { borderBottomLeftRadius: 4 },
  noTail: { borderRadius: 18 },
  subject: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
  text: { fontSize: 15, lineHeight: 21 },
  attachmentImage: { width: "100%", height: 180, borderRadius: 10, marginBottom: 6 },
  fileAttachment: { flexDirection: "row", alignItems: "center", gap: 6, padding: 8, borderRadius: 8, marginBottom: 6 },
  fileText: { fontSize: 13, fontWeight: "500" },
  meta: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 },
  metaSent: { justifyContent: "flex-end" },
  metaReceived: { justifyContent: "flex-start" },
  time: { fontSize: 10 },
  readIcon: { marginLeft: 2 },
});

// ---------------------------------------------------------------------------

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
  const preview = conversation.isLastMessageMine
    ? `You: ${conversation.lastMessage}`
    : conversation.lastMessage;

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
      accessibilityLabel={`Conversation with ${conversation.partnerName}, ${conversation.unreadCount} unread`}
    >
      <View style={[rowStyles.avatar, { backgroundColor: colors.primary }]}>
        <Text style={[rowStyles.avatarText, { color: colors.primaryForeground }]}>
          {getInitials(conversation.partnerName)}
        </Text>
      </View>

      <View style={rowStyles.content}>
        <View style={rowStyles.topRow}>
          <Text
            style={[
              rowStyles.name,
              { color: colors.foreground },
              conversation.unreadCount > 0 && rowStyles.nameBold,
            ]}
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
            style={[
              rowStyles.preview,
              { color: colors.mutedForeground },
              conversation.unreadCount > 0 && {
                color: colors.foreground,
                fontWeight: "500",
              },
            ]}
            numberOfLines={1}
          >
            {preview}
          </Text>
          {conversation.unreadCount > 0 && (
            <View
              style={[rowStyles.unreadBadge, { backgroundColor: colors.primary }]}
            >
              <Text
                style={[rowStyles.unreadText, { color: colors.primaryForeground }]}
              >
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
  avatarText: { fontSize: 16, fontWeight: "700" },
  content: { flex: 1 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  name: { fontSize: 15, fontWeight: "600", flex: 1, marginRight: 8 },
  nameBold: { fontWeight: "700" },
  time: { fontSize: 12 },
  bottomRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  preview: { fontSize: 13, flex: 1 },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadText: { fontSize: 11, fontWeight: "700" },
});

// ---------------------------------------------------------------------------

function EmptyConversations({
  onCompose,
  hasCoParent,
  inviteCode,
  colors,
}: {
  onCompose: () => void;
  hasCoParent: boolean;
  inviteCode: string;
  colors: ColorPalette;
}) {
  // Show different UI based on whether user has a connected co-parent
  if (!hasCoParent) {
    return (
      <View style={emptyStyles.container}>
        <View style={[emptyStyles.iconCircle, { backgroundColor: colors.accent }]}>
          <Icon name="users" size={40} color={colors.primary} />
        </View>
        <Text style={[emptyStyles.title, { color: colors.foreground }]}>
          Connect with Your Co-Parent
        </Text>
        <Text style={[emptyStyles.subtitle, { color: colors.mutedForeground }]}>
          Before you can send messages, you need to invite your co-parent to join your family. Share the invite code below or ask them to enter it in their app.
        </Text>
        <View style={[emptyStyles.codeBox, { borderColor: colors.primary, backgroundColor: colors.accent }]}>
          <Text style={[emptyStyles.codeLabel, { color: colors.mutedForeground }]}>Your Invite Code</Text>
          <Text style={[emptyStyles.codeText, { color: colors.primary }]}>{inviteCode || "Loading..."}</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            ReactNativeHapticFeedback.trigger("impactLight");
            if (inviteCode) {
              Share.share({
                message: `Join our family on CoParent Connect! Use invite code: ${inviteCode}`,
              });
            }
          }}
          style={[emptyStyles.btn, { backgroundColor: colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel="Share Invite Code"
        >
          <Icon name="share-2" size={16} color={colors.primaryForeground} />
          <Text style={[emptyStyles.btnText, { color: colors.primaryForeground }]}>
            Share Invite Code
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={emptyStyles.container}>
      <View style={[emptyStyles.iconCircle, { backgroundColor: colors.accent }]}>
        <Icon name="message-circle" size={40} color={colors.primary} />
      </View>
      <Text style={[emptyStyles.title, { color: colors.foreground }]}>
        Start a Conversation
      </Text>
      <Text style={[emptyStyles.subtitle, { color: colors.mutedForeground }]}>
        Send secure, court-admissible messages to your co-parent. Every message
        is encrypted, timestamped, and permanently stored — they cannot be
        edited or deleted.
      </Text>
      <TouchableOpacity
        onPress={() => {
          ReactNativeHapticFeedback.trigger("impactLight");
          onCompose();
        }}
        style={[emptyStyles.btn, { backgroundColor: colors.primary }]}
        accessibilityRole="button"
        accessibilityLabel="New Message"
      >
        <Icon name="edit-3" size={16} color={colors.primaryForeground} />
        <Text style={[emptyStyles.btnText, { color: colors.primaryForeground }]}>
          New Message
        </Text>
      </TouchableOpacity>
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
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  codeBox: {
    width: "100%",
    maxWidth: 280,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  codeText: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 3,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  btnText: { fontSize: 15, fontWeight: "600" },
});

// ---------------------------------------------------------------------------

function ComposerBar({
  value,
  onChangeText,
  onSend,
  onAttach,
  isSending,
  isUploading,
  colors,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAttach: () => void;
  isSending: boolean;
  isUploading: boolean;
  colors: ColorPalette;
}) {
  const inputRef = useRef<TextInput>(null);
  const canSend = value.trim().length > 0 && !isSending && !isUploading;
  const countColor = charCountColor(value.length, colors);

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
        <TouchableOpacity
          onPress={onAttach}
          disabled={isUploading}
          style={composerStyles.attachBtn}
          accessibilityRole="button"
          accessibilityLabel="Attach photo or file"
        >
          {isUploading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Icon name="paperclip" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
        <TextInput
          ref={inputRef}
          style={[
            composerStyles.input,
            { backgroundColor: colors.muted, color: colors.foreground },
          ]}
          placeholder={"Type a secure message\u2026"}
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
        <Text style={[composerStyles.charCount, { color: countColor }]}>
          {value.length}/{MAX_CHAR_COUNT}
        </Text>
        <View style={composerStyles.noticeRow}>
          <Icon name="lock" size={10} color={colors.mutedForeground} />
          <Text
            style={[composerStyles.noticeText, { color: colors.mutedForeground }]}
          >
            Permanently recorded. Cannot be edited or deleted.
          </Text>
        </View>
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
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  attachBtn: { width: 36, height: 40, justifyContent: "center", alignItems: "center" },
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
  charCount: { fontSize: 10, fontWeight: "500" },
  noticeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  noticeText: { fontSize: 10 },
});

// ---------------------------------------------------------------------------

function ScrollToBottomButton({
  visible,
  onPress,
  colors,
}: {
  visible: boolean;
  onPress: () => void;
  colors: ColorPalette;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [visible, anim]);

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[
        fabStyles.wrapper,
        {
          opacity: anim,
          transform: [
            {
              scale: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.6, 1],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => {
          ReactNativeHapticFeedback.trigger("impactLight");
          onPress();
        }}
        style={[
          fabStyles.button,
          { backgroundColor: colors.card, shadowColor: colors.foreground },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Scroll to latest messages"
      >
        <Icon name="chevrons-down" size={20} color={colors.primary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const fabStyles = StyleSheet.create({
  smsModal: {
    backgroundColor: "rgba(0,0,0,0.5)",
    flex: 1,
    justifyContent: "flex-end",
  },
  smsModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
  },
  smsModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  smsModalLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  smsModalActions: {
    flexDirection: "row",
    gap: 12,
  },
  smsModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  smsModalCancelButton: {
    backgroundColor: "#E5E7EB",
  },
  smsModalSendButton: {
    backgroundColor: "#10B981",
  },
  smsModalButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  smsFab: {
    position: "absolute",
    bottom: 100,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  smsFabButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 20,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  smsFabText: {
    color: "#fff",
    fontSize: 20,
  },
  smsFabLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  smsFabInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 15,
  },

const fabStyles = StyleSheet.create({
  wrapper: { position: "absolute", bottom: 80, right: 16, zIndex: 10 },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

/cat /tmp/sms_functions.txt

  const openSMS = useCallback(async () => {
    if (!smsPhone) {
      Alert.alert("Phone Number Required", "Please enter your coparent's phone number to send a message.");
      setSmsModalVisible(true);
      return;
    }

    const url = Platform.select({
      ios: `sms:${encodeURIComponent(smsPhone)}&body=`,
      android: `sms:${smsPhone}?body=`,
    });

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Cannot Send Message", "SMS is not available on this device.");
    }
  }, [smsPhone, setSmsModalVisible]);

export default function MessagesScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { data: apiMessages = [], isLoading, refetch } = useMessages();
  const { data: familyMembers = [] } = useFamilyMembers();
  const { data: family } = useFamily();
  const { data: totalUnread = 0 } = useUnreadCount();
  const sendMessageMutation = useSendMessage();
  const markReadMutation = useMarkAsRead();

  useRefreshOnFocus(["messages", "familyMembers"]);

  // -- View state --
  const [viewMode, setViewMode] = useState<"list" | "thread">("list");
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [showScrollFab, setShowScrollFab] = useState(false);
  const [toneResult, setToneResult] = useState<ToneCheckResult | null>(null);
  const [showToneWarning, setShowToneWarning] = useState(false);

  const flatListRef = useRef<FlatList<Message>>(null);
  const myId = user?.id ?? "me";
  const coParent = familyMembers.find((member) => member.id !== user?.id);

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
          isLastMessageMine: msg.sender_id === myId,
          unreadCount: unread,
        });
      }
      {/* SMS Button */}
      <TouchableOpacity
        style={styles.smsFab}
        onPress={() => setSmsModalVisible(true)}
        activeOpacity={0.8}
      >
        <Icon name="message-square" size={20} color="#fff" />
        <View style={styles.smsFabInput}>
          <Text style={styles.smsFabText}>Text</Text>
          <Text style={styles.smsFabLabel}>Coparent</Text>
        </View>
      </TouchableOpacity>

      {/* SMS Phone Modal */}
      <Modal visible={smsModalVisible} transparent animationType="slide">
        <View style={styles.smsModal}>
          <View style={styles.smsModalContent}>
            <Text style={styles.smsModalTitle}>Send SMS to Coparent</Text>
            <Text style={styles.smsModalLabel}>Enter phone number (with country code)</Text>
            <TextInput
              style={styles.smsFabInput}
              placeholder="+1 234 567 8901"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={smsPhone}
              onChangeText={setSmsPhone}
              autoFocus
            />
            <View style={styles.smsModalActions}>
              <TouchableOpacity
                style={[styles.smsModalButton, styles.smsModalCancelButton]}
                onPress={() => setSmsModalVisible(false)}
              >
                <Text style={styles.smsModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smsModalButton, styles.smsModalSendButton]}
                onPress={() => {
                  setSmsModalVisible(false);
                  openSMS();
                }}
              >
                <Text style={styles.smsModalButtonText}>Open SMS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    }

    return Array.from(map.values()).sort(
      (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime(),
    );
  }, [apiMessages, myId, familyMembers]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.partnerName.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q),
    );
  }, [conversations, searchQuery]);

  const activeMessages = useMemo<Message[]>(() => {
    if (!selectedConversationId) return [];

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
  }, [selectedConversationId, apiMessages, myId]);

  const selectedConversation = conversations.find(
    (c) => c.partnerId === selectedConversationId,
  );

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!selectedConversationId) return;

    const unread = apiMessages.filter(
      (m) =>
        m.sender_id === selectedConversationId &&
        m.receiver_id === myId &&
        !m.is_read,
    );
    for (const msg of unread) {
      markReadMutation.mutate(msg.id);
    }
  }, [selectedConversationId, apiMessages, myId]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSelectConversation = useCallback((partnerId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedConversationId(partnerId);
    setViewMode("thread");
    setMessageInput("");
    setShowScrollFab(false);
  }, []);

  const handleBackToList = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setViewMode("list");
    setSelectedConversationId(null);
  }, []);

  const [pendingAttachment, setPendingAttachment] = useState<{
    url: string;
    type: "image" | "file";
  } | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  const sendMessageDirectly = useCallback((text: string, attachment?: { url: string; type: "image" | "file" }) => {
    if (!coParent) return;
    sendMessageMutation.mutate({
      receiver_id: coParent.id,
      content: text,
      attachment_url: attachment?.url,
      attachment_type: attachment?.type,
    });
    setMessageInput("");
    setPendingAttachment(null);
    setShowToneWarning(false);
    setToneResult(null);
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 100);
  }, [coParent, sendMessageMutation]);

  const handleSendMessage = useCallback(async () => {
    const text = messageInput.trim();
    if (!text || !selectedConversationId || !coParent) return;

    // Check tone before sending (non-blocking — 3s timeout on server)
    const result = await checkTone(text);
    if (result && result.flagged) {
      setToneResult(result);
      setShowToneWarning(true);
      ReactNativeHapticFeedback.trigger("notificationWarning");
      return; // Don't send yet — show warning
    }

    sendMessageDirectly(text, pendingAttachment ?? undefined);
  }, [messageInput, selectedConversationId, coParent, sendMessageDirectly, pendingAttachment]);

  const handleAttach = useCallback(() => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Take Photo", "Choose from Library"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleCameraAttach();
          else if (buttonIndex === 2) handleLibraryAttach();
        },
      );
    } else {
      handleLibraryAttach();
    }
  }, []);

  const handleCameraAttach = useCallback(() => {
    launchCamera({ mediaType: "photo", quality: 0.8 }, async (response) => {
      if (response.didCancel || response.errorCode) return;
      const asset = response.assets?.[0];
      if (!asset?.uri) return;
      await performAttachmentUpload(asset.uri, asset.fileName || "photo.jpg", asset.type || "image/jpeg");
    });
  }, []);

  const handleLibraryAttach = useCallback(() => {
    launchImageLibrary({ mediaType: "photo", quality: 0.8 }, async (response) => {
      if (response.didCancel || response.errorCode) return;
      const asset = response.assets?.[0];
      if (!asset?.uri) return;
      await performAttachmentUpload(asset.uri, asset.fileName || "photo.jpg", asset.type || "image/jpeg");
    });
  }, []);

  const performAttachmentUpload = useCallback(async (uri: string, name: string, type: string) => {
    setIsUploadingAttachment(true);
    try {
      const result = await uploadAttachment(uri, name, type);
      if (result) {
        setPendingAttachment({ url: result.url, type: result.type });
        ReactNativeHapticFeedback.trigger("notificationSuccess");
      } else {
        Alert.alert("Error", "Failed to upload attachment.");
      }
      {/* SMS Button */}
      <TouchableOpacity
        style={styles.smsFab}
        onPress={() => setSmsModalVisible(true)}
        activeOpacity={0.8}
      >
        <Icon name="message-square" size={20} color="#fff" />
        <View style={styles.smsFabInput}>
          <Text style={styles.smsFabText}>Text</Text>
          <Text style={styles.smsFabLabel}>Coparent</Text>
        </View>
      </TouchableOpacity>

      {/* SMS Phone Modal */}
      <Modal visible={smsModalVisible} transparent animationType="slide">
        <View style={styles.smsModal}>
          <View style={styles.smsModalContent}>
            <Text style={styles.smsModalTitle}>Send SMS to Coparent</Text>
            <Text style={styles.smsModalLabel}>Enter phone number (with country code)</Text>
            <TextInput
              style={styles.smsFabInput}
              placeholder="+1 234 567 8901"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={smsPhone}
              onChangeText={setSmsPhone}
              autoFocus
            />
            <View style={styles.smsModalActions}>
              <TouchableOpacity
                style={[styles.smsModalButton, styles.smsModalCancelButton]}
                onPress={() => setSmsModalVisible(false)}
              >
                <Text style={styles.smsModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smsModalButton, styles.smsModalSendButton]}
                onPress={() => {
                  setSmsModalVisible(false);
                  openSMS();
                }}
              >
                <Text style={styles.smsModalButtonText}>Open SMS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    } finally {
      setIsUploadingAttachment(false);
    }
  }, []);

  const handleScrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const handleScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { y: number } } }) => {
      const offsetY = e.nativeEvent.contentOffset.y;
      setShowScrollFab(offsetY > SCROLL_FAB_THRESHOLD);
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  /**
   * Determines grouping for a message at `index` in the inverted list.
   *
   * In an inverted FlatList, index 0 is the newest message (bottom of screen).
   * - prevInArray (index - 1): the newer message, displayed BELOW
   * - nextInArray (index + 1): the older message, displayed ABOVE
   *
   * `isGroupEnd`: no same-sender message below ⇒ show tail + timestamp.
   */
  const isGroupEnd = useCallback(
    (index: number): boolean => {
      if (index === 0) return true;
      const current = activeMessages[index];
      const newer = activeMessages[index - 1];
      if (!newer) return true;
      if (newer.sender_id !== current.sender_id) return true;
      if (!isSameDay(toDate(current.created_at), toDate(newer.created_at)))
        return true;
      return false;
    },
    [activeMessages],
  );

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
            <Text
              style={[
                styles.listHeaderTitle,
                { color: colors.primaryForeground },
              ]}
            >
              Messages
            </Text>
            {totalUnread > 0 && (
              <View
                style={[
                  styles.headerBadge,
                  { backgroundColor: colors.primaryForeground },
                ]}
              >
                <Text style={[styles.headerBadgeText, { color: colors.primary }]}>
                  {totalUnread}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => {
              ReactNativeHapticFeedback.trigger("impactLight");
              if (coParent) {
                handleSelectConversation(coParent.id);
              } else if (family?.invite_code) {
                // No co-parent yet - share invite code
                Share.share({
                  message: `Join our family on CoParent Connect! Use invite code: ${family.invite_code}`,
                });
              }
            }}
            style={styles.composeBtn}
            accessibilityRole="button"
            accessibilityLabel={coParent ? "New message" : "Invite co-parent"}
          >
            <Icon name={coParent ? "edit-3" : "user-plus"} size={18} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={15} color="rgba(255,255,255,0.5)" />
          <TextInput
            style={styles.searchInput}
            placeholder={"Search conversations\u2026"}
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

      {/* Conversation list */}
      {isLoading ? (
        <MessageListSkeleton />
      ) : filteredConversations.length === 0 ? (
        <EmptyConversations
          onCompose={() => {
            if (coParent) handleSelectConversation(coParent.id);
          }}
          hasCoParent={!!coParent}
          inviteCode={family?.invite_code || ""}
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
      <View style={[styles.courtNotice, { borderTopColor: colors.border }]}>
        <Icon name="lock" size={11} color={colors.mutedForeground} />
        <Text
          style={[styles.courtNoticeText, { color: colors.mutedForeground }]}
        >
          End-to-end encrypted. Messages are immutable and court-admissible.
        </Text>
      </View>
    </View>
  );

  // ---------------------------------------------------------------------------
  // Render: Thread view
  // ---------------------------------------------------------------------------

  const partnerName =
    selectedConversation?.partnerName || selectedConversationId || "";

  const renderThreadItem = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const msgDate = toDate(item.created_at);
      const isMine = item.sender_id === myId;
      const groupEnd = isGroupEnd(index);

      // Date divider: show when this message is on a different day than the
      // older message above it (next in array for inverted list).
      const nextInArray =
        index < activeMessages.length - 1 ? activeMessages[index + 1] : null;
      const showDateDivider =
        !nextInArray ||
        !isSameDay(msgDate, toDate(nextInArray.created_at));

      return (
        <View>
          <MessageBubble
            content={item.content}
            subject={item.subject}
            timestamp={msgDate}
            isMine={isMine}
            isRead={item.is_read}
            isGroupEnd={groupEnd}
            contentHash={item.content_hash}
            attachmentUrl={item.attachment_url}
            attachmentType={item.attachment_type}
            colors={colors}
          />
          {showDateDivider && <DateDivider date={msgDate} colors={colors} />}
        </View>
      );
    },
    [activeMessages, myId, colors, isGroupEnd],
  );

  const renderThreadView = () => (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      {/* Thread header */}
      <View style={[styles.threadHeader, { backgroundColor: colors.primary }]}>
        <TouchableOpacity
          onPress={handleBackToList}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back to conversations"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="arrow-left" size={22} color={colors.primaryForeground} />
        </TouchableOpacity>

        <View
          style={[
            styles.threadAvatar,
            { backgroundColor: "rgba(255,255,255,0.2)" },
          ]}
        >
          <Text
            style={[
              styles.threadAvatarText,
              { color: colors.primaryForeground },
            ]}
          >
            {getInitials(partnerName)}
          </Text>
        </View>

        <View style={styles.threadHeaderInfo}>
          <Text
            style={[
              styles.threadHeaderName,
              { color: colors.primaryForeground },
            ]}
            numberOfLines={1}
          >
            {partnerName}
          </Text>
          <View style={styles.threadHeaderSubRow}>
            <Icon name="lock" size={11} color="rgba(255,255,255,0.65)" />
            <Text style={styles.threadHeaderSub}>Secure channel</Text>
          </View>
        </View>
      </View>

      {/* Court-admissible banner */}
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
          Court-admissible: Messages are timestamped, hashed, and permanently
          stored.
        </Text>
      </View>

      {/* Messages */}
      {activeMessages.length === 0 && !isLoading ? (
        <View style={styles.emptyThread}>
          <View
            style={[
              styles.emptyThreadIcon,
              { backgroundColor: colors.accent },
            ]}
          >
            <Icon name="message-square" size={28} color={colors.primary} />
          </View>
          <Text
            style={[
              styles.emptyThreadTitle,
              { color: colors.foreground },
            ]}
          >
            Start the conversation
          </Text>
          <Text
            style={[
              styles.emptyThreadText,
              { color: colors.mutedForeground },
            ]}
          >
            Messages are encrypted and permanently stored. Long-press any
            message to view its integrity hash.
          </Text>
        </View>
      ) : (
        <View style={styles.flex}>
          <FlatList
            ref={flatListRef}
            data={activeMessages}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderThreadItem}
            inverted
            contentContainerStyle={styles.threadList}
            showsVerticalScrollIndicator={false}
            refreshing={isLoading}
            onRefresh={refetch}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />
          <ScrollToBottomButton
            visible={showScrollFab}
            onPress={handleScrollToBottom}
            colors={colors}
          />
        </View>
      )}

      {/* Tone Warning */}
      {showToneWarning && toneResult && (
        <ToneWarning
          tone={toneResult.tone}
          explanation={toneResult.explanation}
          suggestion={toneResult.suggestion}
          onUseSuggestion={() => {
            if (toneResult.suggestion) {
              setMessageInput(toneResult.suggestion);
            }
            setShowToneWarning(false);
            setToneResult(null);
          }}
          onEdit={() => {
            setShowToneWarning(false);
            setToneResult(null);
          }}
          onSendAnyway={() => {
            sendMessageDirectly(messageInput.trim(), pendingAttachment ?? undefined);
          }}
        />
      )}

      {/* Composer */}
      {pendingAttachment && (
        <View style={[attachStyles.preview, { backgroundColor: colors.muted, borderTopColor: colors.border }]}>
          <Image source={{ uri: pendingAttachment.url }} style={attachStyles.previewImage} resizeMode="cover" />
          <TouchableOpacity onPress={() => setPendingAttachment(null)} style={attachStyles.previewRemove}>
            <Icon name="x-circle" size={20} color={colors.destructive || "#dc2626"} />
          </TouchableOpacity>
        </View>
      )}
      <ComposerBar
        value={messageInput}
        onChangeText={setMessageInput}
        onSend={handleSendMessage}
        onAttach={handleAttach}
        isSending={sendMessageMutation.isPending}
        isUploading={isUploadingAttachment}
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
          {/* SMS Button */}
      <TouchableOpacity
        style={styles.smsFab}
        onPress={() => setSmsModalVisible(true)}
        activeOpacity={0.8}
      >
        <Icon name="message-square" size={20} color="#fff" />
        <View style={styles.smsFabInput}>
          <Text style={styles.smsFabText}>Text</Text>
          <Text style={styles.smsFabLabel}>Coparent</Text>
        </View>
      </TouchableOpacity>

      {/* SMS Phone Modal */}
      <Modal visible={smsModalVisible} transparent animationType="slide">
        <View style={styles.smsModal}>
          <View style={styles.smsModalContent}>
            <Text style={styles.smsModalTitle}>Send SMS to Coparent</Text>
            <Text style={styles.smsModalLabel}>Enter phone number (with country code)</Text>
            <TextInput
              style={styles.smsFabInput}
              placeholder="+1 234 567 8901"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={smsPhone}
              onChangeText={setSmsPhone}
              autoFocus
            />
            <View style={styles.smsModalActions}>
              <TouchableOpacity
                style={[styles.smsModalButton, styles.smsModalCancelButton]}
                onPress={() => setSmsModalVisible(false)}
              >
                <Text style={styles.smsModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smsModalButton, styles.smsModalSendButton]}
                onPress={() => {
                  setSmsModalVisible(false);
                  openSMS();
                }}
              >
                <Text style={styles.smsModalButtonText}>Open SMS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const attachStyles = StyleSheet.create({
  preview: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  previewImage: { width: 60, height: 60, borderRadius: 8 },
  previewRemove: { marginLeft: 8 },
});

const styles = StyleSheet.create({
  smsModal: {
    backgroundColor: "rgba(0,0,0,0.5)",
    flex: 1,
    justifyContent: "flex-end",
  },
  smsModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
  },
  smsModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  smsModalLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  smsModalActions: {
    flexDirection: "row",
    gap: 12,
  },
  smsModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  smsModalCancelButton: {
    backgroundColor: "#E5E7EB",
  },
  smsModalSendButton: {
    backgroundColor: "#10B981",
  },
  smsModalButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
/  safe: { flex: 1 },
  flex: { flex: 1 },

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
  listHeaderTitle: { fontSize: 20, fontWeight: "700" },
  headerBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginLeft: 4,
  },
  headerBadgeText: { fontSize: 11, fontWeight: "700" },
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

  // -- Conversation list --
  conversationListContent: { paddingBottom: 8 },

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
  courtNoticeText: { fontSize: 10 },

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
  threadAvatarText: { fontSize: 14, fontWeight: "700" },
  threadHeaderInfo: { flex: 1 },
  threadHeaderName: { fontSize: 16, fontWeight: "600" },
  threadHeaderSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  threadHeaderSub: { fontSize: 11, color: "rgba(255,255,255,0.65)" },

  // -- Admissible banner --
  admissibleBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  admissibleText: { fontSize: 12, flex: 1, lineHeight: 16 },

  // -- Thread messages --
  threadList: { paddingVertical: 8 },
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
  emptyThreadTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 6,
  },
  emptyThreadText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
