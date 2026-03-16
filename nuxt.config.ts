// nuxt.config.ts
export default defineNuxtConfig({
  devtools: { enabled: true },

  // ── Güvenlik: env değişkenlerini runtime config'e bağla ──
  runtimeConfig: {
    public: {
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID,
      firebaseMeasurementId: process.env.NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    }
  },

  // ── Güvenlik Headers ──
  routeRules: {
    '/**': {
      headers: {
        // Clickjacking koruması
        'X-Frame-Options': 'DENY',
        // XSS koruması
        'X-Content-Type-Options': 'nosniff',
        // HTTPS zorunluluğu (yayında aktif olsun)
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        // Referrer bilgisini sınırla
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        // İzin verilen kaynaklar (Content Security Policy)
        'Content-Security-Policy': [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://meet.jit.si https://*.firebaseapp.com https://*.googleapis.com https://cdnjs.cloudflare.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: blob: https: http:",
          "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com wss://*.firebaseio.com https://meet.jit.si wss://meet.jit.si",
          "frame-src https://meet.jit.si https://*.firebaseapp.com",
          "media-src 'self' blob: https:",
        ].join('; ')
      }
    }
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'Eduty',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        // Arama motorlarına indexleme (yayın öncesi kapalı tutabilirsin)
        // { name: 'robots', content: 'noindex, nofollow' },
      ],
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap'
        }
      ]
    }
  }
})