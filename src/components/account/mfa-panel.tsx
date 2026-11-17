"use client";

import Image from "next/image";
import { useActionState } from "react";
import type { MfaActionState } from "@/lib/auth/mfa";
import type { mfaDictionaries } from "@/messages/mfa";

type Action = (state: MfaActionState, form: FormData) => Promise<MfaActionState>;
export function MfaPanel({ copy, currentLevel, verifiedFactors, unverifiedFactors, next, begin, verify, remove }: {
  copy: typeof mfaDictionaries.en; currentLevel: string | null; verifiedFactors: { id: string }[];
  unverifiedFactors: { id: string }[]; next: string; begin: Action; verify: Action; remove: Action;
}) {
  const [setup, startAction, starting] = useActionState(begin, {});
  const [verification, verifyAction, verifying] = useActionState(verify, {});
  const [removal, removeAction, removing] = useActionState(remove, {});
  const error = setup.error || verification.error || removal.error;
  const allowSetup = currentLevel === "aal2" || verifiedFactors.length === 0;
  return <div className="mfa-panel">
    <p>{currentLevel === "aal2" ? copy.active : verifiedFactors.length ? copy.needsCode : copy.noFactor}</p>
    {error ? <p role="alert">{copy[error]}</p> : null}
    {verifiedFactors.length > 0 && currentLevel !== "aal2" ? <form action={verifyAction} className="seller-form">
      <label>{copy.factor}<select name="factorId">{verifiedFactors.map((factor, index) => <option key={factor.id} value={factor.id}>{copy.factor} {index + 1}</option>)}</select></label>
      <label>{copy.code}<input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required /></label>
      <input type="hidden" name="next" value={next} /><button disabled={verifying}>{verifying ? copy.pending : copy.verify}</button>
    </form> : null}
    {setup.setup ? <div className="mfa-setup">
      <p>{copy.scan}</p><Image unoptimized src={setup.setup.qr} alt={copy.qr} width={192} height={192} />
      <p>{copy.secret}: <code>{setup.setup.secret}</code></p><p>{copy.secretNote}</p>
      <form action={verifyAction} className="seller-form">
        <input type="hidden" name="factorId" value={setup.setup.factorId} /><input type="hidden" name="next" value={next} />
        <label>{copy.code}<input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required /></label>
        <button disabled={verifying}>{verifying ? copy.pending : copy.verify}</button>
      </form>
    </div> : allowSetup ? <form action={startAction}><button className="mfa-button" disabled={starting}>{starting ? copy.pending : copy.start}</button></form> : null}
    {allowSetup ? unverifiedFactors.map((factor, index) => <form key={factor.id} action={removeAction}>
      <input type="hidden" name="factorId" value={factor.id} /><button className="mfa-button" disabled={removing}>{copy.remove} {index + 1}</button>
    </form>) : null}
  </div>;
}
