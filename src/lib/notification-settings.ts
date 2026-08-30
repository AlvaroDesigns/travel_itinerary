export type CountdownMode = 'exact' | 'surprise';
export type PublicItineraryVisibility = 'all' | 'day_before';

export interface NotificationSettings {
  recipientEmail: string;
  reminderEnabled: boolean;
  reminderIntervalDays: number;
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

export const createDefaultNotificationSettings = (recipientEmail: string): NotificationSettings => ({
  recipientEmail,
  reminderEnabled: false,
  reminderIntervalDays: 7,
  countdownMode: 'exact',
  instructionsEnabled: true,
  instructionsText: '',
  itineraryAccessEnabled: true,
  itineraryAccessHours: 6,
  publicAccessEnabled: false,
  publicShowExpenses: false,
  publicItineraryVisibility: 'all',
});
