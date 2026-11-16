import { AccountEntry, type AccountPageProps } from "@/components/account/entry";

export default function ResendConfirmation(props: AccountPageProps) {
  return <AccountEntry {...props} mode="resend" />;
}
