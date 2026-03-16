<template>
  <div class="contact-page">
    
    <section class="contact-header">
      <h1 class="page-title">İletişim</h1>
      <div class="blue-line"></div>
      <p class="subtitle">
        Görüşleriniz, önerileriniz veya destek talepleriniz için bize ulaşın. <br>
        Eğitimin geleceğini birlikte inşa edelim.
      </p>
    </section>

    <div class="content-wrapper">
      
      <div class="contact-info-card">
        <h3>Bize Ulaşın</h3>
        <p class="info-desc">
          Aşağıdaki kanallardan bize doğrudan ulaşabilir veya yan taraftaki formu doldurarak mesaj bırakabilirsiniz.
        </p>

        <div class="info-item">
          <div class="icon-box">
            <img src="/img/email-logo.png" alt="Email" />
          </div>
          <div>
            <h4>E-posta</h4>
            <a href="mailto:info@eduty.com">info@eduty.com</a>
          </div>
        </div>

        <div class="info-item">
          <div class="icon-box">
            <img src="/img/instagram_logo.png" alt="Instagram" />
          </div>
          <div>
            <h4>Sosyal Medya</h4>
            <a href="https://instagram.com/eduty" target="_blank">@eduty</a>
          </div>
        </div>

        <div class="info-footer">
          <p>"Her çocuk kaliteli eğitimi hak eder."</p>
        </div>
      </div>

      <form class="contact-form" @submit.prevent="submitForm">
        <h3>Mesaj Gönderin</h3>
        
        <div class="form-group">
          <label for="name">Adınız Soyadınız</label>
          <input 
            type="text" 
            id="name" 
            v-model="form.name" 
            placeholder="Örn: Ahmet Yılmaz" 
            required
          />
        </div>

        <div class="form-group">
          <label for="email">E-posta Adresiniz</label>
          <input 
            type="email" 
            id="email" 
            v-model="form.email" 
            placeholder="ornek@email.com" 
            required
          />
        </div>

        <div class="form-group">
          <label for="subject">Konu</label>
          <select id="subject" v-model="form.subject">
            <option>Genel Bilgi</option>
            <option>Destek Olmak İstiyorum</option>
            <option>Teknik Sorun</option>
            <option>Diğer</option>
          </select>
        </div>

        <div class="form-group">
          <label for="message">Mesajınız</label>
          <textarea 
            id="message" 
            v-model="form.message" 
            rows="5" 
            placeholder="Mesajınızı buraya yazınız..." 
            required
          ></textarea>
        </div>

        <button type="submit" class="submit-btn" :disabled="isLoading">
          {{ isLoading ? 'GÖNDERİLİYOR...' : 'GÖNDER' }}
        </button>

        <transition name="fade">
          <p v-if="statusMessage" :class="['status-msg', statusType]">
            {{ statusMessage }}
          </p>
        </transition>
      </form>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useNuxtApp } from '#app'
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore"

const form = ref({
  name: '',
  email: '',
  subject: 'Genel Bilgi',
  message: ''
})

const isLoading = ref(false)
const statusMessage = ref('')
const statusType = ref('')

// ── Basit input temizleme ──
const sanitize = (str) => {
  if (!str || typeof str !== 'string') return ''
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim()
    .slice(0, 1000)
}

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254

// ── Rate limit: 60 saniyede max 3 mesaj ──
const checkRateLimit = () => {
  const key = 'rl_contact'
  const now = Date.now()
  const windowMs = 60000
  const maxReq = 3
  let data = { requests: [] }
  try {
    const stored = sessionStorage.getItem(key)
    if (stored) data = JSON.parse(stored)
  } catch (e) {}
  data.requests = data.requests.filter(t => now - t < windowMs)
  if (data.requests.length >= maxReq) {
    const wait = Math.ceil((windowMs - (now - data.requests[0])) / 1000)
    return { allowed: false, wait }
  }
  data.requests.push(now)
  try { sessionStorage.setItem(key, JSON.stringify(data)) } catch (e) {}
  return { allowed: true, wait: 0 }
}

