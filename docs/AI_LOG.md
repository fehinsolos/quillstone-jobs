# AI_LOG.md — AI Mistakes & Verification

## AI Tool Used
ChatGPT (OpenAI)

I used ChatGPT to understand the existing TypeScript code, investigate bugs, suggest fixes, and develop regression tests. I tested the proposed solutions myself in VS Code rather than assuming the AI was correct.

## Mistake 1 — Incomplete Booking Fix

**What AI missed:** The initial approach focused on fixing the time-overlap comparison. However, correcting that condition alone would not prevent two employees from booking the same crew simultaneously.

**How I caught it:** I examined the separate availability-check and insertion operations and tested concurrent requests using `Promise.all()`.

**What I changed:** I introduced `reserveCrewIfAvailable()` to check and insert a booking without an asynchronous pause between those operations.

## Mistake 2 — Incomplete AI Response Handling

**What AI missed:** Handling invalid JSON by creating a fallback lead prevented the email batch from crashing, but this approach could discard useful customer information when the AI returned valid JSON inside Markdown code fences.

**How I caught it:** I tested a response containing explanatory text and a fenced JSON object. This exposed the parsing limitation.

**What I changed:** I added JSON extraction from Markdown code blocks and a regression test to verify that the customer details were preserved.

## Mistake 3 — Unverified Test Claims

**What AI got wrong:** During debugging, ChatGPT described test outcomes before independently verifying the actual terminal results.

**How I caught it:** I compared its explanations with the output from `npm.cmd test` in my VS Code terminal.

**What I learned:** An AI explanation is not proof that code works. I relied on actual test output and the application simulation to evaluate the fixes.

## Final Verification

I ran `npm.cmd test` throughout development to identify failures and check the fixes.

I also ran `npm.cmd run morning`, which confirmed:
- All six customer emails became leads.
- A conflicting crew booking was rejected.
- Two due SMS reminders were sent with the expected times.

