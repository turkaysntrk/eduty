// nuxt.config.ts

// 🚨 Hata Düzeltildi: defineNuxtConfig fonksiyonunu kullanabilmek için import etmeliyiz.
import { defineNuxtConfig } from 'nuxt/config'; 

export default defineNuxtConfig({
  // CSS yolunu Nuxt standartlarına göre (~) işaretiyle belirttim
  css: [
    '~/assets/css/main.css' 
  ],

  app: {
    head: {
      title: "Eduty",
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ],
      link: [
        // ---> İkon Yolu Düzeltildi <---
        // Eğer dosyan public/img/eduty.ico ise bu yol doğrudur.
        { rel: 'icon', type: 'image/x-icon', href: '/img/eduty_logo.ico' },

        // Fontları çekmek için bu satır
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap' }
      ]
    }
  }
})