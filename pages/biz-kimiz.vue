<template>
  <div class="about-page">
    
    <div class="container">
      <div class="header-section">
        <h1 class="main-title">Biz Kimiz?</h1>
        <div class="blue-line"></div>
      </div>

      <section class="mission-section">
        <div class="text-content">
          <p class="intro-text">
            Eduty, eğitimde fırsat eşitliğini güçlendirmeyi hedefleyen bir <span class="highlight">sosyal girişim projesidir.</span>
          </p>
          <p>
            Fen Lisesi öğrencisi tarafından tasarlanıp geliştirilen bu platform, ekonomik durumu elverişli olmayan öğrencilerin ücretsiz olarak akademik destek almasını sağlar. Amacımız, geleceğin eğitimine yön vermek ve her öğrenciye eşit fırsat sunmaktır.
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
              Sistemimizde öğrenciler her gün <strong>3 test hakkına</strong> sahiptir ve günde en az 1 test çözmeleri gerekir.
              Her testten kazanılan puanlar, günlük ortalama <strong>150 puana</strong> kadar ulaşabilir.
            </p>
          </div>

          <div class="info-card">
            <div class="icon-box">⭐</div>
            <h3>Puan ve Ödül</h3>
            <p>
              Öğrenciler biriktirdikleri bu puanlarla, sistemimize kayıtlı <strong>diplomalı öğretmenlerden</strong> online özel ders alabilirler. 
              Emek veren öğrenci, eğitimle ödüllendirilir.
            </p>
          </div>

          <div class="info-card">
            <div class="icon-box">🤝</div>
            <h3>Destek Ol</h3>
            <p>
              Gönüllüler puan satın alarak bağışta bulunurlar. Bu puanlar, <strong>başarı sıralamasına göre</strong> öğrencilere en yüksekten düşüğe doğru dağıtılır. Böylece toplumsal dayanışma güçlenir.
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
import { onMounted } from 'vue'

onMounted(() => {
  window.scrollTo(0, 0)
})
</script>

<style scoped>
/* --- GENEL SAYFA AYARLARI --- */
.about-page {
  background-color: #050505;
  min-height: 100vh;
  padding-top: 140px; 
  padding-bottom: 0;
  color: var(--text-light); 
  font-family: var(--font-main);
}

.container {
  /* Laptoplarda genişliği artırdım (önceki: 1000px idi) */
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
  font-family: var(--font-serif);
  font-size: 2.5rem;
  color: #ffffff;
  margin-bottom: 10px;
}

.blue-line {
  width: 60px;
  height: 3px;
  background: var(--accent-color);
  margin: 0 auto;
}

/* --- METİN ALANI --- */
.mission-section {
  display: flex;
  justify-content: center;
  margin-bottom: 80px;
  margin-top: 40px;
}

.text-content {
  /* Genişlik sınırı artırıldı (önceki: 800px idi), artık cümle sığacak */
  max-width: 950px; 
  text-align: center;
  line-height: 1.8;
  color: #cccccc;
  font-size: 1.1rem;
}

.intro-text {
  margin-bottom: 20px;
  font-size: 1.25rem;
  color: white;
}

/* Laptop ekranlarında (min-width: 1024px) fontu ve satır yapısını garantiye al */
@media (min-width: 1024px) {
  .text-content {
    width: 100%;
  }
}

.highlight {
  color: var(--primary-color);
  font-weight: 600;
}

/* --- SİSTEM / KARTLAR ALANI --- */
.how-it-works {
  padding-bottom: 80px;
}

.section-heading {
  text-align: center;
  font-family: var(--font-serif);
  font-size: 2rem;
  margin-bottom: 50px;
  color: var(--primary-color);
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.info-card {
  background: #111;
  border: 1px solid #222;
  padding: 30px;
  border-radius: 8px;
  text-align: center;
  transition: transform 0.3s ease, border-color 0.3s ease;
}

.info-card:hover {
  transform: translateY(-5px);
  border-color: var(--secondary-color);
}

.icon-box {
  font-size: 2.5rem;
  margin-bottom: 20px;
}

.info-card h3 {
  font-family: var(--font-serif);
  color: white;
  font-size: 1.4rem;
  margin-bottom: 15px;
}

.info-card p {
  color: #aaa;
  font-size: 0.95rem;
  line-height: 1.6;
}

.info-card strong {
  color: var(--primary-color);
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
  z-index: 2;
  padding: 20px;
}

.closing-content h2 {
  font-family: var(--font-serif);
  font-size: 2.2rem;
  color: white;
  margin-bottom: 15px;
}

.closing-content p {
  font-size: 1.1rem;
  color: #ddd;
  margin-bottom: 30px;
}

.btn-glow {
  display: inline-block;
  padding: 12px 35px;
  background: var(--primary-color);
  color: white;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-radius: 30px;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 0 15px rgba(0, 85, 255, 0.4);
  font-family: var(--font-serif);
}

.btn-glow:hover {
  background: var(--secondary-color);
  box-shadow: 0 0 25px rgba(0, 85, 255, 0.7);
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