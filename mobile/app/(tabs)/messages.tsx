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

import { useAuth } from "../../src/auth/useAuth";
import { useMessages, useSendMessage, useUnreadCount } from "../../src/hooks/useMessages";
import { useRefreshOnFocus } from "../../src/hooks/useRefreshOnFocus";
import { formatRelative } from "../../src/utils/formatDate";
import type { Message } from "../../src/types/schema";

const TEAL = "#0d9488";
const BACKGROUND = "#FDFAF5";

function MessageBubble({
  message,
  isSent,
}: {
  message: Message;
  isSent: boolean;
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
          isSent ? styles.bubbleSent : styles.bubbleReceived,
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            isSent ? styles.bubbleTextSent : styles.bubbleTextReceived,
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
        <Text style={styles.timestamp}>
          {formatRelative(message.created_at)}
        </Text>
        {isSent && (
          <Feather
            name={message.is_read ? "check-circle" : "check"}
            size={12}
            color={message.is_read ? TEAL : "#9CA3AF"}
            style={styles.readIcon}
          />
        )}
      </View>
    </View>
  );
}

function EmptyMessages() {
  return (
    <View style={styles.emptyState}>
      <Feather name="message-circle" size={48} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No messages yet</Text>
      <Text style={styles.emptySubtext}>
        Start a conversation with your co-parent.
      </Text>
    </View>
  );
}

function ComposerBar({
  onSend,
  isSending,
}: {
  onSend: (text: string) => void;
  isSending: boolean;
}) {
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    onSend(trimmed);
    setText("");
    inputRef.current?.focus();
  };

  const canSend = text.trim().length > 0 && !isSending;

  return (
    <View style={styles.composerBar}>
      <TextInput
        ref={inputRef}
        style={styles.composerInput}
        placeholder="Type a message..."
        placeholderTextColor="#9CA3AF"
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
        style={[styles.sendButton, canSend && styles.sendButtonActive]}
        accessibilityRole="button"
        accessibilityLabel="Send message"
        accessibilityState={{ disabled: !canSend }}
      >
        {isSending ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Feather
            name="send"
            size={20}
            color={canSend ? "#FFFFFF" : "#9CA3AF"}
          />
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function MessagesScreen() {
  const { user } = useAuth();
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
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.header}>Messages</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {/* Messages List */}
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={TEAL} />
          </View>
        ) : messages.length === 0 ? (
          <EmptyMessages />
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                isSent={item.sender_id === currentUserId}
              />
            )}
            inverted
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Composer */}
        <ComposerBar
          onSend={handleSend}
          isSending={sendMessageMutation.isPending}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BACKGROUND,
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
    color: "#111827",
  },
  unreadBadge: {
    marginLeft: 10,
    backgroundColor: TEAL,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
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
    backgroundColor: TEAL,
    borderBottomRightRadius: 4,
  },
  bubbleReceived: {
    backgroundColor: "#E5E7EB",
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTextSent: {
    color: "#FFFFFF",
  },
  bubbleTextReceived: {
    color: "#1F2937",
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
    color: "#9CA3AF",
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
    color: "#6B7280",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 6,
  },
  composerBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  composerInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#1F2937",
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonActive: {
    backgroundColor: TEAL,
  },
});
