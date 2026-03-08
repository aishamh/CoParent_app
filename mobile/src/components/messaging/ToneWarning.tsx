import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";

import { useTheme } from "../../theme/useTheme";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ToneWarningProps {
  tone: string;
  explanation?: string;
  suggestion?: string;
  onUseSuggestion: () => void;
  onEdit: () => void;
  onSendAnyway: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AMBER_BG = "#FFFBEB";
const AMBER_BORDER = "#FDE68A";
const AMBER_ICON = "#D97706";
const TONE_BADGE_BG = "#FEE2E2";
const TONE_BADGE_TEXT = "#991B1B";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ToneWarning({
  tone,
  explanation,
  suggestion,
  onUseSuggestion,
  onEdit,
  onSendAnyway,
}: ToneWarningProps) {
  const { colors } = useTheme();

  function handleUseSuggestion() {
    ReactNativeHapticFeedback.trigger("impactLight");
    onUseSuggestion();
  }

  function handleEdit() {
    ReactNativeHapticFeedback.trigger("impactLight");
    onEdit();
  }

  function handleSendAnyway() {
    ReactNativeHapticFeedback.trigger("selection");
    onSendAnyway();
  }

  return (
    <View
      style={[styles.container, { borderColor: AMBER_BORDER }]}
      accessibilityRole="alert"
      accessibilityLabel="Communication coaching warning"
    >
      {/* Header */}
      <View style={styles.header}>
        <Icon name="alert-triangle" size={18} color={AMBER_ICON} />
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Communication Coaching
        </Text>
      </View>

      {/* Tone badge */}
      <View style={[styles.toneBadge, { backgroundColor: TONE_BADGE_BG }]}>
        <Text style={[styles.toneBadgeText, { color: TONE_BADGE_TEXT }]}>
          {tone}
        </Text>
      </View>

      {/* Explanation */}
      {explanation ? (
        <Text style={[styles.explanation, { color: colors.foreground }]}>
          {explanation}
        </Text>
      ) : null}

      {/* Suggestion box */}
      {suggestion ? (
        <View style={[styles.suggestionBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.suggestionLabel, { color: colors.mutedForeground }]}>
            Suggested rewrite:
          </Text>
          <Text style={[styles.suggestionText, { color: colors.foreground }]}>
            {suggestion}
          </Text>
        </View>
      ) : null}

      {/* Action buttons */}
      <View style={styles.actions}>
        {suggestion ? (
          <TouchableOpacity
            onPress={handleUseSuggestion}
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Use suggested rewrite"
          >
            <Icon name="check" size={14} color={colors.primaryForeground} />
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
              Use Suggestion
            </Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          onPress={handleEdit}
          style={[styles.outlineButton, { borderColor: colors.border }]}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Edit message"
        >
          <Icon name="edit-2" size={14} color={colors.foreground} />
          <Text style={[styles.outlineButtonText, { color: colors.foreground }]}>
            Edit Message
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSendAnyway}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Send message anyway"
        >
          <Text style={[styles.sendAnywayText, { color: colors.mutedForeground }]}>
            Send Anyway
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    backgroundColor: AMBER_BG,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
  },

  // -- Header ---------------------------------------------------------------
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
  },

  // -- Tone badge -----------------------------------------------------------
  toneBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  toneBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // -- Explanation ----------------------------------------------------------
  explanation: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },

  // -- Suggestion box -------------------------------------------------------
  suggestionBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  suggestionLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 14,
    lineHeight: 20,
  },

  // -- Actions --------------------------------------------------------------
  actions: {
    gap: 8,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  outlineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  outlineButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  sendAnywayText: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    paddingVertical: 6,
  },
});
