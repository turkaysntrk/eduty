<script setup>
import { ref } from 'vue';

// Hangi sorunun açık olduğunu tutan değişken (null = hepsi kapalı)
const activeIndex = ref(null);

const toggleAccordion = (index) => {
  if (activeIndex.value === index) {
    activeIndex.value = null; // Zaten açıksa kapat
  } else {
    activeIndex.value = index; // Değilse aç
  }
};

// Soru ve Cevap Verileri (HTML etiketleri destekler)
const faqList = [
  {
    question: "1️⃣ Eduty nedir?",
    answer: "Eduty, ekonomik durumu elverişli olmayan öğrencilerin test çözerek puan kazandığı ve bu puanlarla diplomalı öğretmenlerden online özel ders alabildiği bir eğitim destek platformudur."
  },
  {
    question: "2️⃣ Eduty’nin amacı nedir?",
    answer: "Amacımız, eğitimde fırsat eşitliği sağlamak ve her öğrencinin nitelikli eğitime erişebilmesini mümkün kılmaktır."
  },
  {
    question: "3️⃣ Kimler Eduty’ye üye olabilir?",
    answer: "Türkiye’de yaşayan tüm öğrenciler ücretsiz olarak üye olabilir.<br><br>Destek olmak isteyen herkes “Destek Ol” sayfasından katkıda bulunabilir."
  },
  {
    question: "4️⃣ Sistemde test çözmek ücretli mi?",
    answer: "Hayır. Tüm öğrenciler testleri tamamen ücretsiz çözebilir."
  },
  {
    question: "5️⃣ Her gün kaç test çözebilirim?",
    answer: "Her öğrencinin günde 3 test hakkı vardır.<br>En az 1 test çözmek zorunludur."
  },
  {
    question: "6️⃣ Her testten kaç puan kazanılır?",
    answer: "Her test yaklaşık 50 puan değerindedir.<br>Bir öğrenci günde ortalama 150 puana kadar kazanabilir."
  },
  {
    question: "7️⃣ Kazandığım puanları nerede kullanabilirim?",
    answer: "Biriktirdiğin puanlarla sistemde kayıtlı diplomalı öğretmenlerden online özel ders alabilirsin."
  },
  {
    question: "8️⃣ Puanlar ne zaman sıfırlanır?",
    answer: "Puanlar dönemsel olarak sıfırlanmaz, hesabında birikir.<br>Ancak inaktif (belirli süre test çözmeyen) kullanıcıların puanları pasifleşebilir."
  },
  {
    question: "9️⃣ “Destek Ol” kısmı nasıl çalışır?",
    answer: "Destek olmak isteyen kişiler, puan satın alarak bağışta bulunurlar.<br>Bu puanlar sistem tarafından başarı sıralamasına göre öğrencilere otomatik dağıtılır."
  },
  {
    question: "🔟 Bağış yapılan puanlar nasıl dağıtılıyor?",
    answer: "Öğrencilerin başarı sıralamasına göre:<br>En başarılı öğrencilere daha fazla, diğer öğrencilere orantılı şekilde puan paylaştırılır."
  },
  {
    question: "1️⃣1️⃣ Öğretmenler sisteme nasıl dahil oluyor?",
    answer: "Sadece diplomalı öğretmenler sisteme kayıt olabilir.<br>Başvuru ve doğrulama süreci tamamlandıktan sonra ders verebilirler."
  },
  {
    question: "1️⃣2️⃣ Özel dersler nasıl yapılıyor?",
    answer: "Eduty üzerinden seçtiğin öğretmenle online görüşme yapılır.<br>Görüşme sistemi platforma entegre şekilde çalışır (görsel + sesli bağlantı ile)."
  },
  {
    question: "1️⃣3️⃣ Eduty resmi bir kurum mu?",
    answer: "Eduty bir sosyal girişim projesidir.<br>Henüz özel veya kamu kurumuna bağlı değildir, bağımsız şekilde faaliyet gösterir."
  },
  {
    question: "1️⃣4️⃣ Güvenli mi? Verilerim nasıl korunuyor?",
    answer: "Tüm kullanıcı bilgileri güvenli sunucularda saklanır.<br>Eduty hiçbir şekilde kullanıcı verilerini üçüncü kişilerle paylaşmaz."
  },
  {
    question: "1️⃣5️⃣ Eduty’yi kim geliştirdi?",
    answer: "Eduty, Çorlu Fen Lisesi öğrencisi Türkay Şentürk tarafından geliştirilmiş bir sosyal fayda projesidir.<br><br>Amaç, teknolojiyi eğitimin hizmetine sunarak öğrenciler için daha adil bir gelecek inşa etmektir. 🌍"
  }
];
</script>

<template>
  <div class="sss-page">
    <div class="sss-container">
      
      <div class="header-section">
        <h1 class="page-title">Sıkça Sorulan Sorular</h1>
        <div class="title-underline"></div>
      </div>

      <div class="faq-list">
        <div 
          v-for="(item, index) in faqList" 
          :key="index" 
          class="faq-item"
          :class="{ 'active': activeIndex === index }"
        >
          <button class="faq-question" @click="toggleAccordion(index)">
            <span class="question-text">{{ item.question }}</span>
            <span class="icon">
              <svg v-if="activeIndex === index" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </span>
          </button>

          <transition name="accordion">
            <div v-if="activeIndex === index" class="faq-answer">
              <div class="answer-content" v-html="item.answer"></div>
            </div>
          </transition>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Genel Sayfa Yapısı */
.sss-page {
  min-height: 100vh;
  padding: 100px 20px 60px; /* Navbar için üstten boşluk */
  background-color: #050505;
  font-family: 'Times New Roman', Times, serif;
  color: #ffffff;
}

.sss-container {
  max-width: 800px;
  margin: 0 auto;
}

/* Başlık Alanı */
.header-section {
  text-align: center;
  margin-bottom: 50px;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 15px;
  color: #ffffff;
}

.title-underline {
  width: 80px;
  height: 4px;
  background-color: #0055ff; /* Eduty Primary Color */
  margin: 0 auto;
  border-radius: 2px;
}

/* Soru Listesi */
.faq-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.faq-item {
  background: #111;
  border: 1px solid #222;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.faq-item:hover {
  border-color: #333;
}

.faq-item.active {
  border-color: #0055ff;
  background: #151515;
}

/* Soru Butonu */
.faq-question {
  width: 100%;
  padding: 20px 25px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: transparent;
  border: none;
  color: white;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  font-size: 1.1rem;
  font-weight: 600;
  outline: none;
}

.question-text {
  padding-right: 15px;
  line-height: 1.4;
}

.icon {
  color: #0055ff;
  display: flex;
  align-items: center;
  transition: transform 0.3s ease;
}

.active .icon {
  transform: rotate(180deg);
}

/* Cevap Alanı */
.faq-answer {
  border-top: 1px solid #222;
  background-color: #1a1a1a;
}

.active .faq-answer {
  border-top-color: #333;
}

.answer-content {
  padding: 20px 25px;
  color: #ccc;
  font-size: 1rem;
  line-height: 1.6;
}

/* Vue Transition Animasyonu (Accordion Efekti) */
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.3s ease;
  max-height: 500px; /* İçerik uzunluğuna göre artırılabilir */
  opacity: 1;
}

.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

/* Mobil Uyumluluk */
@media (max-width: 600px) {
  .page-title {
    font-size: 2rem;
  }
  
  .faq-question {
    padding: 15px 20px;
    font-size: 1rem;
  }
  
  .answer-content {
    padding: 15px 20px;
    font-size: 0.95rem;
  }
}
</style>