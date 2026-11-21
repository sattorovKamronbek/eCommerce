import type { SupabaseClient } from "@supabase/supabase-js";
import { requestProfileIdentity, reviewProfileIdentity } from "@/app/(marketplace)/[locale]/admin/users/actions";
import type { Database, ProfileIdentityRequest } from "@/lib/supabase/database";
import type { MarketplaceLocale } from "@/messages/marketplace";
import { profileIdentityDictionaries } from "@/messages/profile-identity";
import { ActionForm } from "./action-form";

type Props = { client: SupabaseClient<Database>; locale: MarketplaceLocale; subject: string };
type IdentityHistoryRow = Pick<ProfileIdentityRequest, "id" | "status" | "created_at" | "reviewed_at">;

function identityRequests(client: Props["client"], subject: string) {
  return client.from("marketplace_profile_identity_requests").select("id, status, created_at, reviewed_at")
    .eq("subject_id", subject).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(5);
}

function IdentityHistory({ locale, rows }: { locale: MarketplaceLocale; rows: IdentityHistoryRow[] }) {
  const copy = profileIdentityDictionaries[locale];
  const dates = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tashkent" });
  return <ul className="order-timeline" role="list">{rows.map(row => {
    const time = row.reviewed_at ?? row.created_at;
    return <li key={row.id}><strong>{copy[row.status]}</strong> · <time dateTime={time}>{dates.format(new Date(time))}</time></li>;
  })}</ul>;
}

export async function AdminProfileIdentity({ client, locale, subject, canRequest }: Props & { canRequest: boolean }) {
  const copy = profileIdentityDictionaries[locale];
  const requests = await identityRequests(client, subject);
  const pending = requests.data?.find(row => row.status === "pending");
  const formCopy = { errors: copy.errors, pendingLabel: copy.pendingAction };
  const review = pending ? reviewProfileIdentity.bind(null, locale, subject, pending.id) : null;

  return <section className="order-summary profile-identity">
    <h2>{copy.title}</h2>
    {requests.error ? <p role="status">{copy.unavailable}</p> : null}
    {requests.data?.length ? <IdentityHistory locale={locale} rows={requests.data} /> : null}
    {review ? <>
      <p className="order-note">{copy.ownerInstructions}</p>
      <ActionForm action={review} label={copy.submit} {...formCopy}>
        <label>{copy.code}<input name="code" required maxLength={36} autoComplete="off" spellCheck={false} /></label>
        <label>{copy.decision}<select name="decision" defaultValue="" required>
          <option value="" disabled>{copy.choose}</option>
          <option value="verified">{copy.verified}</option>
          <option value="not_verified">{copy.not_verified}</option>
        </select></label>
      </ActionForm>
      <ActionForm action={review} label={copy.cancel} {...formCopy}>
        <input type="hidden" name="decision" value="cancelled" />
      </ActionForm>
    </> : !requests.error && canRequest ? <ActionForm action={requestProfileIdentity.bind(null, locale, subject)} label={copy.request} {...formCopy} /> : null}
  </section>;
}

export async function loadOwnProfileIdentity(client: Props["client"], subject: string) {
  const requests = await identityRequests(client, subject);
  const pending = requests.data?.find(row => row.status === "pending");
  const result = pending ? await client.rpc("marketplace_own_profile_identity_code", { p_request_id: pending.id }) : null;
  return { rows: requests.data ?? [], code: result?.data ?? null, codeUnavailable: !!result?.error };
}

export function OwnProfileIdentity({ locale, rows, code, codeUnavailable }: {
  locale: MarketplaceLocale; rows: IdentityHistoryRow[]; code: string | null; codeUnavailable: boolean;
}) {
  if (!rows.length) return null;
  const copy = profileIdentityDictionaries[locale];
  return <section className="order-summary profile-identity">
    <h2>{copy.title}</h2>
    <IdentityHistory locale={locale} rows={rows} />
    {code ? <>
      <p>{copy.instructions}</p>
      <dl><dt>{copy.code}</dt><dd><code>{code}</code></dd></dl>
    </> : codeUnavailable ? <p role="status">{copy.unavailable}</p> : null}
  </section>;
}
