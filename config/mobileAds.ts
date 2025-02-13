import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';

export const initializeMobileAds = async () => {
  try {
    await mobileAds().setRequestConfiguration({
      // Set max ad content rating to all audiences
      maxAdContentRating: MaxAdContentRating.G,
      // Indicates if you want your content treated as child-directed for COPPA
      tagForChildDirectedTreatment: true,
      // Indicates if you want your content treated as under age of consent
      tagForUnderAgeOfConsent: true,
    });

    await mobileAds().initialize();
    console.log('Mobile Ads SDK initialized successfully');
  } catch (error) {
    console.error('Mobile Ads SDK initialization failed:', error);
  }
};