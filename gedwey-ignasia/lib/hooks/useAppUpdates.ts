import { useState, useEffect } from 'react';
import * as Updates from 'expo-updates';

export function useAppUpdates() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

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
          
          if (isMounted) {
            setUpdateAvailable(true);
          }
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

  return {
    updateAvailable,
    setUpdateAvailable,
  };
}
