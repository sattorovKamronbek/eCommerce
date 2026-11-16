import Link from "next/link";
import { ArrowLeft, ArrowRight, Info, UsersRound } from "lucide-react";
import { WorkspaceShell } from "./workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { accountDictionaries } from "@/messages/account";
import { localeNames, type MarketplaceLocale } from "@/messages/marketplace";
import { adminUsersHref, type AdminFilters, type AdminProfiles } from "@/lib/auth/admin-users";

export function AdminUsersView({ locale, filters, result }: { locale: MarketplaceLocale; filters: AdminFilters; result: AdminProfiles }) {
  const copy = accountDictionaries[locale];
  const filtered = !!(filters.q || filters.language);
  const base = `/${locale}/admin/users`;
  const date = new Intl.DateTimeFormat(locale === "uz" ? "uz-UZ" : locale === "ru" ? "ru-RU" : "en-US", { dateStyle: "medium", timeZone: "UTC" });
  return <WorkspaceShell locale={locale} title={copy.users} intro={copy.usersIntro} active="users" admin>
    <form className="workspace-filters" action={base}>
      <Field><FieldLabel htmlFor="profile-search">{copy.searchName}</FieldLabel>
        <Input id="profile-search" type="search" name="q" defaultValue={filters.q} maxLength={80} placeholder={copy.searchPlaceholder} />
      </Field>
      <Field><FieldLabel htmlFor="profile-language">{copy.preferredLocale}</FieldLabel>
        <NativeSelect id="profile-language" name="language" defaultValue={filters.language}>
          <NativeSelectOption value="">{copy.allLanguages}</NativeSelectOption>
          {(["uz", "ru", "en"] as const).map(language => <NativeSelectOption key={language} value={language}>{localeNames[language]}</NativeSelectOption>)}
        </NativeSelect>
      </Field>
      <Button type="submit">{copy.search}</Button>
      {filtered ? <Link className="mp-text-link" href={base}>{copy.clearFilters}</Link> : null}
    </form>
    {result.error ? <Alert><AlertDescription>{copy.usersUnavailable}<Link className="mp-text-link" href={adminUsersHref(locale, filters)}>{copy.retry}</Link></AlertDescription></Alert> : <>
      <div className="account-table-scroll" tabIndex={0} role="region" aria-label={copy.users}>
        <table className="account-table">
          <caption className="sr-only">{copy.usersIntro}</caption>
          <thead><tr><th scope="col">{copy.displayName}</th><th scope="col">{copy.identifier}</th><th scope="col">{copy.preferredLocale}</th><th scope="col">{copy.created}</th></tr></thead>
          <tbody>{result.rows.map(profile => <tr key={profile.id}>
            <td><span className="account-table-name">{profile.display_name || copy.unnamed}</span></td><td><code>{profile.id}</code></td>
            <td>{localeNames[profile.preferred_locale]}</td><td><time dateTime={profile.created_at}>{date.format(new Date(profile.created_at))}</time></td>
          </tr>)}</tbody>
        </table>
        {!result.rows.length ? <div className="workspace-empty">
          <UsersRound aria-hidden="true" /><h2>{filtered ? copy.noMatches : copy.emptyUsers}</h2>
          <p>{filtered ? copy.noMatchesHint : copy.emptyUsersHint}</p>
          {filtered || filters.page > 1 ? <Link className="mp-text-link" href={base}>{copy.clearFilters}</Link> : null}
        </div> : null}
      </div>
      <nav className="account-pagination" aria-label={copy.pagination}>
        {filters.page > 1 ? <Link href={adminUsersHref(locale, filters, filters.page - 1)} rel="prev"><ArrowLeft aria-hidden="true" />{copy.previous}</Link> : <span aria-disabled="true"><ArrowLeft aria-hidden="true" />{copy.previous}</span>}
        <span aria-current="page">{copy.page} {filters.page}</span>
        {result.hasNext ? <Link href={adminUsersHref(locale, filters, filters.page + 1)} rel="next">{copy.next}<ArrowRight aria-hidden="true" /></Link> : <span aria-disabled="true">{copy.next}<ArrowRight aria-hidden="true" /></span>}
      </nav>
    </>}
    <div className="workspace-note"><Info aria-hidden="true" /><div><p>{copy.readOnly}</p><span>{copy.readOnlyBody}</span></div></div>
  </WorkspaceShell>;
}