const submitForm = async () => {
  isLoading.value = true
  statusMessage.value = ''

  // Rate limit kontrolü
  const limit = checkRateLimit()
  if (!limit.allowed) {
    statusType.value = 'error'
    statusMessage.value = `Çok fazla istek gönderdiniz. ${limit.wait} saniye bekleyin.`
    isLoading.value = false
    return
  }

  // Input doğrulama
  if (!form.value.name.trim() || form.value.name.trim().length < 2) {
    statusType.value = 'error'
    statusMessage.value = 'Lütfen geçerli bir isim girin.'
    isLoading.value = false
    return
  }

  if (!validateEmail(form.value.email)) {
    statusType.value = 'error'
    statusMessage.value = 'Lütfen geçerli bir e-posta adresi girin.'
    isLoading.value = false
    return
  }

  if (!form.value.message.trim() || form.value.message.trim().length < 10) {
    statusType.value = 'error'
    statusMessage.value = 'Mesajınız en az 10 karakter olmalıdır.'
    isLoading.value = false
    return
  }

  try {
    const db = getFirestore()
    await addDoc(collection(db, "messages"), {
      name: sanitize(form.value.name),
      email: sanitize(form.value.email),
      subject: sanitize(form.value.subject),
      message: sanitize(form.value.message),
      createdAt: serverTimestamp()
    })

    statusType.value = 'success'
    statusMessage.value = 'Mesajınız başarıyla iletildi. Teşekkür ederiz!'
    form.value = { name: '', email: '', subject: 'Genel Bilgi', message: '' }

  } catch (error) {
    console.error("Firebase Hatası:", error)
    statusType.value = 'error'
    statusMessage.value = 'Bir hata oluştu, mesaj gönderilemedi. Lütfen tekrar deneyin.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* --- GENEL SAYFA YAPISI --- */
.contact-page {
  background-color: #050505;
  color: white;
  min-height: 100vh;
  padding-top: 120px;
  padding-bottom: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* --- HEADER ALANI --- */
.contact-header {
  text-align: center;
  margin-bottom: 60px;
  padding: 0 20px;
}

.page-title {
  font-family: 'Times New Roman', Times, serif;
  font-size: 3rem;
  color: white;
  margin-bottom: 10px;
}

.blue-line {
  width: 80px;
  height: 4px;
  background: #274a90;
  margin: 0 auto 20px;
  border-radius: 2px;
}

.subtitle {
  color: #cccccc;
  font-size: 1.1rem;
  line-height: 1.6;
  font-family: 'Montserrat', sans-serif;
}

/* --- İÇERİK IZGARASI (GRID) --- */
.content-wrapper {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 40px;
  max-width: 1200px;
  width: 90%;
}

/* --- SOL TARAFTAKİ BİLGİ KARTI --- */
.contact-info-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 40px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.contact-info-card h3 {
  font-family: 'Times New Roman', Times, serif;
  font-size: 1.8rem;
  margin-bottom: 10px;
  color: #fff;
}

.info-desc {
  color: #aaa;
  font-size: 0.95rem;
  line-height: 1.6;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.icon-box {
  width: 50px;
  height: 50px;
  background: rgba(0, 85, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 85, 255, 0.3);
}

.icon-box img {
  width: 24px;
  height: 24px;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

.info-item h4 {
  font-size: 0.9rem;
  color: #888;
  margin-bottom: 2px;
}

.info-item a {
  color: #fff;
  font-weight: 600;
  text-decoration: none;
  font-size: 1.1rem;
  transition: color 0.3s;
}

.info-item a:hover {
  color: #0055ff;
}

.info-footer {
  margin-top: auto;
  border-top: 1px solid rgba(255,255,255,0.1);
  padding-top: 20px;
  font-style: italic;
  color: #666;
}

/* --- SAĞ TARAFTAKİ FORM --- */
.contact-form {
  background: #000;
  border: 1px solid #222;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

.contact-form h3 {
  font-family: 'Times New Roman', Times, serif;
  font-size: 1.8rem;
  margin-bottom: 30px;
  color: white;
}

.form-group {
  margin-bottom: 25px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #ccc;
  font-size: 0.9rem;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  background-color: #111;
  border: 1px solid #333;
  padding: 15px;
  color: white;
  border-radius: 6px;
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #0055ff;
  background-color: #161616;
  box-shadow: 0 0 0 4px rgba(0, 85, 255, 0.1);
}

/* Submit Butonu */
.submit-btn {
  width: 100%;
  padding: 15px;
  background: linear-gradient(135deg, #003bb0 0%, #0055ff 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 1px;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 85, 255, 0.4);
}

.submit-btn:disabled {
  background: #333;
  cursor: not-allowed;
  transform: none;
}

/* --- BİLDİRİM MESAJLARI (YENİ EKLENEN KISIM) --- */
.status-msg {
  margin-top: 20px;
  padding: 12px;
  border-radius: 6px;
  font-weight: 500;
  text-align: center;
}

.status-msg.success {
  background-color: rgba(0, 200, 80, 0.1);
  color: #00ff88;
  border: 1px solid #00ff88;
}

.status-msg.error {
  background-color: rgba(255, 68, 68, 0.1);
  color: #ff4444;
  border: 1px solid #ff4444;
}

/* Transition Efektleri (fade) */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* RESPONSIVE TASARIM */
@media (max-width: 900px) {
  .content-wrapper {
    grid-template-columns: 1fr;
    gap: 30px;
  }
  
  .contact-info-card {
    padding: 30px;
  }
}

@media (max-width: 600px) {
  .page-title {
    font-size: 2.2rem;
  }
  
  .contact-form {
    padding: 25px;
  }
}

</style>