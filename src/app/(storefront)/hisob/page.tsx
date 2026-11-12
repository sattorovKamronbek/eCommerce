import { copy } from "@/messages";
import Link from "next/link";
import { accountDictionaries } from "@/messages/account";
export const metadata = { title: copy.shaxsiyHisob };
export default function Account() {
  return (
    <div className="section page-section info-page">
      <p className="eyebrow">{copy.shaxsiyHisob}</p>
      <h1>{copy.sizUchunAjratilganJoy}</h1>
      <p>{accountDictionaries.uz.legacyIntro}</p>
      <p>{accountDictionaries.uz.legacyNote}</p>
      <Link className="text-link" href="/uz/account">
        {accountDictionaries.uz.accountLink}
      </Link>
    </div>
  );
}
