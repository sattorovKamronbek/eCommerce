import { setCatalogSalesAccess } from "@/app/(marketplace)/[locale]/admin/users/actions";
import type { AccessRole, CatalogSalesAccess as SalesAccess } from "@/lib/supabase/database";
import { catalogSalesDictionaries } from "@/messages/catalog-sales-access";
import type { MarketplaceLocale } from "@/messages/marketplace";
import { ActionForm } from "./action-form";

const scopes = ["none", "cs2", "fashion", "both"] as const;

export function CatalogSalesAccess({ access, userId, locale, role, canManage, active }: {
  access: SalesAccess | null;
  userId: string;
  locale: MarketplaceLocale;
  role: AccessRole;
  canManage: boolean;
  active: boolean;
}) {
  const copy = catalogSalesDictionaries[locale];
  const legacyScope = access?.scope === null ? access.legacy_scope : null;
  const scope = access?.scope ?? (role === "customer" ? null : legacyScope) ?? "none";
  return <section className="order-summary" aria-labelledby="catalog-sales-access">
    <h2 id="catalog-sales-access">{copy.title}</h2>
    {access ? <>
      <dl className="order-facts">
        <div><dt>{copy.current}</dt><dd>{copy[scope]}</dd></div>
        {legacyScope && <div><dt>{copy.legacy}</dt><dd>{copy[legacyScope]}</dd></div>}
      </dl>
      {canManage && (active || scope !== "none" || legacyScope) && <>
        <p>{copy.intro}</p>
        <ActionForm action={setCatalogSalesAccess.bind(null, locale, userId, access.revision)}
          label={copy.save} errors={copy.errors} pendingLabel={copy.pending} savedLabel={copy.saved}>
          <label>{copy.scope}<select key={access.revision} name="scope" defaultValue={active ? scope : "none"}>
            {scopes.map(value => <option key={value} value={value} disabled={!active && value !== "none"}>{copy[value]}</option>)}
          </select></label>
          <p className="order-note">{copy.revokeNote}</p>
        </ActionForm>
      </>}
    </> : <p role="alert">{copy.unavailable}</p>}
  </section>;
}
