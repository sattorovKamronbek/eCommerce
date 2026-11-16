import type { AccountFeedback } from "@/messages/account";
export type AccountField = "email" | "password" | "repeatPassword" | "displayName" | "preferredLocale";
export type AccountState = { status: "idle" | "success" | "error"; message?: AccountFeedback; fields?: Partial<Record<AccountField, boolean>> };
export type AccountAction = (state: AccountState, form: FormData) => Promise<AccountState>;
export const initialAccountState: AccountState = { status: "idle" };
