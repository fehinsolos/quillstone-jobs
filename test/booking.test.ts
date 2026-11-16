import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bookInstall } from '../src/booking.ts';
import { createDb } from '../src/db.ts';

const job = { id: 'job-1', customerName: 'Test Customer', phone: '780-555-0150', address: 'Edmonton', description: 'Kitchen, quartz' };
// Crew 1 already has a morning install.
const morning = { id: 'bk-1', jobId: 'job-1', crewId: 'crew-1', start: '2026-12-03T15:00:00.000Z', end: '2026-12-03T18:00:00.000Z' };

test('books a crew that is free', async () => {
  const db = createDb({ jobs: [job] });
  const result = await bookInstall(db, { jobId: 'job-1', crewId: 'crew-1', start: '2026-12-03T15:00:00Z', end: '2026-12-03T18:00:00Z' });
  assert.equal(result.ok, true);
  assert.equal((await db.listBookings()).length, 1);
});

test('turns down a booking that starts while the crew is busy', async () => {
  const db = createDb({ jobs: [job], bookings: [morning] });
  const result = await bookInstall(db, { jobId: 'job-1', crewId: 'crew-1', start: '2026-12-03T16:00:00Z', end: '2026-12-03T20:00:00Z' });
  assert.equal(result.ok, false);
});

test('turns down a booking that ends while the crew is busy', async () => {
  const db = createDb({ jobs: [job], bookings: [morning] });
  const result = await bookInstall(db, { jobId: 'job-1', crewId: 'crew-1', start: '2026-12-03T13:00:00Z', end: '2026-12-03T16:00:00Z' });
  assert.equal(result.ok, false);
});

test('another crew can take the same time', async () => {
  const db = createDb({ jobs: [job], bookings: [morning] });
  const result = await bookInstall(db, { jobId: 'job-1', crewId: 'crew-2', start: '2026-12-03T15:00:00Z', end: '2026-12-03T18:00:00Z' });
  assert.equal(result.ok, true);
});
