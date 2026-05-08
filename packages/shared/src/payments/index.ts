export {
  createPaymentIntent,
  capturePayment,
  refundPayment,
  constructWebhookEvent,
  getPaymentIntentStatus,
  getPaymentStatus,
  createConnectAccount,
  createAccountLink,
  createTransfer,
  getAccountStatus,
} from "./stripe";

/**
 * Stub payment adapter for when no payment provider is configured.
 * This allows the system to work without any real payment integration.
 */
export const stubPaymentAdapter = {
  createPaymentIntent: async (amount: number, currency: string) => ({
    id: `pi_stub_${Date.now().toString(36)}`,
    status: "requires_capture",
    amount: Math.round(amount * 100),
  }),
  capturePayment: async (paymentIntentId: string) => ({
    id: paymentIntentId,
    status: "succeeded",
  }),
  refundPayment: async (transactionId: string) => ({
    id: `re_stub_${Date.now().toString(36)}`,
    status: "succeeded",
  }),
  getPaymentStatus: () => "stub" as const,
};
