import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export const NOTIFICATION_CHANNELS = {
  default: 'default',
  sessions: 'sessions',
  partner: 'partner',
  capsules: 'capsules',
} as const;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.default, {
    name: 'General',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#4F46E5',
  });

  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.sessions, {
    name: 'Session Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 200],
    lightColor: '#4F46E5',
  });

  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.partner, {
    name: 'Partner Activity',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 150, 100, 150],
    lightColor: '#E11D48',
  });

  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.capsules, {
    name: 'Time Capsules',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 300, 200, 300],
    lightColor: '#7C3AED',
  });
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  if (!Device.isDevice) {
    console.log('[Notifications] Must use a physical device for remote push notifications.');
    return 'ExponentPushToken[MockTokenForTesting]';
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Push permission denied.');
      return null;
    }

    await ensureNotificationChannels();

    let token: string | null = null;
    try {
      let projectId: string | undefined;
      try {
        const Constants = require('expo-constants').default;
        projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      } catch {
        console.log('[Notifications] Could not load projectId from expo-constants');
      }

      const tokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );
      token = tokenData.data;
      console.log('[Notifications] Push token registered:', token);
    } catch (tokenError) {
      console.log('[Notifications] Expo push token unavailable, using mock:', tokenError);
      token = 'ExponentPushToken[MockTokenForTesting]';
    }

    return token;
  } catch (error) {
    console.error('[Notifications] Registration failed:', error);
    return null;
  }
}

export async function sendPushNotification(
  toToken: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<boolean> {
  if (!toToken || toToken.includes('MockToken')) {
    console.log('[Notifications] Skipping push: empty or mock token.');
    return false;
  }

  const message = {
    to: toToken,
    sound: 'default',
    title,
    body,
    data: data || {},
    channelId: NOTIFICATION_CHANNELS.partner,
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const resData = await response.json();
    console.log('[Notifications] Push gateway response:', resData);
    return response.ok;
  } catch (error) {
    console.error('[Notifications] Push send failed:', error);
    return false;
  }
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  triggerSeconds: number,
  options?: {
    identifier?: string;
    data?: Record<string, unknown>;
    channelId?: string;
  }
): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  if (triggerSeconds <= 0) return null;

  try {
    await ensureNotificationChannels();

    const id = await Notifications.scheduleNotificationAsync({
      identifier: options?.identifier,
      content: {
        title,
        body,
        sound: true,
        data: options?.data || {},
        ...(Platform.OS === 'android'
          ? { channelId: options?.channelId || NOTIFICATION_CHANNELS.default }
          : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: triggerSeconds,
      },
    });
    console.log(`[Notifications] Scheduled local notification ${id} in ${triggerSeconds}s`);
    return id;
  } catch (error) {
    console.error('[Notifications] Schedule failed:', error);
    return null;
  }
}

export async function cancelScheduledNotification(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    // ignore
  }
}
