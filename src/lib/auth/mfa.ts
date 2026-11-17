export type MfaActionState = {
  error?: "unavailable" | "invalid" | "stepUpRequired" | "pendingSetup";
  setup?: { factorId: string; qr: string; secret: string };
};
