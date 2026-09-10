export type CountdownMode = 'exact' | 'surprise';
export type PublicItineraryVisibility = 'all' | 'day_before';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MAX_BCC_RECIPIENTS = 25;

export interface NotificationSettings {
  recipientEmail: string;
  bccEmails: string[];
  reminderEnabled: boolean;
  reminderIntervalDays: number;
  reminderTime: string; // HH:MM
  countdownMode: CountdownMode;
  instructionsEnabled: boolean;
  instructionsText: string;
  itineraryAccessEnabled: boolean;
  itineraryAccessHours: number;
  publicAccessEnabled: boolean;
  publicAccessToken?: string;
  publicShowExpenses: boolean;
  publicItineraryVisibility: PublicItineraryVisibility;
}

/** Validates, normalizes and deduplicates hidden-copy recipients. */
export function normalizeBccEmails(value: unknown): string[] | null {
  const entries = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[,;\n]/)
      : null;

  if (!entries || entries.some((entry) => typeof entry !== 'string')) return null;

  const emails = [...new Set(entries.map((entry) => entry.trim().toLowerCase()).filter(Boolean))];
  if (emails.length > MAX_BCC_RECIPIENTS || emails.some((email) => !EMAIL_PATTERN.test(email))) return null;

  return emails;
}

export const createDefaultNotificationSettings = (recipientEmail: string): NotificationSettings => ({
  recipientEmail,
  bccEmails: [],
  reminderEnabled: false,
  reminderIntervalDays: 7,
  reminderTime: '09:00',
  countdownMode: 'exact',
  instructionsEnabled: true,
  instructionsText: '',
  itineraryAccessEnabled: true,
  itineraryAccessHours: 6,
  publicAccessEnabled: false,
  publicShowExpenses: false,
  publicItineraryVisibility: 'all',
});
