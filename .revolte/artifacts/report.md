# Test Run Report: Clear Answer Calculator — 2026-11-11

## Summary
- Scope: whole application
- New tests: 10 passed, 0 failed, 0 skipped
- Fix cycles used: 2 affected-test validation cycles
- Layers run: ui
- Verdict: All 10 calculator tests passed in the final suite.

## Results

| Test | Layer | Status | Reason | Bucket | Gap flag |
|---|---|---|---|---|---|
| Initial calculator state and accessible controls | ui | passed | Initial UI and accessible controls verified | none | none |
| Four arithmetic operations and history | ui | passed | Addition, subtraction, multiplication, division and history verified | none | none |
| Decimal input and percentages | ui | passed | Decimal de-duplication and percentage conversion verified | none | none |
| Backspace and clear-all | ui | passed | Editing and reset verified | none | none |
| Repeated equals | ui | passed | Repeated operation verified | none | none |
| Division by zero | ui | passed | Exact error and invalid-history behavior verified | none | none |
| Keyboard input and editing controls | ui | passed | Keyboard arithmetic, Enter, Backspace, Escape and percent verified | none | none |
| History restore, clear and refresh | ui | passed | Session history behavior verified | none | none |
| Keyboard focus reachability | ui | passed | Tab focus and Enter operation verified | none | none |
| Phone viewport usability | ui | passed | Mobile visibility and overflow check verified | none | none |

## Entire suite

- Scope run: `tests/playwright.config.ts`, all tests under `tests/`, one part
- Totals: 10 passed, 0 failed, 0 skipped
- Verdict: All good

## Defect Reports

None. No application defect was confirmed.

## Automation Drift fixes

- `tests/calculator/ui/calculator.spec.ts:66-71`: replaced an unescaped dynamic regular expression with a semantic role locator using the rendered history text/value. Passed in affected-test cycle 1.
- `tests/calculator/ui/calculator.spec.ts:77`: corrected the mathematically invalid expected value `13` to `1.75` for `1.25 + 0.5`. Passed in affected-test cycle 1.
- `tests/calculator/ui/calculator.spec.ts:109-116`: added a web-first heading readiness assertion and explicit key presses to avoid hydration/input races. Passed in affected-test cycle 2.

## Gaps

- Requirement gaps: the 14-character display cap and eight-entry history cap are implementation details not documented as acceptance criteria; they were not asserted.
- Code gaps: the display paragraphs lack dedicated test IDs or specific semantic roles (`src/app/page.tsx:223-225`); tests scope text to the existing `aria-live` container.
- No API, server handler, authentication, permission, or network-dependent surface exists in this application.

## Files written

- `tests/calculator/ui/calculator.spec.ts`
- `tests/playwright.config.ts`
- `.revolte/artifacts/report.md`
- `.revolte/artifacts/videos/` with 10 final-run videos
- Sandbox Playwright runtime links under `tests/node_modules/`

## Evidence

10 videos from the final passing suite are in `.revolte/artifacts/videos/`:

- `calculator-renders-the-initial-calculator-state-and-accessible-controls.webm`
- `calculator-performs-all-four-arithmetic-operations-and-records-history.webm`
- `calculator-handles-decimal-input-repeated-decimals-and-percentages.webm`
- `calculator-supports-backspace-and-clear-all.webm`
- `calculator-repeats-the-last-operation-when-equals-is-pressed-again.webm`
- `calculator-shows-an-error-and-no-invalid-history-for-division-by-zero.webm`
- `calculator-supports-keyboard-input-for-calculation-and-editing-controls.webm`
- `calculator-restores-history-results-clears-history-and-does-not-retain-it-after-refresh.webm`
- `calculator-moves-focus-to-the-first-keypad-control-and-keeps-controls-keyboard-reachable.webm`
- `calculator-keeps-calculator-and-history-usable-on-a-phone-viewport.webm`

## Not verified / remaining risks

- Formal axe/WCAG analysis was not run because `@axe-core/playwright` is not a project dependency and no dependency was added.
- Visual screenshot regression was not run because no baseline was requested or approved.
- The live preview command was attempted but its process exited before listening; Playwright used the Next.js development server at `http://localhost:3000`.
- `npm ci` reported 12 moderate npm audit vulnerabilities; remediation was outside QA scope.

## Other observations (not tested)

- Unused database scaffolding exists, but the README states the calculator is intentionally client-side and session-only; no database tests were added.
