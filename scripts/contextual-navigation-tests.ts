import assert from "node:assert/strict"

import { withDateQuery } from "../app/lib/contextual-navigation.ts"

const period = "?month=março&year=2025"

assert.equal(
  withDateQuery("/workspace/dashboard/debits", period),
  "/workspace/dashboard/debits?month=mar%C3%A7o&year=2025"
)
assert.equal(
  withDateQuery("/workspace/manage/cards?tab=limits", period),
  "/workspace/manage/cards?tab=limits&month=mar%C3%A7o&year=2025"
)
assert.equal(
  withDateQuery("/dashboard?month=abril&year=2024", period),
  "/dashboard?month=mar%C3%A7o&year=2025"
)
assert.equal(withDateQuery("/sign-in", period), "/sign-in")
assert.equal(withDateQuery("/#faq", period), "/#faq")

console.log("Contextual navigation tests passed.")

