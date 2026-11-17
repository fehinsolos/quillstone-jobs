
# Quillstone Jobs — Project Documentation

**By Olaleye (Solomon) Fehintoluwa**

---

## BUG #01 | Crew Scheduling — Double Booking

**Bug definition:** The existing code checks whether the new installation starts or ends inside an existing booking.

**The bug:** If an existing job is 9 AM–12 PM and a new job is 7 AM–4 PM, neither the new start nor end falls inside the existing booking. So the code incorrectly allows both.

### How do we fix this?

1. Get the new booking's start and end times.

   ↓

2. Retrieve all existing bookings for that crew.

   ↓

3. Compare the new booking against each existing booking.

   ↓

4. Check whether start `“< bookedEnd && end > bookedStart”`.

   ↓

5. If both conditions are true, reject the booking; otherwise, allow it.

**In non-algorithmic terms**, we replace the original start/end checks with a single overlap condition that detects when two bookings share any amount of time. We then test different scheduling scenarios to verify the fix.

**Why it works:** The new condition detects all types of overlap, including when a new booking completely surrounds an existing one.

**How it improves the code:** It makes scheduling more reliable, reduces unnecessary conditions, and prevents booking conflicts that could cause delays and customer dissatisfaction.

---

## BUG #01.2 | Simultaneous Booking Requests

**Bug definition:** It is possible for two employees to book the same crew for overlapping installations at almost exactly the same time.

**The bug:** Suppose Jenna and Marco both attempt to book Crew 1 for 2 PM. Both requests check the database before either booking has been saved. Since the crew appears available to both employees, the system accepts both requests.

