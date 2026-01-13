<template>
  <div class="layout-container">
    <nav :class="{ 'scrolled': isScrolled, 'mobile-menu-open': isMenuOpen }">
      <div class="nav-content">

        <div class="logo">
          <NuxtLink to="/" @click="closeMenu">
            <img src="/img/eduty_logo.png" alt="Eduty Logo" class="nav-logo" />
            <div class="eduty-text">
              <span>e</span><span>d</span><span>u</span><span>t</span><span>y</span>
            </div>
          </NuxtLink>
        </div>

        <button class="hamburger-btn" @click="toggleMenu" :class="{ 'active': isMenuOpen }" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>

        <div class="links" :class="{ 'nav-active': isMenuOpen }">
          <NuxtLink to="/" @click="closeMenu">Ana Sayfa</NuxtLink>
          <NuxtLink to="/hakkimizda" @click="closeMenu">Hakkımızda</NuxtLink>
          <NuxtLink to="/S.S.S." @click="closeMenu">S.S.S.</NuxtLink>
          <NuxtLink to="/iletisim" @click="closeMenu">İletişim</NuxtLink>

          <div class="nav-actions">
            <NuxtLink to="/destek_ol" class="apply-btn support-btn" @click="closeMenu">Destek Ol</NuxtLink>

            <template v-if="!user">
              <NuxtLink to="/kayit-giris" class="apply-btn" @click="closeMenu">Kayıt / Giriş</NuxtLink>
            </template>
            <template v-else>
              <button class="apply-btn logout-btn" @click="handleLogout">Çıkış Yap</button>
            </template>
          </div>
        </div>
      </div>
    </nav>

    <div class="page-content">
      <slot />
    </div>

    <footer>
      <div class="footer-content">
        <h3>Eduty - Herkes için eğitim.</h3>
        <p>Eduty, öğrencilere ve genç profesyonellere kaliteli eğitim kaynakları sunmayı amaçlayan bir platformdur.</p>
        <div class="socials">
          <a href="https://instagram.com/eduty" target="_blank" aria-label="Instagram">
            <img src="/img/instagram-logo.png" alt="Instagram" />
          </a>
          <a href="mailto:info@eduty.com" aria-label="Email">
            <img src="/img/email-logo.png" alt="Email" />
          </a>
        </div>
        <p class="copyright">© 2026 Eduty. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { onAuthStateChanged, signOut } from "firebase/auth"; // Firebase importları

const isScrolled = ref(false)
const isMenuOpen = ref(false)
const route = useRoute()
const router = useRouter()
const { $auth } = useNuxtApp() // Plugin'den auth al

// Kullanıcı durumu
const user = ref(null)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
  document.body.style.overflow = isMenuOpen.value ? 'hidden' : ''
}

const closeMenu = () => {
  isMenuOpen.value = false
  document.body.style.overflow = ''
}

// ÇIKIŞ YAPMA FONKSİYONU
const handleLogout = async () => {
  try {
    await signOut($auth);
    closeMenu();
    router.push('/'); // Ana sayfaya yönlendir
  } catch (error) {
    console.error("Çıkış hatası:", error);
  }
}

watch(() => route.path, () => {
  closeMenu()
})

onMounted(() => {
  window.addEventListener('scroll', handleScroll);

  // Firebase Auth Durumunu Dinle
  // Kullanıcı giriş yaptığında veya çıktığında 'user' değişkenini günceller
  onAuthStateChanged($auth, (currentUser) => {
    user.value = currentUser;
  });
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  document.body.style.overflow = ''
})
</script>

<style scoped>
/* Mevcut stillerin aynen korunuyor */
/* Sadece .logout-btn için küçük bir ekleme yapabilirsin istersen */
.logout-btn {
  background-color: transparent;
  cursor: pointer;
  /* Apply-btn stillerini miras alır ama istersen kırmızı yapabilirsin: */
  /* border-color: #ff4444; color: #ff4444; */
}

/* --- TEMEL AYARLAR --- */
.layout-container {
  background-color: #050505;
  color: #ffffff;
  min-height: 100vh;
  font-family: 'Montserrat', sans-serif;
  overflow-x: hidden;
}

/* --- NAVBAR --- */
nav {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 9999;
  padding: 20px 0;
  transition: all 0.4s ease;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.8), transparent);

  clip-path: none !important;
  visibility: visible !important;
  opacity: 1 !important;
  height: auto !important;
}

nav.scrolled {
  background: rgba(0, 0, 0, 0.95);
  padding: 15px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  border-bottom: 1px solid #222;
}

