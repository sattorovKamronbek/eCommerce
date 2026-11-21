import Link from "next/link";
import { ArrowRight, ClipboardList, Package, ReceiptText, ShieldCheck, TriangleAlert, UsersRound } from "lucide-react";
import { AccountUnavailable, AccountDenied, accountLocale } from "@/components/account/shell";
import { WorkspaceShell } from "@/components/account/workspace";
import { requireAdmin } from "@/lib/auth/access";
import { dashboardDictionaries } from "@/messages/admin-dashboard";

const sections = [
  { key: "users", path: "/users", icon: UsersRound },
  { key: "sellers", path: "/sellers?status=pending", icon: ShieldCheck },
  { key: "listings", path: "/listings", icon: Package },
  { key: "orders", path: "/orders", icon: ClipboardList },
  { key: "payments", path: "/orders?status=reported", icon: ReceiptText },
  { key: "disputes", path: "/orders?status=disputed", icon: TriangleAlert },
] as const;

export default async function AdminDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await accountLocale(params);
  const base = `/${locale}/admin`;
  const access = await requireAdmin(locale, base);
  if (access.kind === "unavailable") return <AccountUnavailable locale={locale} />;
  if (access.kind === "denied") return <AccountDenied locale={locale} />;

  const copy = dashboardDictionaries[locale];
  const owner = access.role === "owner";

  return <WorkspaceShell locale={locale} title={owner ? copy.ownerTitle : copy.adminTitle} intro={copy.intro} active="dashboard" admin>
    <ul className="admin-dashboard" role="list">
      {sections.map(({ key, path, icon: Icon }) => <li key={key}>
        <Link href={`${base}${path}`} prefetch={false} className="admin-dashboard-link">
          <Icon aria-hidden="true" className="admin-dashboard-icon" />
          <h2>{copy[key].title}</h2>
          <p>{key === "users" && owner ? copy.ownerUsers : copy[key].description}</p>
          <ArrowRight aria-hidden="true" className="admin-dashboard-arrow" />
        </Link>
      </li>)}
    </ul>
  </WorkspaceShell>;
}
