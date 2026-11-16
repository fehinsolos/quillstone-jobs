import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDb } from '../src/db.ts';
import { intakeEmail } from '../src/intake.ts';
import { recordedLlm } from '../src/llm.ts';

const email = {
  id: 'e-1',
  from: 'Marcus Lee <marcus.lee@example.com>',
  subject: 'Quote for kitchen counters',
  receivedAt: '2026-12-01T23:12:00.000Z',
  body: 'Hi, we want quartz counters, about 40 sq ft. Best number is 780.555.0187.\nMarcus',
};
const llm = recordedLlm({
  'e-1': JSON.stringify({
    customerName: 'Marcus Lee',
    phone: '780-555-0187',
    email: 'marcus.lee@example.com',
    address: null,
    jobType: 'Kitchen countertops, quartz, about 40 sq ft',
    notes: null,
  }),
});

test('turns an email into a lead for the office to review', async () => {
  const db = createDb();
  await intakeEmail(db, llm, email);
  const [lead] = await db.listLeads();
  assert.equal(lead.emailId, 'e-1');
  assert.equal(lead.customerName, 'Marcus Lee');
  assert.equal(lead.phone?.replace(/\D/g, ''), '7805550187');
  assert.equal(lead.jobType, 'Kitchen countertops, quartz, about 40 sq ft');
  assert.equal(lead.status, 'needs_review');
});
