import type { Booking, Job, Lead } from './types.ts';

export type Seed = { jobs?: Job[]; bookings?: Booking[]; leads?: Lead[] };

// Stands in for the Postgres database the real app uses. Every call is async and
// takes a couple of milliseconds, like a round trip to the database.
const roundTrip = () => new Promise<void>((resolve) => setTimeout(resolve, 2));
const copy = <T>(value: T): T => structuredClone(value);

export function createDb(seed: Seed = {}) {
  const jobs = new Map((seed.jobs ?? []).map((job) => [job.id, copy(job)] as const));
  const bookings = new Map((seed.bookings ?? []).map((booking) => [booking.id, copy(booking)] as const));
  const leads = new Map((seed.leads ?? []).map((lead) => [lead.id, copy(lead)] as const));

  return {
    async getJob(id: string): Promise<Job | undefined> {
      await roundTrip();
      const job = jobs.get(id);
      return job && copy(job);
    },

    async listBookings(): Promise<Booking[]> {
      await roundTrip();
      return [...bookings.values()].map(copy);
    },

    async bookingsForCrew(crewId: string): Promise<Booking[]> {
      await roundTrip();
      return [...bookings.values()].filter((booking) => booking.crewId === crewId).map(copy);
    },

    // race condition implementation
    async reserveCrewIfAvailable(fields: Omit<Booking, 'id'>): Promise<
      { ok: true; booking: Booking } |
      { ok: false; conflictingJobId: string }
    > {
      await roundTrip();

      const newStart = new Date(fields.start);
      const newEnd = new Date(fields.end);

      const conflict = [...bookings.values()].find((existing) => {
        const bookedStart = new Date(existing.start);
        const bookedEnd = new Date(existing.end);

        return existing.crewId === fields.crewId &&
          newStart < bookedEnd && newEnd > bookedStart;
      });

      if (conflict) {
        return { ok: false, conflictingJobId: conflict.jobId };
      }

      // No await between checking and inserting.
      const booking: Booking = {
        ...copy(fields),
        id: crypto.randomUUID(),
      };

      bookings.set(booking.id, booking);
      return { ok: true, booking: copy(booking) };
    },


    async insertBooking(fields: Omit<Booking, 'id'>): Promise<Booking> {
      await roundTrip();
      const booking: Booking = { ...copy(fields), id: crypto.randomUUID() };
      bookings.set(booking.id, booking);
      return copy(booking);
    },

    // Claim a reminder before sending it to avoid duplicate sends.
    async claimReminder(bookingId: string, at: string): Promise<boolean> {
      await roundTrip();

      const booking = bookings.get(bookingId);

      // Another reminder process may have already claimed it.
      if (!booking || booking.reminderSentAt) {
        return false;
      }

      // Check and update without awaiting between them.
      booking.reminderSentAt = at;
      return true;
    },

    async bookingsWithoutReminder(): Promise<Booking[]> {
      await roundTrip();
      return [...bookings.values()].filter((booking) => !booking.reminderSentAt).map(copy);
    },

    async markReminderSent(bookingId: string, at: string): Promise<void> {
      await roundTrip();
      const booking = bookings.get(bookingId);
      if (booking) booking.reminderSentAt = at;
    },

    async insertLead(lead: Lead): Promise<void> {
      await roundTrip();
      leads.set(lead.id, copy(lead));
    },

    async listLeads(): Promise<Lead[]> {
      await roundTrip();
      return [...leads.values()].map(copy);
    },
  };
}

export type Db = ReturnType<typeof createDb>;
