import assert from "node:assert/strict";
import test from "node:test";
import { dateRange, nightsBetween } from "@/lib/dates";

test("counts each occupied night and excludes checkout day", () => {
  assert.equal(nightsBetween("2026-11-20", "2026-11-23"), 3);
  assert.deepEqual(dateRange("2026-11-20", "2026-11-23"), [
    "2026-11-20",
    "2026-11-21",
    "2026-11-22",
  ]);
});

test("rejects reversed, malformed, zero-night, and overlong stays", () => {
  assert.throws(() => nightsBetween("2026-11-23", "2026-11-20"));
  assert.throws(() => nightsBetween("not-a-date", "2026-11-20"));
  assert.throws(() => nightsBetween("2026-11-20", "2026-11-20"));
  assert.throws(() => nightsBetween("2026-11-01", "2026-12-03"));
});
