import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getChildren, createChild, updateChild } from "../api/children";

export function useChildren() {
  return useQuery({ queryKey: ["children"], queryFn: getChildren });
}

export function useCreateChild() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createChild,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["children"] }),
  });
}

export function useUpdateChild() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: number;
      updates: Record<string, unknown>;
    }) => updateChild(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["children"] }),
  });
}
