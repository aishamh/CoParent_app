import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFamily, joinFamily, getFamilyMembers } from "../api/family";

export function useFamily() {
  return useQuery({
    queryKey: ["family"],
    queryFn: getFamily,
  });
}

export function useFamilyMembers() {
  return useQuery({
    queryKey: ["familyMembers"],
    queryFn: getFamilyMembers,
  });
}

export function useJoinFamily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteCode: string) => joinFamily(inviteCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family"] });
      queryClient.invalidateQueries({ queryKey: ["familyMembers"] });
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}
