import { redirect } from "next/navigation";
import { marketplaceConfig } from "@/lib/config";

export default function Entry() {
  redirect(`/${marketplaceConfig.defaultLocale}/marketplace`);
}
