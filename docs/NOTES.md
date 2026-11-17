# Quillstone Jobs — Fix Notes

I investigated five reported issues in the booking, reminder, and AI email intake systems. For each issue, I identified the cause, added regression tests, and made targeted changes to the existing TypeScript code.

## 01 | Crew Scheduling — Double Booking

**Cause:** The original overlap check missed bookings that completely surrounded an existing installation. Separately, concurrent requests could both check availability before either saved a booking.

**Fix:** I used `start < bookedEnd && end > bookedStart` to detect overlapping intervals. I moved the availability check and insertion into `reserveCrewIfAvailable()` so they execute without an asynchronous pause between them.

**Testing:** I tested surrounding overlaps, simultaneous requests using `Promise.all()`, and valid back-to-back bookings.

## 02 | Reminder Scheduling — Incorrect Times

**Cause:** The code applied a winter UTC−7 offset, conflicting with the assessment's UTC−6 year-round requirement.

**Fix:** I updated `edmontonOffsetHours()` to consistently return `-6`.

**Testing:** I added a December test confirming that a 9 AM installation appears correctly in the SMS and that its reminder is scheduled for 9 AM the previous day.

## 03 | SMS Delivery — Duplicate Reminders

**Cause:** The application sent an SMS before recording it as sent, allowing simultaneous reminder runs to send duplicates.

**Fix:** I added `claimReminder()` to claim a reminder before sending it.

**Testing:** I simulated two concurrent reminder runs with a delayed SMS service and verified that only one message was sent.

## 04 | AI Intake — Incorrect Data and Unauthorized Approval

**Cause:** The application trusted AI-generated fields, allowing invented phone numbers and unauthorized approval or pricing values.

**Fix:** I checked extracted phone numbers against the original email, explicitly selected permitted fields, and kept approval status controlled by the application.

**Testing:** I verified that Sandra's invented phone number was rejected and Kyle's job remained `needs_review` without an AI-assigned price.

## 05 | AI Intake — Interrupted Processing

**Cause:** Invalid or Markdown-wrapped AI responses caused JSON parsing errors that could interrupt the entire email batch.

**Fix:** I added Markdown JSON extraction and per-email error handling. Failed extractions now create leads requiring manual review without stopping subsequent emails.

**Testing:** I tested invalid JSON between valid emails and a Markdown-wrapped JSON response.

## Verification and Remaining Limitations

I used `npm.cmd test` to run the regression suite and `npm.cmd run morning` to test the complete workflow. The morning simulation processed all six emails, rejected the conflicting crew booking, and sent two due reminders with correct installation times.

The current concurrency protections apply to the simulated in-memory database. A production system would need database-level safeguards. SMS sending also needs retry handling because a failure after claiming a reminder could leave it unsent. Further AI output validation would strengthen the intake system.
### Additional Documentation

For a detailed explanation of my debugging process,
code changes, reasoning, and testing, please refer to
the [Project Documentation](./docs/Altamatic%20Project%20Documentation.pdf).