.nav-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 05px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* --- LOGO --- */
.logo a {
  display: flex;
  align-items: center;
  gap: 15px;
  text-decoration: none;
  color: white;
  position: relative;
  z-index: 10002;
}

.nav-logo {
  height: 50px;
  width: auto;
  object-fit: contain;
  display: block;
  filter: drop-shadow(0 0 12px rgba(0, 85, 255, 0.5));
  transition: all 0.3s ease;
}

.logo a:hover .nav-logo {
  filter: drop-shadow(0 0 18px rgba(0, 85, 255, 0.7));
  transform: scale(1.05);
}

.eduty-text {
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: 1px;
  display: flex;
  gap: 1px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.eduty-text span:nth-child(1),
.eduty-text span:nth-child(2) {
  color: #0055ff;
  text-shadow: 0 0 10px rgb(0, 85, 255, 0.3);
}

.eduty-text span:nth-child(3),
.eduty-text span:nth-child(4),
.eduty-text span:nth-child(5) {
  color: #003bb0;
  text-shadow: 0 0 10px rgb(0, 59, 176, 0.3);
}

.logo a:hover .eduty-text span {
  filter: brightness(1.2);
}

.nav-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.support-btn {
  border-color: var(--primary-color) !important;
  color: var(--primary-color) !important;
}

.support-btn:hover {
  background: var(--primary-color) !important;
  color: white !important;
}

@media (max-width: 1030px) {
  .nav-actions {
    flex-direction: column;
    width: 100%;
    padding: 0 40px;
  }
}

/* --- LINK STİLLERİ --- */
.links a,
.links button {
  text-decoration: none;
  color: #ccc;
  font-size: 0.9rem;
  font-weight: 500;
  transition: 0.3s;
  background: none;
  border: none;
  font-family: inherit;
}

.links a:hover,
.links a.router-link-active,
.links button:hover {
  color: white;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
}

.apply-btn {
  border: 1px solid white !important;
  padding: 8px 20px !important;
  border-radius: 20px !important;
  cursor: pointer;
}

.apply-btn:hover {
  background: white !important;
  color: black !important;
}

/* =========================================
   MASAÜSTÜ GÖRÜNÜM (> 1030px)
   ========================================= */
@media (min-width: 1031px) {
  .hamburger-btn {
    display: none !important;
  }

  .links {
    display: flex !important;
    align-items: center;
    gap: 20px;
    position: static;
    background: transparent;
    height: auto;
    width: auto;
    transform: none;
  }
}

/* =========================================
   TABLET VE MOBİL (< 1030px)
   ========================================= */
@media (max-width: 1030px) {
  .hamburger-btn {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 30px;
    height: 22px;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    z-index: 10002;
    margin-left: 15px;
  }

  .hamburger-btn span {
    width: 100%;
    height: 3px;
    background-color: white;
    border-radius: 3px;
    transition: all 0.3s ease;
  }

  .hamburger-btn.active span:nth-child(1) {
    transform: translateY(9.5px) rotate(45deg);
  }

  .hamburger-btn.active span:nth-child(2) {
    opacity: 0;
  }

  .hamburger-btn.active span:nth-child(3) {
    transform: translateY(-9.5px) rotate(-45deg);
  }

  .links {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: fixed;
    top: 0;
    right: 0;
    height: 100vh;
    width: 100%;
    background-color: rgba(5, 5, 5, 0.98);
    backdrop-filter: blur(10px);
    z-index: 10001;
    gap: 30px;
    transform: translateX(100%);
    transition: transform 0.4s cubic-bezier(0.77, 0, 0.175, 1);
  }

  .links.nav-active {
    transform: translateX(0);
  }

  .links a,
  .links button {
    font-size: 1.5rem;
    color: white;
    margin: 0;
  }

  .apply-btn {
    margin-top: 20px;
    padding: 15px 40px !important;
    font-size: 1.2rem !important;
  }
}

/* =========================================
   ÇOK KÜÇÜK EKRANLAR (< 480px)
   ========================================= */
@media (max-width: 480px) {
  .nav-content {
    padding: 0 15px;
  }

  .eduty-text {
    font-size: 1.5rem;
  }

  .nav-logo {
    height: 32px;
  }

  .logo a {
    gap: 8px;
  }
}

/* FOOTER */
footer {
  background: #000;
  border-top: 1px solid #222;
  padding: 3rem 1rem;
  text-align: center;
  margin-top: auto;
}

.footer-content h3 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.footer-content p {
  color: #666;
  font-size: 0.9rem;
}

.socials {
  margin: 1.5rem 0;
}

.socials a {
  margin: 0 10px;
}

.copyright {
  margin-top: 2rem;
  font-size: 0.8rem;
  color: #444;
}
</style>