This is known as a **race condition**. “happens when a program relies on the uncontrollable timing causing the final outcome to change depending on which process finishes first.” ~ wikipedia :(

### How do we fix this?

1. Receive a new installation booking request.

   ↓

2. Begin an atomic booking operation for the crew.

   ↓

3. Check whether the crew already has an overlapping booking.

   ↓

4. If a conflict exists, reject the request.

   ↓

5. Otherwise, save the booking before allowing another competing request to proceed.

**In non-algorithmic terms**, we check crew availability and save the booking part of one protected operation. This prevents two employees from independently booking the same available time slot.

**Why it works:** The system prevents competing requests from both passing the availability check before either booking is saved. Once the first booking is recorded, the next request detects the conflict and is rejected.

**How it improves the code:** It prevents race conditions, protects scheduling accuracy, and ensures that only one employee can successfully reserve a crew for a conflicting time slot. For the assessment's simulated database, this can be implemented using a protected booking operation. In a real PostgreSQL system, we would need database-level concurrency protection so the rule also works across multiple servers.

---

## BUG #02 | Reminder Scheduling — Incorrect Installation Times

**Bug definition:** The system sends customers reminder texts with incorrect installation times and delivers those reminders an hour later than scheduled.

**The bug:** An installation booked for 9 AM appears as 8 AM in the reminder text. Additionally, reminders scheduled for 9 AM are delivered at 10 AM. This happens because the code assumes Edmonton switches between UTC−6 and UTC−7, while the assessment specifies that Alberta remains on UTC−6 year-round.

### How do we fix this?

1. Identify the function responsible for calculating Edmonton's UTC offset.

   ↓

2. Locate `edmontonOffsetHours()` inside `src/time.ts`.

   ↓

3. Remove the seasonal daylight-saving calculations.

   ↓

4. Change the function to always return `-6`.

   ↓

5. Test winter installations to verify both the displayed installation time and reminder delivery time.

**In non-algorithmic terms**, we update the time-zone conversion function to use UTC−6 throughout the year, following the assessment's requirements. Since both the installation time and reminder scheduling depend on this function, one correction addresses both problems.

**Why it works:** The original code subtracts seven hours from UTC during winter instead of six. By consistently applying UTC−6, the system correctly converts installation times and schedules reminder messages for 9 AM Edmonton time.

**How it improves the code:** It improves scheduling accuracy, prevents customer confusion, and ensures reminders are delivered at the intended time. It also simplifies the code by removing unnecessary seasonal calculations.

---

## BUG #03 | SMS Delivery — Duplicate Reminders

**Bug definition:** Customers sometimes receive the same installation reminder two or three times when multiple reminder processes operate simultaneously.

**The bug:** The original system sends an SMS before recording that the reminder has been delivered.

For example, if two reminder processes run simultaneously while the SMS service is slow, both may check the database and see that the reminder hasn't been sent. They then send the same message independently. This is another **race condition**, similar to Bug #01.2.

### How do we fix this?

1. Retrieve all bookings that haven't received reminders.

   ↓

2. Check whether each reminder is due.

   ↓

3. Attempt to claim the reminder using `claimReminder()`.

   ↓

4. If another process has already claimed it, skip the reminder.

   ↓

5. Otherwise, send the SMS and prevent competing processes from claiming the same reminder.

**In non-algorithmic terms**, we introduce a reminder-claim mechanism that allows only one process to take responsibility for sending a particular message.

Instead of sending the SMS first and then updating the database, the system claims the reminder before sending it.

**Why it works:** The new database function checks whether a reminder has already been claimed and updates its status without pausing between those operations. Since only the first process can successfully claim it, other processes skip the message.

**How it improves the code:** It prevents duplicate SMS messages during simultaneous reminder runs, reduces unnecessary messaging costs, and improves the customer experience by avoiding repeated notifications.

**Do limits exist?** Claiming a reminder before sending it introduces another risk. If the SMS service fails, the message may remain marked as sent even though the customer never received it

---

## BUG #04 | AI Email Intake — Hallucinations and Unauthorized Approvals

**Bug definition:** The AI system extracts customer information from incoming emails but sometimes invents details or changes business information without authorization.

**The bug:** There were two major issues:

1. **AI hallucination:** Sandra Okafor did not provide a phone number in her email, but the AI generated 780-555-0142. The system accepted it without verification.

2. **Unauthorized approval:** Kyle Brandt included an instruction telling the AI to approve his job for $0. The model followed the instruction, and the system accepted the unauthorized status and price changes.

The original code used: `...fields`

This allowed the AI's extracted values to overwrite application-controlled fields such as `status`.

Kyle's example is also a form of **prompt injection**, where untrusted customer text attempts to influence the AI's behaviour beyond its intended task.

### How do we fix this?

1. Receive the AI-generated customer information.

   ↓

2. Extract the suggested phone number and remove formatting characters.

   ↓

3. Compare the normalized phone number against the original customer email.

   ↓

4. Reject the phone number if it cannot be verified.

   ↓

5. Explicitly select permitted customer information instead of copying every AI-generated field.

   ↓

6. Set the lead status to `needs_review` within the application and prevent AI-generated prices from being saved.

**In non-algorithmic terms**, we stop blindly trusting the AI's response. Instead, we verify important information against the customer's original message and restrict which fields the AI is allowed to populate.

**Why it works:** The phone-number check rejects values that cannot be found in the original email. Explicitly selecting allowed fields prevents the model from modifying sensitive business decisions such as approval status and pricing. So, even if the AI outputs `"status": "approved"` or `"price": 0`, those fields aren't accepted into the new lead.

**How it improves the code:** It improves data accuracy, reduces the impact of AI hallucinations, and creates a clear separation between AI-assisted data extraction and human-controlled business decisions.

**Do Limits Exist?** Our phone-number validation handles common 10-digit formatting differences but isn't a complete international phone-number validation system. Other AI-extracted fields, such as email addresses and customer names, could also benefit from additional verification.

---

## BUG #05 | AI Email Intake — Interrupted Email Processing

**Bug definition:** The system sometimes stops processing incoming customer emails when the AI returns an unexpected response format.

**The bug:** The original code assumes every AI response contains valid JSON and immediately calls:

```typescript
JSON.parse(await llm.extract(email))
```

However, the AI sometimes returns explanations, Markdown code blocks, or invalid JSON instead of a plain JSON object. e.g, the Larkhaven Homes AI response contained useful customer information inside a Markdown code block, preceded by explanatory text.

Since the code tried to parse the entire response as JSON, it produced a syntax error because `intakeAll()` did not handle that error, the entire batch stopped processing. Emails appearing later in the batch were never recorded.

### How do we fix this?

1. Receive the AI-generated response.

   ↓

2. Check whether the response contains a Markdown code block.

   ↓

3. If a code block exists, extract the JSON content from it.

   ↓

4. Attempt to parse the extracted response using `JSON.parse()`.

   ↓

5. If parsing succeeds, create the customer lead normally.

   ↓

6. If parsing fails, catch the error and create a fallback lead marked `needs_review`.

   ↓

7. Continue processing the remaining customer emails.

**In non-algorithmic terms**, we make the email-processing system more tolerant of unexpected AI responses. First, we extract JSON from Markdown formatting when possible. Second, we introduce error handling so a failed extraction doesn't terminate the entire email-processing batch.

If the response cannot be recovered, we preserve the customer's email as a lead requiring manual review.

**Why it works:** Markdown extraction allows the system to recover usable structured information from responses that contain additional formatting. The try/catch block ensures that an invalid response affects only the current email rather than stopping every email afterward.

**How it improves the code:** It makes the email intake system more reliable, reduces the risk of missed customer inquiries, and ensures that unsuccessful AI extractions are brought to the office's attention.

**Do limits exist?** The current implementation recognizes JSON enclosed in Markdown code fences but may not recover every possible malformed response. A production version could also use schema validation, structured model outputs, and more detailed error logging.

---

## Testing & Verification

Using **regression testing** to verify each bug fix. First, we wrote tests in VS Code to reproduce the reported problems, then ran `npm.cmd test`.

**Bug #01:** Tested overlapping and simultaneous bookings to verify scheduling conflicts were prevented.

**Bug #02:** Tested winter dates to confirm correct installation and reminder times.

**Bug #03:** Simulated two concurrent SMS processes. The test initially failed because two messages were sent instead of one.

**Bug #04:** Tests initially failed because the AI invented a phone number and approved a $0 job.

**Bug #05:** Invalid AI responses initially crash email processing.

After implementing the fixes, the tests passed. We also ran “`npm.cmd run morning`, confirming all six emails were processed and scheduling and reminders worked correctly.
