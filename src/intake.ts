import type { Db } from './db.ts';
import type { Llm } from './llm.ts';
import type { InboundEmail, Lead } from './types.ts';

/** Reads one customer email with the model and saves it as a lead for the office to review. */
export async function intakeEmail(db: Db, llm: Llm, email: InboundEmail): Promise<Lead> {
  
  const response = await llm.extract(email);

  // Extract JSON from a Markdown code block if one is present.
  const match = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

  const jsonText = match ? match[1] : response;

  const fields = JSON.parse(jsonText);

  // Only accept a phone number if it appears in the original email.
  const phone = typeof fields.phone === 'string'
    ? fields.phone.replace(/\D/g, '')
    : '';

  const originalText = `${email.from} ${email.body}`.replace(/\D/g, '');
  const verifiedPhone = phone.length === 10 && originalText.includes(phone);

  const lead: Lead = {
    id: `lead-${email.id}`,
    emailId: email.id,
    receivedAt: email.receivedAt,

    // Allow AI to suggest customer details, not approve jobs or set prices.
    customerName: fields.customerName,
    phone: verifiedPhone ? fields.phone : undefined,
    email: fields.email,
    address: fields.address,
    jobType: fields.jobType,
    notes: fields.notes,

    // This must always be controlled by the application.
    status: 'needs_review',
  };

  await db.insertLead(lead);
  return lead;
}

/** The morning run over everything that came in overnight. */

export async function intakeAll(db: Db, llm: Llm, emails: InboundEmail[]): Promise<{ created: number }> {
  let created = 0;

  for (const email of emails) {
    try {
      await intakeEmail(db, llm, email);
    } catch (error) {
      // Preserve the customer email even if AI extraction fails.
      await db.insertLead({
        id: `lead-${email.id}`,
        emailId: email.id,
        receivedAt: email.receivedAt,
        status: 'needs_review',
        notes: 'AI extraction failed. Manual review required.',
      });
    }

    created++;
  }

  return { created };
}
