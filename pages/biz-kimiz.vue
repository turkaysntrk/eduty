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
  /* Üstten alta doğru koyulaşan gradient */
  background: linear-gradient(to bottom, rgba(5, 5, 5, 0.75), rgba(0, 0, 0, 0.98));
  z-index: 1;
}

.relative-z {
  position: relative;
  z-index: 2; /* İçeriği arka planın üstüne çıkarır */
}

/* --- GENEL SAYFA AYARLARI --- */
.about-page {
  min-height: 100vh;
  padding-top: 140px;
  padding-bottom: 0;
  color: #f4f4f4; /* --text-light */
  font-family: 'Montserrat', sans-serif; /* --font-main */
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
  font-family: 'Times New Roman', Times, serif; /* --font-serif */
  font-size: 2.5rem;
  color: #ffffff;
  margin-bottom: 10px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.5);
}

.blue-line {
  width: 60px;
  height: 3px;
  background: #0055ff; /* --primary-color */
  margin: 0 auto;
  box-shadow: 0 0 10px rgba(0, 85, 255, 0.5);
}

/* --- METİN ALANI --- */
.mission-section {
  display: flex;
  justify-content: center;
  margin-bottom: 80px;
  margin-top: 40px;
}

.text-content {
  max-width: 950px;
  text-align: center;
  line-height: 1.8;
  color: #dddddd;
  font-size: 1.1rem;
  text-shadow: 0 1px 2px rgba(0,0,0,0.8);
}

.intro-text {
  margin-bottom: 20px;
  font-size: 1.25rem;
  color: white;
}

@media (min-width: 1024px) {
  .text-content {
    width: 100%;
  }
}

.highlight {
  color: #0055ff; /* --primary-color */
  font-weight: 700;
  text-shadow: 0 0 15px rgba(0, 85, 255, 0.4);
}

/* --- SİSTEM / KARTLAR ALANI --- */
.how-it-works {
  padding-bottom: 80px;
}

.section-heading {
  text-align: center;
  font-family: 'Times New Roman', Times, serif;
  font-size: 2rem;
  margin-bottom: 50px;
  color: #0055ff; /* --primary-color */
  text-shadow: 0 0 10px rgba(0,0,0,0.5);
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.info-card {
  background: rgba(17, 17, 17, 0.8);
  backdrop-filter: blur(5px);
  border: 1px solid #333;
  padding: 35px 30px;
  border-radius: 12px;
  text-align: center;
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

.info-card:hover {
  transform: translateY(-8px);
  border-color: #003bb0; /* --secondary-color */
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  background: rgba(17, 17, 17, 0.95);
}

.icon-box {
  font-size: 3rem;
  margin-bottom: 20px;
  filter: drop-shadow(0 0 10px rgba(255,255,255,0.2));
}

.info-card h3 {
  font-family: 'Times New Roman', Times, serif;
  color: white;
  font-size: 1.5rem;
  margin-bottom: 15px;
}

.info-card p {
  color: #ccc;
  font-size: 1rem;
  line-height: 1.7;
}

/* --- KAPANIŞ / CTA ALANI --- */
.closing-section {
  position: relative;
  height: 400px;
  background-image: url('/img/ana_sayfa_fotoğrafı.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  margin-top: 40px;
  z-index: 3; /* En üstte durması için */
  border-top: 1px solid #222;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
}

.closing-content {
  position: relative;
  z-index: 4;
  padding: 20px;
}

.closing-content h2 {
  font-family: 'Times New Roman', Times, serif;
  font-size: 2.2rem;
  color: white;
  margin-bottom: 15px;
  text-shadow: 0 2px 10px black;
}

.closing-content p {
  font-size: 1.1rem;
  color: #ddd;
  margin-bottom: 30px;
}

.btn-glow {
  display: inline-block;
  padding: 12px 35px;
  background: #0055ff; /* --primary-color */
  color: white;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-radius: 30px;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 0 20px rgba(0, 85, 255, 0.5);
  font-family: 'Times New Roman', Times, serif;
}

.btn-glow:hover {
  background: #003bb0; /* --secondary-color */
  box-shadow: 0 0 30px rgba(0, 85, 255, 0.8);
  transform: scale(1.05);
}

/* --- MOBİL UYUMLULUK --- */
@media (max-width: 768px) {
  .about-page {
    padding-top: 120px;
  }

  .main-title {
    font-size: 2rem;
  }

  .mission-section {
    margin-top: 20px;
  }

  .text-content {
    padding: 0 10px;
  }
}
</style>