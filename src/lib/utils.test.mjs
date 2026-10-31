import { test } from "node:test";
import assert from "node:assert/strict";
import { ownAvatarUrl, safeNextPath } from "./utils.ts";

test("safeNextPath keeps same-origin paths", () => {
  assert.equal(safeNextPath("/checkin/14/abc"), "/checkin/14/abc");
});

test("safeNextPath rejects off-site and malformed values", () => {
  for (const bad of ["//evil.com", "/\\evil.com", "/\\\\evil.com", "/\t/evil.com", "/\n/evil.com", "/\r/evil.com", "/\x00x", "https://evil.com", "evil", 42, null, undefined]) {
    assert.equal(safeNextPath(bad), "/", String(bad));
  }
});

test("safeNextPath uses the custom fallback", () => {
  assert.equal(safeNextPath("//evil.com", "/profile"), "/profile");
});

test("ownAvatarUrl accepts only a plain file in the user's own avatar folder", () => {
  const base = "https://x.supabase.co";
  const dir = `${base}/storage/v1/object/public/avatars/u1/`;
  assert.equal(ownAvatarUrl(`${dir}avatar-123.png`, base, "u1"), `${dir}avatar-123.png`);
  for (const bad of [
    `${dir}../../u2/avatar-1.png`,
    `${dir}%2e%2e/u2/avatar-1.png`,
    `${dir}sub/avatar-1.png`,
    `${dir}avatar-1.png?x=1`,
    `${dir}avatar-1.png#x`,
    `${dir}`,
    `${base}/storage/v1/object/public/avatars/u2/avatar-1.png`,
    "https://evil.com/avatar-1.png",
  ]) {
    assert.equal(ownAvatarUrl(bad, base, "u1"), null, bad);
  }
});
