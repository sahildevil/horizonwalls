// import React, { createContext, useState, useContext, useEffect } from 'react';
// import { GoogleSignin, type User, statusCodes } from '@react-native-google-signin/google-signin';
// import { Platform } from 'react-native';
// import * as SecureStore from "expo-secure-store";
// import { useRouter } from "expo-router";
// import * as WebBrowser from 'expo-web-browser';

// WebBrowser.maybeCompleteAuthSession();

// interface AuthContextType {
//   isSignedIn: boolean;
//   userInfo: User | null;
//   signIn: () => Promise<void>;
//   signOut: () => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [isSignedIn, setIsSignedIn] = useState(false);
//   const [userInfo, setUserInfo] = useState<User | null>(null);
//   const router = useRouter();

//   useEffect(() => {
//     if (Platform.OS === 'android') {
//       GoogleSignin.configure({
//         webClientId: 'YOUR_WEB_CLIENT_ID', // from Google Cloud Console
//         offlineAccess: false
//       });
//     }
//     checkSignInStatus();
//   }, []);

//   const checkSignInStatus = async () => {
//     try {
//       const hasPlayServices = await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
//       if (!hasPlayServices) return;

//       const isUserSignedIn = await GoogleSignin.isSignedInAsync();
//       if (isUserSignedIn) {
//         const currentUser = await GoogleSignin.getCurrentUser();
//         setUserInfo(currentUser);
//         setIsSignedIn(true);
//       }
//     } catch (error: any) {
//       if (error.code === statusCodes.SIGN_IN_REQUIRED) {
//         setIsSignedIn(false);
//       } else {
//         console.error('Error checking sign in status:', error);
//       }
//     }
//   };

//   const signIn = async () => {
//     try {
//       await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
//       const signInResult = await GoogleSignin.signIn();
      
//       if (signInResult) {
//         setUserInfo(signInResult);
//         setIsSignedIn(true);
//         await SecureStore.setItemAsync('user', JSON.stringify(signInResult));
//         router.replace("/(tabs)");
//       }
//     } catch (error: any) {
//       if (error.code === statusCodes.SIGN_IN_CANCELLED) {
//         console.log('User cancelled sign in');
//       } else if (error.code === statusCodes.IN_PROGRESS) {
//         console.log('Sign in already in progress');
//       } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
//         console.log('Play services not available');
//       } else {
//         console.error('Sign in error:', error);
//       }
//     }
//   };

//   const signOut = async () => {
//     try {
//       await GoogleSignin.revokeAccess();
//       await GoogleSignin.signOut();
//       await SecureStore.deleteItemAsync('user');
//       setUserInfo(null);
//       setIsSignedIn(false);
//       router.replace("/login");
//     } catch (error) {
//       console.error('Error signing out:', error);
//     }
//   };

//   return (
//     <AuthContext.Provider value={{ isSignedIn, userInfo, signIn, signOut }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };