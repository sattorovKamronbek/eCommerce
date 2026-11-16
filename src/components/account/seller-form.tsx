"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { SellerFormState } from "@/lib/sellers/application";
import type { SellerApplication } from "@/lib/supabase/database";
import type { sellerDictionaries } from "@/messages/seller";

export function SellerForm({ action, copy, application }: {
  action: (state: SellerFormState, form: FormData) => Promise<SellerFormState>;
  copy: typeof sellerDictionaries.en;
  application?: SellerApplication;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [values, setValues] = useState({ type: application?.applicant_type ?? "individual", name: application?.name ?? "", contact: application?.contact ?? "", region: application?.region ?? "", scope: application?.requested_scope ?? "cs2", registration: application?.registration_details ?? "" });
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (state.error) errorRef.current?.focus(); }, [state]);
  const change = (key: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setValues((current) => ({ ...current, [key]: event.target.value }));
  return <form className="seller-form" action={formAction} onReset={(event) => event.preventDefault()}>
    {state.error ? <p role="alert" tabIndex={-1} ref={errorRef}>{state.error === "invalid" ? copy.invalid : copy.unavailable}</p> : null}
    <label>{copy.type}<select name="type" value={values.type} onChange={change("type")}><option value="individual">{copy.individual}</option><option value="company">{copy.company}</option></select></label>
    <label>{copy.name}<input name="name" maxLength={120} required value={values.name} onChange={change("name")} /></label>
    <label>{copy.contact}<input name="contact" maxLength={200} required value={values.contact} onChange={change("contact")} /></label>
    <label>{copy.region}<input name="region" maxLength={120} required value={values.region} onChange={change("region")} /></label>
    <label>{copy.scope}<select name="scope" value={values.scope} onChange={change("scope")}><option value="cs2">{copy.cs2}</option><option value="fashion">{copy.fashion}</option><option value="both">{copy.both}</option></select></label>
    <label>{copy.registration}<input name="registration" maxLength={200} required={values.type === "company"} value={values.registration} onChange={change("registration")} aria-describedby="registration-hint" /><span id="registration-hint">{copy.registrationHint}</span></label>
    <button type="submit" disabled={pending}>{application ? copy.resubmit : copy.submit}</button>
  </form>;
}
