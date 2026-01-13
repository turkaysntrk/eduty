// plugins/firebase.client.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

export default defineNuxtPlugin((nuxtApp) => {
  const firebaseConfig = {
    apiKey: "AIzaSyBWbnX9x8QxYhMYlGsB2TJC2vZ9O27GRJw",
    authDomain: "eduty-6e802.firebaseapp.com",
    projectId: "eduty-6e802",
    storageBucket: "eduty-6e802.firebasestorage.app",
    messagingSenderId: "459188118029",
    appId: "1:459188118029:web:b041bf164b83c79aa0eb44",
    measurementId: "G-9HC8HHZMYY"
  };

  // 1. Uygulama daha önce başlatılmış mı kontrol et
  let app;
  if (getApps().length > 0) {
    app = getApp();
  } else {
    app = initializeApp(firebaseConfig);
  }

  // 2. Servisleri başlat
  const auth = getAuth(app);
  const analytics = getAnalytics(app);

  // 3. Nuxt uygulamasına bunları "provide" et (dağıt)
  // Böylece her sayfadan $auth diye erişebileceksin.
  return {
    provide: {
      auth: auth,
      analytics: analytics,
      firebaseApp: app
    }
  }
});