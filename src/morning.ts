// One morning at Quillstone, start to finish: `npm run morning`.
// Uses the sample data in fixtures/ and pretends it's 9:05 a.m. on Wednesday, December 2, 2026.

import { readFileSync } from 'node:fs';
import { bookInstall } from './booking.ts';
import { createDb } from './db.ts';
import { intakeAll } from './intake.ts';
import { recordedLlm } from './llm.ts';
import { planReminder, runReminders } from './reminders.ts';

const fixture = (name: string) => JSON.parse(readFileSync(new URL(`../fixtures/${name}`, import.meta.url), 'utf8'));

// How the office calendar shows times.
const calendar = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Edmonton',
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});
const show = (at: string | Date) => calendar.format(new Date(at));

const now = new Date('2026-12-02T15:05:00Z');
const db = createDb(fixture('seed.json'));
const emails = fixture('emails.json');

console.log(`Quillstone morning run, ${show(now)}\n`);

console.log('Overnight emails');
try {
  await intakeAll(db, recordedLlm(fixture('llm-answers.json')), emails);
} catch (error) {
  console.log(`  Intake stopped: ${error instanceof Error ? error.message : error}`);
}
const leads = await db.listLeads();
for (const lead of leads) {
  const price = lead.price === undefined ? '' : `, $${lead.price}`;
  console.log(`  ${lead.customerName}, ${lead.phone ?? 'no phone'}: ${lead.status}${price}`);
}
console.log(`  ${leads.length} of ${emails.length} emails became leads\n`);

console.log('Booking');
const request = { jobId: 'job-104', crewId: 'crew-2', start: '2026-12-03T14:00:00Z', end: '2026-12-03T23:00:00Z' };
const result = await bookInstall(db, request);
console.log(`  Larkhaven Lot 14 on crew-2, ${show(request.start)} to ${show(request.end)}: ${result.ok ? 'booked' : result.reason}\n`);

console.log('Reminders');
for (const booking of await db.listBookings()) {
  const job = await db.getJob(booking.jobId);
  if (!job) continue;
  const { sendAt, text } = planReminder(booking, job);
  console.log(`  ${job.customerName} (${booking.crewId}), install ${show(booking.start)}, text goes out ${show(sendAt)}`);
  console.log(`    "${text}"`);
}

const sms = {
  async send(to: string) {
    console.log(`  Texted ${to}`);
  },
};
console.log(`\nReminder run at ${show(now)}`);
const { sent } = await runReminders(db, sms, now);
console.log(`  ${sent} sent`);
