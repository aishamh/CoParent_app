import { useQuery, useMutation } from "@tanstack/react-query";
import { updatePaymentInfo, getUserPaymentInfo } from "../api/payments";

export function useUpdatePaymentInfo() {
  return useMutation({
    mutationFn: updatePaymentInfo,
  });
}

export function useUserPaymentInfo(userId: string) {
  return useQuery({
    queryKey: ["paymentInfo", userId],
    queryFn: () => getUserPaymentInfo(userId),
    enabled: Boolean(userId),
  });
}
