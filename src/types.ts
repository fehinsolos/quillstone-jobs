export type Job = {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  description: string;
};

/** A crew's slot for an install. start and end are UTC instants in ISO format. */
export type Booking = {
  id: string;
  jobId: string;
  crewId: string;
  start: string;
  end: string;
  reminderSentAt?: string;
};

export type InboundEmail = {
  id: string;
  from: string;
  subject: string;
  receivedAt: string;
  body: string;
};

/** A possible new job from an email, waiting for the office to look at it. */
export type Lead = {
  id: string;
  emailId: string;
  receivedAt: string;
  status: 'needs_review' | 'approved' | 'rejected';
  customerName?: string;
  phone?: string;
  email?: string;
  address?: string;
  jobType?: string;
  notes?: string;
  /** Filled in by the office when they quote the job. */
  price?: number;
};
