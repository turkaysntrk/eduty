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
          <h2>Biz Kimiz?</h2>
        </NuxtLink>
        <div class="blue-line"></div>
        <p>
          Biz, eğitimdeki engelleri kaldırmayı misyon edinmiş bir topluluğuz. Gazi Mustafa Kemal Atatürk'ün vizyonuyla,
          her çocuğun kaliteli eğitime erişmesi için teknoloji ve dayanışmayı bir araya getiriyoruz.
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
  0% {
    opacity: 1;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  }

  50% {
    opacity: 0.95;
    text-shadow: 0 0 20px rgba(255, 255, 255, 0.6);
  }

  100% {
    opacity: 1;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  }
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
  text-shadow: 1px 1px 5px rgba(0, 0, 0, 0.8);
}

/* --- INFO SECTION --- */
.info-section {
  background: linear-gradient(160deg, #060d1f 0%, #0a1628 60%, #050f22 100%);
  color: #ffffff;
  padding: 100px 20px;
  display: flex;
  justify-content: center;
  text-align: center;
  position: relative;
  overflow: hidden;
}

/* Dekoratif arka plan nokta deseni */
.info-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 1px 1px, rgba(56, 189, 248, 0.06) 1px, transparent 0);
  background-size: 36px 36px;
  pointer-events: none;
}

/* Üstten gelen mavi ışık */
.info-section::after {
  content: '';
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 300px;
  background: radial-gradient(ellipse, rgba(26, 107, 255, 0.12) 0%, transparent 70%);
  pointer-events: none;
}

.welcome-text {
  max-width: 800px;
  position: relative;
  z-index: 1;
}

.clickable-title {
  text-decoration: none;
  cursor: pointer;
}

.welcome-text h2 {
  font-size: 2.6rem;
  margin-bottom: 12px;
  font-family: 'Playfair Display', 'Times New Roman', serif;
  color: white;
  transition: color 0.3s ease;
  font-weight: 700;
}

.clickable-title:hover h2 {
  color: #38bdf8;
}

.blue-line {
  width: 56px;
  height: 4px;
  background: linear-gradient(90deg, #1a6bff, #38bdf8);
  margin: 0 auto 32px;
  border-radius: 99px;
}

.welcome-text p {
  font-size: 1.15rem;
  line-height: 1.85;
  color: rgba(255, 255, 255, 0.65);
  margin-bottom: 40px;
  font-family: 'DM Sans', sans-serif;
}

/* --- BUTON --- */
.action-area {
  margin-top: 30px;
}

.btn-about {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 13px 36px;
  border: 1.5px solid rgba(56, 189, 248, 0.4);
  border-radius: 30px;
  background: rgba(26, 107, 255, 0.08);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
  font-family: 'DM Sans', sans-serif;
  backdrop-filter: blur(4px);
}

.btn-about:hover {
  background: linear-gradient(135deg, #1a6bff, #0a4fd6);
  border-color: #1a6bff;
  color: white;
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(26, 107, 255, 0.4);
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