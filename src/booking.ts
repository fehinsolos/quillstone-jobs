import type { Db } from './db.ts';
import type { Booking } from './types.ts';

export type BookingRequest = { jobId: string; crewId: string; start: string; end: string };
export type BookingResult = { ok: true; booking: Booking } | { ok: false; reason: string };

/** Books a crew for an install, unless the crew is already busy then. */
export async function bookInstall(db: Db, request: BookingRequest): Promise<BookingResult> {
  const start = new Date(request.start);
  const end = new Date(request.end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return { ok: false, reason: 'The install needs a start time and an end time after it.' };
  }

  const job = await db.getJob(request.jobId);
  if (!job) return { ok: false, reason: `There is no job ${request.jobId}.` };

  const result = await db.reserveCrewIfAvailable({
    jobId: request.jobId,
    crewId: request.crewId,
    start: start.toISOString(),
    end: end.toISOString(),
  });

  if (!result.ok) {
    return {
      ok: false,
      reason: `That crew is already booked for job ${result.conflictingJobId} then.`,
    };
  }

  return { ok: true, booking: result.booking };
}


