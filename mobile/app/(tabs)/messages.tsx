import React, { useState, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useAuth } from "../../src/auth/useAuth";
import { useTheme } from "../../src/theme/useTheme";
import { useMessages, useSendMessage, useUnreadCount } from "../../src/hooks/useMessages";
import { useRefreshOnFocus } from "../../src/hooks/useRefreshOnFocus";
import { formatRelative } from "../../src/utils/formatDate";
import type { Message } from "../../src/types/schema";
import type { ColorPalette } from "../../src/constants/colors";

function MessageBubble({
  message,
  isSent,
  colors,
}: {
  message: Message;
  isSent: boolean;
  colors: ColorPalette;
}) {
  return (
    <View
      style={[
        styles.bubbleContainer,
        isSent ? styles.bubbleContainerSent : styles.bubbleContainerReceived,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isSent
            ? [styles.bubbleSent, { backgroundColor: colors.primary }]
            : [styles.bubbleReceived, { backgroundColor: colors.border }],
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            isSent
              ? { color: colors.primaryForeground }
              : { color: colors.foreground },
          ]}
        >
          {message.content}
        </Text>
      </View>
      <View
        style={[
          styles.metaRow,
          isSent ? styles.metaRowSent : styles.metaRowReceived,
        ]}
      >
        <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>
          {formatRelative(message.created_at)}
        </Text>
        {isSent && (
          <Feather
            name={message.is_read ? "check-circle" : "check"}
            size={12}
            color={message.is_read ? colors.primary : colors.mutedForeground}
            style={styles.readIcon}
          />
        )}
      </View>
    </View>
  );
}

function EmptyMessages({ colors }: { colors: ColorPalette }) {
  return (
    <View style={styles.emptyState}>
      <Feather name="message-circle" size={48} color={colors.border} />
      <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>No messages yet</Text>
      <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
        Start a conversation with your co-parent.
      </Text>
    </View>
  );
}

function ComposerBar({
  onSend,
  isSending,
  colors,
}: {
  onSend: (text: string) => void;
  isSending: boolean;
  colors: ColorPalette;
}) {
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend(trimmed);
    setText("");
    inputRef.current?.focus();
  };

  const canSend = text.trim().length > 0 && !isSending;

  return (
    <View style={[styles.composerBar, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
      <TextInput
        ref={inputRef}
        style={[styles.composerInput, { backgroundColor: colors.muted, color: colors.foreground }]}
        placeholder="Type a message..."
        placeholderTextColor={colors.mutedForeground}
        value={text}
        onChangeText={setText}
        multiline
        maxLength={2000}
        returnKeyType="send"
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
        accessibilityLabel="Message input"
      />
      <TouchableOpacity
        onPress={handleSend}
        disabled={!canSend}
        style={[
          styles.sendButton,
          { backgroundColor: colors.border },
          canSend && { backgroundColor: colors.primary },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Send message"
        accessibilityState={{ disabled: !canSend }}
      >
        {isSending ? (
          <ActivityIndicator size="small" color={colors.primaryForeground} />
        ) : (
          <Feather
            name="send"
            size={20}
            color={canSend ? colors.primaryForeground : colors.mutedForeground}
          />
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function MessagesScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { data: messages = [], isLoading } = useMessages();
  const { data: unreadCount = 0 } = useUnreadCount();
  const sendMessageMutation = useSendMessage();

  useRefreshOnFocus(["messages"]);

  const handleSend = (content: string) => {
    if (!user) return;

    sendMessageMutation.mutate({
      receiver_id: 0,
      content,
    });
  };

  const currentUserId = user?.id;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.header, { color: colors.foreground }]}>Messages</Text>
          {unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.unreadBadgeText, { color: colors.primaryForeground }]}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : messages.length === 0 ? (
          <EmptyMessages colors={colors} />
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                isSent={item.sender_id === currentUserId}
                colors={colors}
              />
            )}
            inverted
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
          />
        )}

        <ComposerBar
          onSend={handleSend}
          isSending={sendMessageMutation.isPending}
          colors={colors}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
  },
  unreadBadge: {
    marginLeft: 10,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  bubbleContainer: {
    marginVertical: 4,
    maxWidth: "80%",
  },
  bubbleContainerSent: {
    alignSelf: "flex-end",
  },
  bubbleContainerReceived: {
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
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
    paddingHorizontal: 4,
  },
  metaRowSent: {
    justifyContent: "flex-end",
  },
  metaRowReceived: {
    justifyContent: "flex-start",
  },
  timestamp: {
    fontSize: 11,
  },
  readIcon: {
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
  },
  composerBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 0.5,
  },
  composerInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
