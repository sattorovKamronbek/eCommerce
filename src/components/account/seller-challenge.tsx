"use client";

import { useActionState } from "react";
import type { SellerChallengeState } from "@/lib/sellers/application";
import type { sellerDictionaries } from "@/messages/seller";

export function SellerChallenge({ action, copy }: { action: (state: SellerChallengeState, form: FormData) => Promise<SellerChallengeState>; copy: typeof sellerDictionaries.en }) {
  const [state, submit, pending] = useActionState(action, {});
  return <section className="seller-challenge"><h2>{copy.challengeTitle}</h2><p>{copy.challengeIntro}</p>
    {state.error ? <p role="alert">{copy.challengeError}</p> : null}
    {state.code ? <p role="status">{copy.challengeCode}: <code>{state.code}</code></p> : null}
    <form action={submit}><button className="mfa-button" disabled={pending}>{copy.challengeButton}</button></form>
  </section>;
}
