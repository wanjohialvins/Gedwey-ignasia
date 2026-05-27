import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Configure default notification handler behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register device for remote push notifications.
 * Requests system permissions and retrieves the Expo Push Token.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  if (!Device.isDevice) {
    console.log('[Notifications] Must use a physical device for remote push notifications.');
    // In emulator, we can return a mock token or null
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
      console.log('[Notifications] Failed to get push token for push notifications! Permission denied.');
      return null;
    }

    // Get the Expo Push Token
    let token = null;
    try {
      let projectId = undefined;
      try {
        const Constants = require('expo-constants').default;
        projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      } catch (e) {
        console.log('[Notifications] Could not load projectId from expo-constants');
      }

      const tokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );
      token = tokenData.data;
      console.log('[Notifications] Device push token successfully registered:', token);
    } catch (tokenError) {
      console.log('[Notifications] Could not retrieve Expo Push Token (likely no projectId or not logged in to Expo). Using mock token:', tokenError);
      token = 'ExponentPushToken[MockTokenForTesting]';
    }

    // Set up default channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
      });
    }

    return token;
  } catch (error) {
    console.error('[Notifications] Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Dispatches a remote push notification payload to the partner's device token via Expo's gateway.
 */
export async function sendPushNotification(
  toToken: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<boolean> {
  if (!toToken || toToken.includes('MockToken')) {
    console.log('[Notifications] Skipping push dispatch: empty or mock token.');
    return false;
  }

  const message = {
    to: toToken,
    sound: 'default',
    title,
    body,
    data: data || {},
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
    console.log('[Notifications] Push dispatch gateway response:', resData);
    return response.ok;
  } catch (error) {
    console.error('[Notifications] Error sending push notification:', error);
    return false;
  }
}

/**
 * Schedules an offline local device alert notification to trigger after a set timeframe.
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  triggerSeconds: number,
  identifier?: string
): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title,
        body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: triggerSeconds,
      },
    });
    console.log(`[Notifications] Local notification scheduled with ID: ${id} to trigger in ${triggerSeconds} seconds.`);
    return id;
  } catch (error) {
    console.error('[Notifications] Error scheduling local notification:', error);
    return null;
  }
}
