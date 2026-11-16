import type { Db } from './db.ts';
import type { Llm } from './llm.ts';
import type { InboundEmail, Lead } from './types.ts';

/** Reads one customer email with the model and saves it as a lead for the office to review. */
export async function intakeEmail(db: Db, llm: Llm, email: InboundEmail): Promise<Lead> {
  const fields = JSON.parse(await llm.extract(email));
  const lead: Lead = {
    id: `lead-${email.id}`,
    emailId: email.id,
    receivedAt: email.receivedAt,
    status: 'needs_review',
    ...fields,
  };
  await db.insertLead(lead);
  return lead;
}

/** The morning run over everything that came in overnight. */
export async function intakeAll(db: Db, llm: Llm, emails: InboundEmail[]): Promise<{ created: number }> {
  let created = 0;
  for (const email of emails) {
    await intakeEmail(db, llm, email);
    created++;
  }
  return { created };
}
