import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";

export function useRefreshOnFocus(queryKey: string[]) {
  const queryClient = useQueryClient();

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey });
    }, [queryClient, ...queryKey]),
  );
}
