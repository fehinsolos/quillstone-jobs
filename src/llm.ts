import type { InboundEmail } from './types.ts';

/**
 * The model that reads customer emails. In production this sends EXTRACTION_PROMPT
 * and the email to the LLM API and returns whatever text comes back. Here it
 * replays answers the model really gave, so nobody needs an API key.
 */
export type Llm = { extract(email: InboundEmail): Promise<string> };

export const EXTRACTION_PROMPT = `You read emails sent to Quillstone Countertops.
Reply with JSON only, with these keys: customerName, phone, email, address, jobType, notes.
Use null for anything the email doesn't say.`;

export function recordedLlm(answers: Record<string, string>): Llm {
  return {
    async extract(email) {
      const answer = answers[email.id];
      if (answer === undefined) throw new Error(`No recorded answer for email ${email.id}`);
      return answer;
    },
  };
}
