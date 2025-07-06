export default function isDebugMode(): boolean {
  return process.env.DEBUG !== undefined && process.env.DEBUG == "1";
}

export const DEBUG_CTRL = {
  USE_TEST_PAYMENT_AMOUNT:
    isDebugMode() && process.env.USE_TEST_PAYMENT_AMOUNT === "1",
  USE_MOCK_LIGHTNING_INVOICE:
    isDebugMode() && process.env.USE_MOCK_LIGHTNING_INVOICE === "1",
  SUPPRESS_OUTBOUND_MESSAGES:
    isDebugMode() && process.env.SUPPRESS_OUTBOUND_MESSAGES === "1",
};
