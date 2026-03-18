<template>
  <div class="about-page">
    
    <div class="page-bg"></div>
    <div class="page-overlay"></div>

    <div class="container relative-z">
      <div class="header-section">
        <h1 class="main-title">Biz Kimiz?</h1>
        <div class="blue-line"></div>
      </div>

      <section class="mission-section">
        <div class="text-content">
          <p class="intro-text">
            Eduty, eğitimde fırsat eşitliğini güçlendirmeyi hedefleyen bir <span class="highlight">sosyal girişim
              projesidir.</span>
          </p>
          <p>
            Fen Lisesi öğrencisi tarafından tasarlanıp geliştirilen bu platform, ekonomik durumu elverişli olmayan
            öğrencilerin ücretsiz olarak akademik destek almasını sağlar. Amacımız, geleceğin eğitimine yön vermek ve
            her öğrenciye eşit fırsat sunmaktır.
          </p>
        </div>
      </section>

      <section class="how-it-works">
        <h2 class="section-heading">Sistem Nasıl İşler?</h2>

        <div class="cards-grid">
          
          <div class="info-card">
            <div class="icon-box">🎓</div>
            <h3>Öğrenciler İçin</h3>
            <p>
              Günde 3 test hakkın var. Soruları çöz, başarı gösterdikçe <span class="highlight">puan kazan</span>. 
              Biriktirdiğin bu puanlarla dilediğin öğretmenden <span class="highlight">özel ders</span> al veya 
              ihtiyacın olan <span class="highlight">testlere</span> ücretsiz eriş.
            </p>
          </div>

          <div class="info-card">
            <div class="icon-box">👩‍🏫</div>
            <h3>Öğretmenler İçin</h3>
            <p>
              İçerik üreterek veya canlı ders vererek sisteme katkıda bulun.
              Geleceğin inşasında <span class="highlight">senin de imzan olsun.</span>
            </p>
          </div>

          <div class="info-card">
            <div class="icon-box">💙</div>
            <h3>Gönüllüler İçin</h3>
            <p>
              Bir öğrencinin hayatına dokun, <span class="highlight">eğitimdeki engelleri kaldır.</span> 
              Yapacağın destekle, geleceğin mimarlarına <span class="highlight">umut ışığı ol.</span>
            </p>
          </div>
        </div>
      </section>
    </div>

    <section class="closing-section">
      <div class="overlay"></div>
      <div class="closing-content">
        <h2>Eğitimde Adalet İçin Buradayız.</h2>
        <p>Gelin, bu imkansızlıkları birlikte ortadan kaldıralım.</p>
        <NuxtLink to="/kayit-giris" class="btn btn-glow">Aramıza Katıl</NuxtLink>
      </div>
    </section>

  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  window.scrollTo(0, 0)
  
  // Footer'ı bul ve görünürlük/ışık efekti için class ekle
  const footer = document.querySelector('footer') || document.querySelector('.footer')
  if (footer) {
    footer.classList.add('biz-kimiz-footer-glow')
  }
})

onUnmounted(() => {
  // Sayfadan çıkarken footer eski haline dönsün
  const footer = document.querySelector('footer') || document.querySelector('.footer')
  if (footer) {
    footer.classList.remove('biz-kimiz-footer-glow')
  }
})
</script>

<style>
.biz-kimiz-footer-glow {
  position: relative !important;
  z-index: 10 !important; /* Arka planın üstüne çıkmasını sağlar */
  /* Arkadan vuran beyaz ışık efekti */
  background: radial-gradient(circle at center top, rgba(255, 255, 255, 0.15) 0%, rgba(10, 10, 10, 0.95) 70%) !important;
  box-shadow: 0 -10px 40px rgba(255, 255, 255, 0.1) !important;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.5s ease;
}

/* Footer içindeki yazıların beyaz ışık üstünde okunması için gölge */
.biz-kimiz-footer-glow * {
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9) !important;
}
</style>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');

/* --- ARKA PLAN AYARLARI --- */
.page-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/img/biz-kimiz-bg.jpg');
  background-size: cover;
  background-position: center;
  z-index: 0;
}

.page-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(4, 8, 20, 0.8), rgba(4, 10, 25, 0.97));
  z-index: 1;
}

.relative-z {
  position: relative;
  z-index: 2;
}

