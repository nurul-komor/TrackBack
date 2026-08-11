import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const notificationsEnabled = process.env.EXPO_PUBLIC_NOTIFICATIONS_ENABLED === 'true';

// Remote push notifications require a development build on Android (SDK 53+),
// and merely loading expo-notifications inside Expo Go logs a warning — so the
// module is only required outside Expo Go.
const isExpoGo = Constants.executionEnvironment === 'storeClient';
const Notifications: typeof import('expo-notifications') | null =
  notificationsEnabled && !isExpoGo ? require('expo-notifications') : null;

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export const registerForPushNotifications = async (userId: string): Promise<void> => {
  if (!Notifications) return;

  try {
    // Android 13+: channel must exist before the permission prompt appears
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = await Notifications.getExpoPushTokenAsync({ projectId });

    await updateDoc(doc(db, 'users', userId), { fcmToken: token.data });
  } catch {
    // Silently skip — push notifications are a non-critical feature
  }
};

export const sendPushNotification = async (
  expoPushToken: string,
  title: string,
  body: string,
  data?: Record<string, any>,
): Promise<void> => {
  if (!notificationsEnabled || !expoPushToken) return;
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: expoPushToken, title, body, data, sound: 'default' }),
  });
};
