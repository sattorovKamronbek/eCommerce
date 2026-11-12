import { AccountUnavailable, AccountDenied, accountLocale } from "@/components/account/shell";
import { AdminUsersView } from "@/components/account/admin-users";
import { requireAdmin } from "@/lib/auth/access";
import { loadAdminProfiles, parseAdminFilters } from "@/lib/auth/admin-users";

export default async function AdminUsers({ params, searchParams }: {
  params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await accountLocale(params);
  const access = await requireAdmin(locale, `/${locale}/admin/users`);
  if (access.kind === "unavailable") return <AccountUnavailable locale={locale} />;
  if (access.kind === "denied") return <AccountDenied locale={locale} />;
  const filters = parseAdminFilters(await searchParams);
  const result = await loadAdminProfiles(access.client, filters);
  return <AdminUsersView locale={locale} filters={filters} result={result} />;
}
