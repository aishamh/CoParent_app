import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFamily, joinFamily } from "../api/family";

export function useFamily() {
  return useQuery({
    queryKey: ["family"],
    queryFn: getFamily,
  });
}

export function useJoinFamily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteCode: string) => joinFamily(inviteCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family"] });
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}
