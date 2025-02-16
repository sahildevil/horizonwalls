import app from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAwTLxmudpZnuqa4j225pPpcPwgm2NQzVA",
  projectId: "wallshorizon-ba270",
  storageBucket: "wallshorizon-ba270.firebasestorage.app",
  appId: "1:367905647579:android:5b95c8af48e5ba9cdb55fe",
  messagingSenderId: "367905647579",
};

// Initialize Firebase if it hasn't been initialized yet
if (!app().apps.length) {
  app.initializeApp(firebaseConfig);
}

export { app, auth };