import { test } from "node:test";
import assert from "node:assert/strict";
import { safeNextPath } from "./utils.ts";

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
