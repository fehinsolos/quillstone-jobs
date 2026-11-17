import type { Db } from './db.ts';
import { fromEdmonton, toEdmonton } from './time.ts';
import type { Booking, Job } from './types.ts';

export type Sms = { send(to: string, text: string): Promise<void> };

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** The reminder text, sent at 9 a.m. Edmonton time the day before the install. */
export function planReminder(booking: Booking, job: Job): { sendAt: Date; text: string } {
  const install = toEdmonton(new Date(booking.start));
  const dayBefore = new Date(Date.UTC(install.year, install.month - 1, install.day - 1));
  const sendAt = fromEdmonton(dayBefore.getUTCFullYear(), dayBefore.getUTCMonth() + 1, dayBefore.getUTCDate(), 9);
  const firstName = job.customerName.split(' ')[0];
  const when = `${DAYS[install.weekday]}, ${MONTHS[install.month - 1]} ${install.day}, at ${clock(install.hour, install.minute)}`;
  return {
    sendAt,
    text: `Hi ${firstName}, it's Quillstone Countertops. Your install is tomorrow, ${when}. Reply YES to confirm, or call 780-555-0100 to change it.`,
  };
}

function clock(hour: number, minute: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}

/** Runs every five minutes: sends each reminder that is due and hasn't gone out. */
export async function runReminders(db: Db, sms: Sms, now: Date): Promise<{ sent: number }> {
  let sent = 0;
  for (const booking of await db.bookingsWithoutReminder()) {
    if (new Date(booking.start) <= now) continue; // the install has already started
    const job = await db.getJob(booking.jobId);
    if (!job) continue;
    const reminder = planReminder(booking, job);
    if (reminder.sendAt > now) continue; // not yet
    // Only the process that successfully claims the reminder can send it.
    const claimed = await db.claimReminder(booking.id, now.toISOString());
    if (!claimed) continue;

    await sms.send(job.phone, reminder.text);
    sent++;
  }
  return { sent };
}