/* --- GENEL SAYFA --- */
.about-page {
  min-height: 100vh;
  padding-top: 140px;
  padding-bottom: 0;
  color: #f0f6ff;
  font-family: 'DM Sans', 'Montserrat', sans-serif;
  position: relative;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* --- BAŞLIK ALANI --- */
.header-section {
  text-align: center;
  margin-bottom: 30px;
}

.main-title {
  font-family: 'Playfair Display', 'Times New Roman', serif;
  font-size: 2.8rem;
  color: #ffffff;
  margin-bottom: 14px;
  text-shadow: 0 2px 20px rgba(26, 107, 255, 0.3);
  font-weight: 900;
}

.blue-line {
  width: 56px;
  height: 4px;
  background: linear-gradient(90deg, #1a6bff, #38bdf8);
  margin: 0 auto;
  border-radius: 99px;
  box-shadow: 0 0 16px rgba(26, 107, 255, 0.5);
}

/* --- METİN ALANI --- */
.mission-section {
  display: flex;
  justify-content: center;
  margin-bottom: 80px;
  margin-top: 48px;
}

.text-content {
  max-width: 860px;
  text-align: center;
  line-height: 1.85;
  color: rgba(255, 255, 255, 0.65);
  font-size: 1.05rem;
}

.intro-text {
  margin-bottom: 20px;
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
}

@media (min-width: 1024px) {
  .text-content { width: 100%; }
}

.highlight {
  color: #38bdf8;
  font-weight: 600;
  text-shadow: 0 0 12px rgba(56, 189, 248, 0.35);
}

/* --- KARTLAR ALANI --- */
.how-it-works {
  padding-bottom: 80px;
}

.section-heading {
  text-align: center;
  font-family: 'Playfair Display', 'Times New Roman', serif;
  font-size: 2rem;
  margin-bottom: 50px;
  color: #ffffff;
  font-weight: 700;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.info-card {
  background: rgba(10, 20, 50, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(56, 189, 248, 0.12);
  padding: 36px 28px;
  border-radius: 18px;
  text-align: center;
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

.info-card:hover {
  transform: translateY(-8px);
  border-color: rgba(56, 189, 248, 0.45);
  box-shadow: 0 16px 48px rgba(26, 107, 255, 0.25);
  background: rgba(10, 25, 65, 0.8);
}

.icon-box {
  font-size: 2.8rem;
  margin-bottom: 18px;
  display: block;
  filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.3));
}

.info-card h3 {
  font-family: 'Playfair Display', 'Times New Roman', serif;
  color: #ffffff;
  font-size: 1.35rem;
  margin-bottom: 14px;
  font-weight: 700;
}

.info-card p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.97rem;
  line-height: 1.75;
  font-family: 'DM Sans', sans-serif;
}

/* --- KAPANIŞ / CTA --- */
.closing-section {
  position: relative;
  height: 420px;
  background-image: url('/img/ana_sayfa_fotoğrafı.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  margin-top: 40px;
  z-index: 3;
}

.overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(4, 10, 30, 0.65), rgba(4, 10, 30, 0.85));
}

.closing-content {
  position: relative;
  z-index: 4;
  padding: 20px;
}

.closing-content h2 {
  font-family: 'Playfair Display', 'Times New Roman', serif;
  font-size: 2.3rem;
  color: white;
  margin-bottom: 14px;
  font-weight: 900;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.6);
}

.closing-content p {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.75);
  margin-bottom: 32px;
  font-family: 'DM Sans', sans-serif;
}

.btn-glow {
  display: inline-block;
  padding: 13px 38px;
  background: linear-gradient(135deg, #1a6bff, #0a4fd6);
  color: white;
  font-weight: 600;
  letter-spacing: 0.5px;
  border-radius: 30px;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 0 24px rgba(26, 107, 255, 0.5);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.97rem;
}

.btn-glow:hover {
  background: linear-gradient(135deg, #38bdf8, #1a6bff);
  box-shadow: 0 0 36px rgba(56, 189, 248, 0.6);
  transform: translateY(-3px) scale(1.04);
}

/* --- MOBİL --- */
@media (max-width: 768px) {
  .about-page { padding-top: 110px; }
  .main-title { font-size: 2rem; }
  .mission-section { margin-top: 20px; }
  .text-content { padding: 0 10px; }
  .cards-grid { grid-template-columns: 1fr; gap: 18px; }
}
</style>