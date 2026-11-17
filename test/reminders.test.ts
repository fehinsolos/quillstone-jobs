import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDb } from '../src/db.ts';
import { planReminder, runReminders } from '../src/reminders.ts';

const job = { id: 'job-1', customerName: 'Test Customer', phone: '780-555-0150', address: 'Edmonton', description: 'Kitchen, quartz' };
const booking = { id: 'bk-1', jobId: 'job-1', crewId: 'crew-1', start: '2026-07-16T16:30:00.000Z', end: '2026-07-16T19:30:00.000Z' };

test('the reminder goes out at 9 the morning before and gives the install time', () => {
  const { sendAt, text } = planReminder(booking, job);
  assert.equal(sendAt.toISOString(), '2026-07-15T15:00:00.000Z');
  assert.match(text, /^Hi Test,/);
  assert.match(text, /tomorrow, Thursday, July 16, at 10:30 AM/);
});

test('each reminder goes out once', async () => {
  const db = createDb({ jobs: [job], bookings: [booking] });
  const texted: string[] = [];
  const sms = {
    async send(to: string) {
      texted.push(to);
    },
  };
  await runReminders(db, sms, new Date('2026-07-15T15:01:00Z'));
  await runReminders(db, sms, new Date('2026-07-15T15:06:00Z'));
  assert.deepEqual(texted, ['780-555-0150']);
});

test('nothing goes out before 9', async () => {
  const db = createDb({ jobs: [job], bookings: [booking] });
  const texted: string[] = [];
  const sms = {
    async send(to: string) {
      texted.push(to);
    },
  };
  await runReminders(db, sms, new Date('2026-07-15T14:55:00Z'));
  assert.deepEqual(texted, []);
});


test('winter reminders use Edmonton UTC-6 time', () => {
  const winterBooking = {
    ...booking,
    start: '2026-12-03T15:00:00.000Z',
    end: '2026-12-03T18:00:00.000Z',
  };

  const { sendAt, text } = planReminder(winterBooking, job);

  // The installation is at 9 AM Edmonton time.
  assert.match(text, /Thursday, December 3, at 9:00 AM/);

  // The reminder should be sent at 9 AM the previous day.
  assert.equal(sendAt.toISOString(), '2026-12-02T15:00:00.000Z');
});

test('prevents duplicate texts when two reminder runs overlap', async () => {
  const db = createDb({
    jobs: [job],
    bookings: [booking],
  });

  const texted: string[] = [];

  const sms = {
    async send(to: string) {
      // Simulate a slow texting service.
      await new Promise((resolve) => setTimeout(resolve, 50));
      texted.push(to);
    },
  };

  const now = new Date('2026-07-15T15:01:00Z');

  // Two reminder processes run at the same time.
  await Promise.all([
    runReminders(db, sms, now),
    runReminders(db, sms, now),
  ]);

  // The customer should only receive one text.
  assert.deepEqual(texted, ['780-555-0150']);
});

