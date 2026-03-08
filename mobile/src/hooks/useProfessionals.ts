import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProfessionalInvites,
  getFamilyProfessionals,
  createProfessionalInvite,
  revokeProfessionalInvite,
  updateProfessionalAccess,
  revokeProfessionalAccess,
} from "../api/professionals";

export function useProfessionalInvites() {
  return useQuery({
    queryKey: ["professionalInvites"],
    queryFn: getProfessionalInvites,
  });
}

export function useFamilyProfessionals() {
  return useQuery({
    queryKey: ["familyProfessionals"],
    queryFn: getFamilyProfessionals,
  });
}

export function useCreateProfessionalInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ role, email }: { role: string; email?: string }) =>
      createProfessionalInvite(role, email),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["professionalInvites"] }),
  });
}

export function useRevokeProfessionalInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeProfessionalInvite,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["professionalInvites"] }),
  });
}

export function useUpdateProfessionalAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      permissions,
    }: {
      id: string;
      permissions: Record<string, boolean>;
    }) => updateProfessionalAccess(id, permissions),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["familyProfessionals"] }),
  });
}

export function useRevokeProfessionalAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeProfessionalAccess,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["familyProfessionals"] }),
  });
}
