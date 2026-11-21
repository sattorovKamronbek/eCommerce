"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
export type ActionFormState = { error?: "invalid" | "changed" | "failed"; saved?: boolean };

export function ActionForm({ action, label, errors, pendingLabel, savedLabel, children }: {
  action: (state: ActionFormState, form: FormData) => Promise<ActionFormState>;
  label: string;
  errors: Record<NonNullable<ActionFormState["error"]>, string>;
  pendingLabel: string;
  savedLabel?: string;
  children?: React.ReactNode;
}) {
  const [state, submit, pending] = useActionState(action, {});
  const feedback = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.error) feedback.current?.focus();
  }, [state]);
  return <form action={submit} className="account-form workspace-action-form" aria-busy={pending}>
    <fieldset disabled={pending}>
      {children}
      {state.error ? <p ref={feedback} tabIndex={-1} role="alert">{errors[state.error]}</p> : null}
      {state.saved && savedLabel ? <p role="status">{savedLabel}</p> : null}
      <Button type="submit">{pending ? pendingLabel : label}</Button>
    </fieldset>
  </form>;
}
