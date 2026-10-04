// The app half of the /admin gate (AGE-2974). Lives with the publish-core
// tests because /admin is the publish core's second caller; the database
// half is tested in supabase/community/tests/rls.test.sql.
import { test } from "node:test";
import assert from "node:assert/strict";
import { adminEmails, isAllowedAdmin } from "../../../lib/admin/allowlist";

const confirmed = "2026-10-03T00:00:00Z";

test("ADMIN_EMAILS parses to a lowercased, trimmed list; unset means nobody", () => {
  assert.deepEqual(adminEmails({ ADMIN_EMAILS: " Abdur@Example.com , ,second@example.com" }), [
    "abdur@example.com",
    "second@example.com",
  ]);
  assert.deepEqual(adminEmails({}), []);
  assert.deepEqual(adminEmails({ ADMIN_EMAILS: "  " }), []);
});

test("only a confirmed, allowlisted email passes", () => {
  const allow = ["abdur@example.com"];
  assert.equal(isAllowedAdmin({ email: "ABDUR@example.com", email_confirmed_at: confirmed }, allow), true);
  assert.equal(isAllowedAdmin({ email: "abdur@example.com", email_confirmed_at: null }, allow), false, "unconfirmed");
  assert.equal(isAllowedAdmin({ email: "abdur@example.com" }, allow), false, "no confirmation field");
  assert.equal(isAllowedAdmin({ email: "reader@example.com", email_confirmed_at: confirmed }, allow), false, "not listed");
  assert.equal(isAllowedAdmin({ email: "abdur@example.com.evil.test", email_confirmed_at: confirmed }, allow), false, "suffix");
  assert.equal(isAllowedAdmin({ email: "", email_confirmed_at: confirmed }, ["" as string]), false, "empty email");
  assert.equal(isAllowedAdmin(null, allow), false, "signed out");
  assert.equal(isAllowedAdmin({ email: "abdur@example.com", email_confirmed_at: confirmed }, []), false, "empty allowlist");
});
