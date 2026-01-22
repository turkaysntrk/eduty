<template>
  <div class="home-page">
    <section class="hero">
      <div class="overlay"></div>
      <div class="hero-content">
        <h4 class="date-badge">YAKINDA SİZLERLEYİZ - 2026</h4>
        <p class="motto">"Eğitimdeki imkansızlıkları ortadan kaldırıyoruz."</p>
      </div>
    </section>

    <section class="info-section">
      <div class="welcome-text">
        <NuxtLink to="/biz-kimiz" class="clickable-title">
          <h2>Biz kimiz?</h2>
        </NuxtLink>
        <div class="blue-line"></div>
        <p>
          Biz eğitimdeki imkansızlıkları ortadan kaldırmayı misyon edinmiş bir topluluğuz. Amacımız, her çocuğun kaliteli
          eğitime erişimini sağlamak ve öğrenme süreçlerini Gazi Mustafa Kemal Atatürk önderliğinde desteklemektir. Yenilikçi çözümlerimizle, eğitimde fırsat
          eşitliği yaratmayı hedefliyoruz.
        </p>
        
        <div class="action-area">
          <NuxtLink to="/biz-kimiz" class="btn-about">
            Hikayemizi Oku <span class="arrow">→</span>
          </NuxtLink>
        </div>
        </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const timeLeft = ref({ days: 0, hours: 0, minutes: 0, seconds: 0 })
let timerInterval = null
const targetDate = new Date('2026-05-01T09:00:00').getTime()

const calculateTime = () => {
  const now = new Date().getTime()
  const distance = targetDate - now

  if (distance < 0) {
    clearInterval(timerInterval)
    timeLeft.value = { days: 0, hours: 0, minutes: 0, seconds: 0 }
    return
  }

  timeLeft.value = {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((distance % (1000 * 60)) / 1000)
  }
}

onMounted(() => {
  calculateTime()
  timerInterval = setInterval(calculateTime, 1000)
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<style scoped>
/* --- HERO SECTION --- */
.hero {
  height: 100vh;
  background-image: url('/img/ana_sayfa_fotoğrafı.png');
  background-size: cover;
  background-position: center top;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  position: relative;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
}

.hero-content {
  position: relative;
  z-index: 2;
  color: white;
  padding: 20px;
}

/* --- MUM IŞIĞI ANİMASYONU --- */
@keyframes candle-flicker {
  0% { opacity: 1; text-shadow: 0 0 10px rgba(255, 255, 255, 0.5); }
  50% { opacity: 0.95; text-shadow: 0 0 20px rgba(255, 255, 255, 0.6); }
  100% { opacity: 1; text-shadow: 0 0 10px rgba(255, 255, 255, 0.5); }
}

.date-badge {
  letter-spacing: 4px;
  font-weight: 800;
  color: #ffffff !important;
  font-size: 1.5rem;
  margin-bottom: 25px;
  animation: candle-flicker 3s infinite linear;
}

.motto {
  font-size: 2rem;
  color: #fff;
  font-weight: 300;
  margin-top: 20px;
  text-shadow: 1px 1px 5px rgba(0,0,0,0.8);
}

/* --- INFO SECTION (SİYAH ALAN) --- */
.info-section {
  background-color: #000000;
  color: #ffffff;
  padding: 80px 20px;
  display: flex;
  justify-content: center;
  text-align: center;
}

.welcome-text {
  max-width: 800px;
}

.clickable-title {
  text-decoration: none;
  cursor: pointer;
}

.welcome-text h2 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  font-family: 'Times New Roman', Times, serif;
  color: white;
  transition: color 0.3s ease;
}

.clickable-title:hover h2 {
  color: #0055ff; /* Logo mavisi */
}

.blue-line {
  width: 60px;
  height: 4px;
  background: #274a90;
  margin: 0 auto 30px;
}

.welcome-text p {
  font-size: 1.2rem;
  line-height: 1.8;
  color: #cccccc;
  margin-bottom: 40px;
}

/* --- YENİ BUTON STİLİ --- */
.action-area {
  margin-top: 30px;
}

.btn-about {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 35px;
  border: 1px solid #333;
  border-radius: 30px;
  background-color: transparent;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  letter-spacing: 1px;
}

.btn-about:hover {
  background-color: #0055ff; /* Primary Blue */
  border-color: #0055ff;
  color: white;
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 85, 255, 0.3);
}

.arrow {
  transition: transform 0.3s ease;
}

.btn-about:hover .arrow {
  transform: translateX(5px);
}

/* Mobil Uyumluluk */
@media (max-width: 768px) {
  .motto {
    font-size: 1.5rem;
  }
  .info-section {
    padding: 50px 20px;
  }
}
</style>