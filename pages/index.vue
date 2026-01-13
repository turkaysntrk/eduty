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
        <h2>Biz kimiz?</h2>
        <div class="blue-line"></div>
        <p>
          Biz eğitimdeki imkansızlıkları ortadan kaldırmayı misyon edinmiş bir topluluğuz. Amacımız, her çocuğun kaliteli
          eğitime erişimini sağlamak ve öğrenme süreçlerini Gazi Mustafa Kemal Atatürk önderliğinde desteklemektir. Yenilikçi çözümlerimizle, eğitimde fırsat
          eşitliği yaratmayı hedefliyoruz.
        </p>
        <div class="sg-sign">
          <strong>Türkay Şentürk</strong>
          <span>Eduty Kurucusu</span>
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

const formatTime = (value) => {
  return value < 10 ? `0${value}` : value
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
/* --- HERO SECTION --- */
/* --- HERO SECTION --- */
.hero {
  height: 100vh; /* Tam ekran yüksekliği */
  background-image: url('/img/ana_sayfa_fotoğrafı.png');
  
  /* --- GÜNCELLENEN KISIM --- */
  background-size: cover; /* Boşluk bırakmadan ekranı tamamen kaplar */
  background-position: center top; /* Fotoğrafın en üstünü (yazıyı ve başları) merkeze alır */
  background-repeat: no-repeat;
  /* ---------------------- */

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
  background: rgba(0, 0, 0, 0.4); /* Biraz daha şeffaf yaptık ki foto görünsün */
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
  font-size: 2rem; /* Sloganı biraz büyüttük */
  color: #fff;
  font-weight: 300;
  margin-top: 20px;
  text-shadow: 1px 1px 5px rgba(0,0,0,0.8);
}

/* --- INFO SECTION (SİYAH ALAN) --- */
.info-section {
  background-color: #000000; /* Simsiyah arka plan */
  color: #ffffff;
  padding: 80px 20px; /* Üstten ve alttan boşluk */
  display: flex;
  justify-content: center;
  text-align: center;
}

.welcome-text {
  max-width: 800px; /* Yazı çok yayılmasın */
}

.welcome-text h2 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  font-family: 'Times New Roman', Times, serif;
  color: white;
}

.blue-line {
  width: 60px;
  height: 4px;
  background: #274a90; /* logo mavisinde çizgi */
  margin: 0 auto 30px;
}

.welcome-text p {
  font-size: 1.2rem;
  line-height: 1.8;
  color: #cccccc; /* Hafif gri metin okunabilirliği artırır */
}

.sg-sign {
  margin-top: 50px;
  font-style: italic;
  color: #888;
}

.sg-sign strong {
  display: block;
  color: white;
  font-size: 1.2rem;
  margin-bottom: 5px;
  font-style: normal;
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