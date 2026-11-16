"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { AccountMessages } from "@/messages/account";
import { localeNames, type MarketplaceLocale } from "@/messages/marketplace";
import { initialAccountState, type AccountAction, type AccountField } from "@/lib/auth/state";

export type AccountFormKind = "login" | "register" | "forgot" | "resend" | "reset" | "profile" | "confirm" | "logout";

export function AccountForm({ action, kind, copy, next, profile, recoveryLogout }: {
  action: AccountAction; kind: AccountFormKind; copy: AccountMessages; next?: string;
  profile?: { display_name: string; preferred_locale: MarketplaceLocale };
  recoveryLogout?: AccountAction;
}) {
  // Keep values in browser memory so a rejected action cannot look like a refresh.
  // Passwords are never returned in action state or persisted in browser storage.
  const [values, setValues] = useState<Record<AccountField, string>>({
    displayName: profile?.display_name ?? "", email: "", password: "", repeatPassword: "",
    preferredLocale: profile?.preferred_locale ?? "uz",
  });
  const [visible, setVisible] = useState<Partial<Record<AccountField, boolean>>>({});
  const [state, submit, pending] = useActionState(async (previous: typeof initialAccountState, form: FormData) => {
    const result = await action(previous, form);
    if (result.status === "success") setValues(current => ({ ...current, password: "", repeatPassword: "" }));
    return result;
  }, initialAccountState);
  const feedback = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state.message) feedback.current?.focus(); }, [state]);
  const id = useId();
  const fields: AccountField[] = kind === "register" ? ["displayName", "email", "password", "repeatPassword"]
    : kind === "login" ? ["email", "password"] : kind === "forgot" || kind === "resend" ? ["email"]
      : kind === "reset" ? ["password", "repeatPassword"] : kind === "profile" ? ["displayName", "preferredLocale"] : [];
  const submitLabel = { login: copy.login, register: copy.register, forgot: copy.sendReset, resend: copy.resend, reset: copy.reset, profile: copy.save, confirm: copy.confirm, logout: copy.logout }[kind];
  // Email requests acknowledge an attempt, not delivery. Keep retry available.
  const completed = state.status === "success" && kind === "reset";
  return <><form action={submit} className="account-form" aria-busy={pending}>
    {next ? <input type="hidden" name="next" value={next} /> : null}
    <FieldGroup>
      {state.message ? <Alert ref={feedback} tabIndex={-1} id={`${id}-feedback`} role={state.status === "error" ? "alert" : "status"}>
        <AlertDescription>{copy.feedback[state.message]}</AlertDescription>
      </Alert> : null}
      {fields.map(field => {
        const invalid = !!state.fields?.[field];
        const fieldId = `${id}-${field}`;
        const hint = field === "displayName" ? copy.nameHint : field === "password" && kind !== "login" ? copy.passwordHint : undefined;
        const isPassword = field === "password" || field === "repeatPassword";
        const input = <Input
          id={fieldId} name={field} required disabled={pending || completed} aria-invalid={invalid}
          aria-describedby={invalid && state.message ? `${id}-feedback` : hint ? `${fieldId}-hint` : undefined}
          type={field === "email" ? "email" : isPassword && !visible[field] ? "password" : "text"}
          autoComplete={field === "displayName" ? "nickname" : field === "email" ? "email" : kind === "login" ? "current-password" : "new-password"}
          value={values[field]} onChange={event => setValues(current => ({ ...current, [field]: event.target.value }))}
          minLength={field === "displayName" ? 2 : field === "password" && kind !== "login" ? 12 : undefined}
          maxLength={field === "displayName" ? 80 : field === "email" ? 254 : 128}
        />;
        return <Field key={field} data-invalid={invalid || undefined} data-disabled={pending || completed || undefined}>
          <FieldLabel htmlFor={fieldId}>{copy[field]}</FieldLabel>
          {field === "preferredLocale" ? <NativeSelect id={fieldId} name={field} value={values[field]} onChange={event => setValues(current => ({ ...current, [field]: event.target.value }))} disabled={pending} aria-invalid={invalid}>
            {(["uz", "ru", "en"] as const).map(locale => <NativeSelectOption key={locale} value={locale}>{localeNames[locale]}</NativeSelectOption>)}
          </NativeSelect> : isPassword ? <div className="account-password">
            {input}
            <button className="account-password-toggle" type="button" disabled={pending || completed}
              aria-label={`${visible[field] ? copy.hidePassword : copy.showPassword}: ${copy[field]}`}
              aria-controls={fieldId} aria-pressed={!!visible[field]}
              onClick={() => setVisible(current => ({ ...current, [field]: !current[field] }))}>
              {visible[field] ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </button>
          </div> : input}
          {hint ? <FieldDescription id={`${fieldId}-hint`}>{hint}</FieldDescription> : null}
        </Field>;
      })}
      <Button type="submit" variant={kind === "logout" ? "outline" : "default"} disabled={pending || completed}>
        {pending ? <><LoaderCircle className="account-spinner" aria-hidden="true" />{copy.pending}</> : submitLabel}
      </Button>
    </FieldGroup>
  </form>
    {state.message === "passwordUpdatedSignoutFailed" && recoveryLogout ? <AccountForm action={recoveryLogout} kind="logout" copy={copy} /> : null}
  </>;
}
