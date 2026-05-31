export const DEV_MODE = true;

export const isFeatureUnlocked = (condition: boolean) => DEV_MODE || condition;
