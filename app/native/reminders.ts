import { NativeModules, Platform } from 'react-native';

/** Typed bridge to the iOS `PracticeReminders` native module. */

export interface ReminderItem {
  id: string;
  /** Milliseconds since epoch. */
  timestamp: number;
  title: string;
  body: string;
}

interface RemindersNative {
  requestPermission(): Promise<boolean>;
  getPermission(): Promise<'granted' | 'denied' | 'unknown'>;
  schedule(items: ReminderItem[]): Promise<number>;
  cancelAll(): Promise<void>;
}

const native: RemindersNative | undefined =
  Platform.OS === 'ios' ? NativeModules.PracticeReminders : undefined;

export const remindersAvailable = native != null;

export const Reminders = {
  requestPermission: async () => (native ? native.requestPermission() : false),
  getPermission: async () => (native ? native.getPermission() : 'denied'),
  schedule: async (items: ReminderItem[]) => (native ? native.schedule(items) : 0),
  cancelAll: async () => (native ? native.cancelAll() : undefined),
};
