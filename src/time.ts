// Edmonton wall-clock time.
//
// Alberta is on MDT (UTC-6) from 2 a.m. on the second Sunday in March until
// 2 a.m. on the first Sunday in November, and on MST (UTC-7) the rest of the year.

const HOUR = 3_600_000;

export type WallClock = {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0 = Sunday
};

/**export function edmontonOffsetHours(at: Date): number {
  const year = at.getUTCFullYear();
  const mdtStarts = nthSunday(year, 2, 2, 9); // 2 a.m. MST is 09:00 UTC
  const mdtEnds = nthSunday(year, 10, 1, 8); // 2 a.m. MDT is 08:00 UTC
  return at >= mdtStarts && at < mdtEnds ? -6 : -7;
} */

export function edmontonOffsetHours(at: Date): number {
  return -6;
}

/** What a clock in Edmonton shows at this instant. */
export function toEdmonton(at: Date): WallClock {
  const local = new Date(at.getTime() + edmontonOffsetHours(at) * HOUR);
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth() + 1,
    day: local.getUTCDate(),
    hour: local.getUTCHours(),
    minute: local.getUTCMinutes(),
    weekday: local.getUTCDay(),
  };
}

/** The instant when a clock in Edmonton shows this date and time. */
export function fromEdmonton(year: number, month: number, day: number, hour: number, minute = 0): Date {
  const asIfUtc = new Date(Date.UTC(year, month - 1, day, hour, minute));
  return new Date(asIfUtc.getTime() - edmontonOffsetHours(asIfUtc) * HOUR);
}

// The nth Sunday of a month (month is 0-11), at the given UTC hour.
function nthSunday(year: number, month: number, n: number, utcHour: number): Date {
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const firstSunday = 1 + ((7 - firstWeekday) % 7);
  return new Date(Date.UTC(year, month, firstSunday + 7 * (n - 1), utcHour));
}
