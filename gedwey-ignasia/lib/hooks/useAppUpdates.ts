import { useEffect } from 'react';
import { Alert } from 'react-native';
import * as Updates from 'expo-updates';

export function useAppUpdates() {
  useEffect(() => {
    // Only check for updates in production build runtime environment, not during development
    if (__DEV__) return;

    let isMounted = true;

    async function checkForUpdates() {
      try {
        const update = await Updates.checkForUpdateAsync();
        
        if (update.isAvailable && isMounted) {
          // Download the new bundle
          await Updates.fetchUpdateAsync();
          
          if (!isMounted) return;

          Alert.alert(
            'App Update Available 🚀',
            'A new version has been downloaded. Restart the app now to apply the changes?',
            [
              { text: 'Later', style: 'cancel' },
              { 
                text: 'Restart Now', 
                onPress: async () => {
                  try {
                    await Updates.reloadAsync();
                  } catch (err) {
                    console.error('[useAppUpdates] Reload failed:', err);
                  }
                } 
              }
            ]
          );
        }
      } catch (error) {
        console.log('[useAppUpdates] Update check failed:', error);
      }
    }

    checkForUpdates();

    return () => {
      isMounted = false;
    };
  }, []);
}
