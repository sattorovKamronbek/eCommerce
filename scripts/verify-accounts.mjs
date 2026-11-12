import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const env = process.env;
assert.equal(env.RUN_SUPABASE_LIVE_TESTS, "1", "Opt in with RUN_SUPABASE_LIVE_TESTS=1 for the dedicated test project.");
assert.equal(new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname, "xevzbtivteugbqbmmtyz.supabase.co", "Unexpected project; live checks refused.");
for (const name of ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "AUTH_TEST_A_EMAIL", "AUTH_TEST_A_PASSWORD", "AUTH_TEST_B_EMAIL", "AUTH_TEST_B_PASSWORD"]) {
  assert.ok(env[name], `Missing ${name}; use two confirmed, non-admin test accounts, never production customer credentials.`);
}
const client = () => createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const anonymous = client(); const a = client(); const b = client();
let originalProfile;
let userA;
try {
  for (const table of ["marketplace_profiles", "marketplace_user_roles"]) {
    const result = await anonymous.from(table).select("*").limit(1);
    assert.equal(result.error?.code, "42501", "Anonymous private-table read must be denied.");
  }
  const first = await a.auth.signInWithPassword({ email: env.AUTH_TEST_A_EMAIL, password: env.AUTH_TEST_A_PASSWORD });
  const second = await b.auth.signInWithPassword({ email: env.AUTH_TEST_B_EMAIL, password: env.AUTH_TEST_B_PASSWORD });
  assert.ok(!first.error && first.data.user?.email_confirmed_at, "Test account A login/confirmation failed.");
  assert.ok(!second.error && second.data.user?.email_confirmed_at, "Test account B login/confirmation failed.");
  userA = first.data.user;
  assert.notEqual(userA.id, second.data.user.id, "Use distinct test accounts.");
  for (const [connection, user] of [[a, userA], [b, second.data.user]]) {
    const roles = await connection.from("marketplace_user_roles").select("role");
    assert.equal(roles.error, null); assert.deepEqual(roles.data, [], "Use non-admin test accounts.");
    const rows = await connection.from("marketplace_profiles").select("id");
    assert.equal(rows.error, null); assert.deepEqual(rows.data, [{ id: user.id }], "Profile isolation failed.");
  }
  const cross = await b.from("marketplace_profiles").select("id").eq("id", userA.id);
  assert.equal(cross.error, null); assert.deepEqual(cross.data, [], "Cross-account profile read leaked data.");
  const escalation = await a.from("marketplace_user_roles").insert({ user_id: userA.id, role: "admin" });
  assert.equal(escalation.error?.code, "42501", "Role escalation was not denied.");
  const protectedEdit = await a.from("marketplace_profiles").update({ created_at: new Date().toISOString() }).eq("id", userA.id);
  assert.equal(protectedEdit.error?.code, "42501", "Protected profile columns must be immutable to the customer.");
  const profile = await a.from("marketplace_profiles").select("display_name, preferred_locale").eq("id", userA.id).single();
  assert.equal(profile.error, null); originalProfile = profile.data;
  const update = await a.from("marketplace_profiles").update({ display_name: "Integration Test", preferred_locale: "en" }).eq("id", userA.id).select("display_name").single();
  assert.equal(update.error, null); assert.equal(update.data.display_name, "Integration Test");
  const refresh = await a.auth.refreshSession();
  assert.ok(!refresh.error && refresh.data.user?.id === userA.id, "Session refresh failed.");
  console.log("PASS: live logins, confirmed identities, session refresh, anonymous denial, A/B profile isolation, protected-column denial, role-escalation denial and permitted profile update.");
  console.log("Email signup/confirmation/recovery delivery and administrator UI/revocation still require their separate end-to-end checks.");
} finally {
  if (originalProfile && userA) {
    const restored = await a.from("marketplace_profiles").update(originalProfile).eq("id", userA.id);
    assert.equal(restored.error, null, "Test profile restoration failed; inspect dedicated test account A.");
  }
  await Promise.all([a.auth.signOut({ scope: "local" }), b.auth.signOut({ scope: "local" })]);
}
