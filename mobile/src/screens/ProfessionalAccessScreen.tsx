import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";

import {
  useProfessionalInvites,
  useFamilyProfessionals,
  useCreateProfessionalInvite,
  useRevokeProfessionalInvite,
  useRevokeProfessionalAccess,
} from "../hooks/useProfessionals";
import { useTheme } from "../theme/useTheme";
import { formatShortDate } from "../utils/formatDate";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProfessionalRole = "attorney" | "mediator";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLE_CONFIG: Record<ProfessionalRole, { label: string; color: string; bgColor: string }> = {
  attorney: { label: "Attorney", color: "#1E40AF", bgColor: "#DBEAFE" },
  mediator: { label: "Mediator", color: "#7C3AED", bgColor: "#EDE9FE" },
};

const ACCESS_SCOPES = ["Messages", "Expenses", "Calendar", "Documents"];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ProfessionalAccessScreen() {
  const { colors } = useTheme();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteRole, setInviteRole] = useState<ProfessionalRole>("attorney");
  const [inviteEmail, setInviteEmail] = useState("");

  const {
    data: professionals = [],
    isLoading: professionalsLoading,
    refetch: refetchProfessionals,
  } = useFamilyProfessionals();

  const {
    data: invites = [],
    isLoading: invitesLoading,
    isRefetching: invitesRefetching,
    refetch: refetchInvites,
  } = useProfessionalInvites();

  const createInvite = useCreateProfessionalInvite();
  const revokeInvite = useRevokeProfessionalInvite();
  const revokeAccess = useRevokeProfessionalAccess();

  const isLoading = professionalsLoading && invitesLoading;

  function handleRefresh() {
    refetchProfessionals();
    refetchInvites();
  }

  // -- Handlers -------------------------------------------------------------

  function handleRevokeAccess(professional: any) {
    const name = professional.name ?? professional.email ?? "this professional";
    Alert.alert(
      "Revoke Access",
      `Are you sure you want to revoke access for ${name}? They will no longer be able to view your records.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revoke",
          style: "destructive",
          onPress: () => {
            ReactNativeHapticFeedback.trigger("impactMedium");
            revokeAccess.mutate(professional.id, {
              onSuccess: () => {
                ReactNativeHapticFeedback.trigger("notificationSuccess");
                refetchProfessionals();
              },
              onError: () => {
                Alert.alert("Error", "Could not revoke access. Please try again.");
              },
            });
          },
        },
      ],
    );
  }

  function handleRevokeInvite(invite: any) {
    Alert.alert(
      "Revoke Invite",
      "Are you sure you want to revoke this pending invite?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revoke",
          style: "destructive",
          onPress: () => {
            ReactNativeHapticFeedback.trigger("impactMedium");
            revokeInvite.mutate(invite.id, {
              onSuccess: () => {
                ReactNativeHapticFeedback.trigger("notificationSuccess");
                refetchInvites();
              },
              onError: () => {
                Alert.alert("Error", "Could not revoke invite. Please try again.");
              },
            });
          },
        },
      ],
    );
  }

  function handleCopyCode(code: string) {
    ReactNativeHapticFeedback.trigger("impactLight");
    Alert.alert("Invite Code", code, [{ text: "OK" }]);
  }

  function handleCreateInvite() {
    ReactNativeHapticFeedback.trigger("impactMedium");
    createInvite.mutate(
      {
        role: inviteRole,
        email: inviteEmail.trim() || undefined,
      },
      {
        onSuccess: (data: any) => {
          ReactNativeHapticFeedback.trigger("notificationSuccess");
          setShowInviteModal(false);
          setInviteEmail("");
          refetchInvites();
          if (data?.code ?? data?.invite_code) {
            Alert.alert(
              "Invite Created",
              `Share this code with your ${inviteRole}:\n\n${data.code ?? data.invite_code}`,
            );
          }
        },
        onError: () => {
          ReactNativeHapticFeedback.trigger("notificationError");
          Alert.alert("Error", "Could not create invite. Please try again.");
        },
      },
    );
  }

  // -- Sub-components -------------------------------------------------------

  function RoleBadge({ role }: { role: string }) {
    const normalizedRole: ProfessionalRole = role === "mediator" ? "mediator" : "attorney";
    const config = ROLE_CONFIG[normalizedRole];

    return (
      <View style={[styles.roleBadge, { backgroundColor: config.bgColor }]}>
        <Text style={[styles.roleBadgeText, { color: config.color }]}>
          {config.label}
        </Text>
      </View>
    );
  }

  function ProfessionalCard({ professional }: { professional: any }) {
    const name = professional.name ?? professional.email ?? "Unknown";
    const role = professional.role ?? "attorney";
    const scopes: string[] = professional.access_scope ?? professional.accessScope ?? ACCESS_SCOPES;

    return (
      <View
        style={[styles.professionalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        accessibilityRole="summary"
      >
        <View style={styles.professionalHeader}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
            <Icon name="user" size={18} color={colors.primaryForeground} />
          </View>
          <View style={styles.professionalInfo}>
            <Text style={[styles.professionalName, { color: colors.foreground }]}>
              {name}
            </Text>
            <RoleBadge role={role} />
          </View>
        </View>

        <View style={styles.scopeSection}>
          <Text style={[styles.scopeLabel, { color: colors.mutedForeground }]}>
            Access Scope
          </Text>
          <View style={styles.scopeGrid}>
            {ACCESS_SCOPES.map((scope) => {
              const hasAccess = scopes.some(
                (s: string) => s.toLowerCase() === scope.toLowerCase(),
              );
              return (
                <View key={scope} style={styles.scopeItem}>
                  <Icon
                    name={hasAccess ? "check-circle" : "circle"}
                    size={14}
                    color={hasAccess ? colors.primary : colors.border}
                  />
                  <Text
                    style={[
                      styles.scopeText,
                      { color: hasAccess ? colors.foreground : colors.mutedForeground },
                    ]}
                  >
                    {scope}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          onPress={() => handleRevokeAccess(professional)}
          style={[styles.revokeButton, { borderColor: colors.destructive }]}
          accessibilityRole="button"
          accessibilityLabel={`Revoke access for ${name}`}
        >
          <Icon name="shield-off" size={14} color={colors.destructive} />
          <Text style={[styles.revokeButtonText, { color: colors.destructive }]}>
            Revoke Access
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  function InviteCard({ invite }: { invite: any }) {
    const code = invite.code ?? invite.invite_code ?? "------";
    const role = invite.role ?? "attorney";
    const expiresAt = invite.expires_at ?? invite.expiresAt;

    return (
      <View
        style={[styles.inviteCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        accessibilityRole="summary"
      >
        <View style={styles.inviteHeader}>
          <RoleBadge role={role} />
          {expiresAt && (
            <Text style={[styles.expiryText, { color: colors.mutedForeground }]}>
              Expires {formatShortDate(expiresAt)}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => handleCopyCode(code)}
          style={[styles.codeContainer, { backgroundColor: colors.muted, borderColor: colors.border }]}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Copy invite code ${code}`}
        >
          <Text style={[styles.codeText, { color: colors.foreground }]}>
            {code}
          </Text>
          <Icon name="copy" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleRevokeInvite(invite)}
          style={[styles.revokeButton, { borderColor: colors.destructive }]}
          accessibilityRole="button"
          accessibilityLabel="Revoke this invite"
        >
          <Icon name="x-circle" size={14} color={colors.destructive} />
          <Text style={[styles.revokeButtonText, { color: colors.destructive }]}>
            Revoke Invite
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  function InviteModal() {
    return (
      <Modal visible={showInviteModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalHeaderTitle, { color: colors.foreground }]}>
                Create Invite
              </Text>
              <TouchableOpacity
                onPress={() => setShowInviteModal(false)}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Icon name="x" size={24} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.foreground }]}>
              Professional Role
            </Text>
            <View style={styles.rolePickerRow}>
              {(["attorney", "mediator"] as ProfessionalRole[]).map((role) => {
                const isSelected = inviteRole === role;
                const config = ROLE_CONFIG[role];
                return (
                  <TouchableOpacity
                    key={role}
                    onPress={() => {
                      ReactNativeHapticFeedback.trigger("selection");
                      setInviteRole(role);
                    }}
                    style={[
                      styles.rolePicker,
                      { backgroundColor: colors.muted, borderColor: colors.border },
                      isSelected && { backgroundColor: config.bgColor, borderColor: config.color },
                    ]}
                    activeOpacity={0.7}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={config.label}
                  >
                    <Icon
                      name={role === "attorney" ? "briefcase" : "users"}
                      size={18}
                      color={isSelected ? config.color : colors.mutedForeground}
                    />
                    <Text
                      style={[
                        styles.rolePickerText,
                        { color: isSelected ? config.color : colors.mutedForeground },
                      ]}
                    >
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.inputLabel, { color: colors.foreground, marginTop: 16 }]}>
              Email (optional)
            </Text>
            <TextInput
              style={[styles.textInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="professional@example.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Professional email address"
            />

            <TouchableOpacity
              onPress={handleCreateInvite}
              style={[styles.generateButton, { backgroundColor: colors.primary }]}
              disabled={createInvite.isPending}
              accessibilityRole="button"
              accessibilityLabel="Generate invite code"
            >
              {createInvite.isPending ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <>
                  <Icon name="key" size={16} color={colors.primaryForeground} />
                  <Text style={[styles.generateButtonText, { color: colors.primaryForeground }]}>
                    Generate Code
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  function EmptyProfessionals() {
    return (
      <View style={styles.emptySection}>
        <Icon name="shield" size={36} color={colors.border} />
        <Text style={[styles.emptySectionTitle, { color: colors.mutedForeground }]}>
          No active professionals
        </Text>
        <Text style={[styles.emptySectionSubtext, { color: colors.mutedForeground }]}>
          Invite an attorney or mediator to grant them access.
        </Text>
      </View>
    );
  }

  function EmptyInvites() {
    return (
      <View style={styles.emptySection}>
        <Icon name="mail" size={36} color={colors.border} />
        <Text style={[styles.emptySectionTitle, { color: colors.mutedForeground }]}>
          No pending invites
        </Text>
      </View>
    );
  }

  // -- Render ---------------------------------------------------------------

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={[]}>
        <View style={styles.centeredLoader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={[]}>
      <FlatList
        data={[]}
        renderItem={null}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={invitesRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            {/* Active Professionals */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Active Professionals
              </Text>
              {professionals.length === 0 ? (
                <EmptyProfessionals />
              ) : (
                professionals.map((p: any) => (
                  <ProfessionalCard key={p.id} professional={p} />
                ))
              )}
            </View>

            {/* Pending Invites */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Pending Invites
              </Text>
              {invites.length === 0 ? (
                <EmptyInvites />
              ) : (
                invites.map((invite: any) => (
                  <InviteCard key={invite.id} invite={invite} />
                ))
              )}
            </View>
          </>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => {
          ReactNativeHapticFeedback.trigger("impactLight");
          setShowInviteModal(true);
        }}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Create professional invite"
      >
        <Icon name="user-plus" size={24} color={colors.primaryForeground} />
      </TouchableOpacity>

      <InviteModal />
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
  centeredLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 80,
  },

  // -- Section --------------------------------------------------------------
  section: {
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },

  // -- Professional card ----------------------------------------------------
  professionalCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 0.5,
  },
  professionalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  professionalInfo: {
    flex: 1,
    gap: 4,
  },
  professionalName: {
    fontSize: 15,
    fontWeight: "600",
  },

  // -- Role badge -----------------------------------------------------------
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },

  // -- Access scope ---------------------------------------------------------
  scopeSection: {
    marginBottom: 14,
  },
  scopeLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 8,
  },
  scopeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  scopeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    width: "45%",
  },
  scopeText: {
    fontSize: 13,
  },

  // -- Revoke button --------------------------------------------------------
  revokeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  revokeButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // -- Invite card ----------------------------------------------------------
  inviteCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 0.5,
  },
  inviteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  expiryText: {
    fontSize: 12,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  codeText: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 2,
  },

  // -- Empty sections -------------------------------------------------------
  emptySection: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptySectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 10,
  },
  emptySectionSubtext: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
  },

  // -- FAB ------------------------------------------------------------------
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },

  // -- Modal ----------------------------------------------------------------
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  rolePickerRow: {
    flexDirection: "row",
    gap: 10,
  },
  rolePicker: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  rolePickerText: {
    fontSize: 15,
    fontWeight: "600",
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 24,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
