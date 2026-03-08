import { fetchApi } from "./client";

interface PaymentInfo {
  venmo_username: string | null;
  paypal_email: string | null;
}

interface UpdatePaymentInfoData {
  venmo_username?: string;
  paypal_email?: string;
}

export async function updatePaymentInfo(
  data: UpdatePaymentInfoData,
): Promise<PaymentInfo | null> {
  try {
    return await fetchApi<PaymentInfo>("/api/users/payment-info", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  } catch {
    return null;
  }
}

export async function getUserPaymentInfo(
  userId: string,
): Promise<PaymentInfo | null> {
  try {
    return await fetchApi<PaymentInfo>(`/api/users/${userId}/payment-info`);
  } catch {
    return null;
  }
}
