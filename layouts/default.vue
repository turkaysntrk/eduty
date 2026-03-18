<template>
  <div class="layout-container">
    <nav v-if="!isDashboard" :class="{ 'scrolled': isScrolled, 'mobile-menu-open': isMenuOpen }">
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
          <NuxtLink to="/biz-kimiz" @click="closeMenu">Biz Kimiz?</NuxtLink>
          <NuxtLink to="/S.S.S." @click="closeMenu">S.S.S.</NuxtLink>
          <NuxtLink to="/iletisim" @click="closeMenu">İletişim</NuxtLink>

          <div class="nav-actions">
            <NuxtLink v-if="userRole !== 'donor'" to="/destek_ol" class="apply-btn support-btn" @click="closeMenu">
              Destek Ol
            </NuxtLink>

            <template v-if="!user">
              <NuxtLink to="/kayit-giris" class="apply-btn" @click="closeMenu">Kayıt / Giriş</NuxtLink>
            </template>

            <div v-else class="user-dropdown-wrapper">
              <button @click="toggleDropdown" class="user-account-btn">
                Hesap, {{ user.customName || user.displayName?.split(' ')[0] || formatRoleName(userRole) }} ▼
              </button>

              <div v-if="isDropdownOpen" class="dropdown-menu">
                <button @click="goToDashboard" class="dropdown-item">
                  <span v-if="userRole === 'teacher'">🎓 Öğretmen Paneli</span>
                  <span v-else-if="userRole === 'student'">📊 Çalışma Ortamı</span>
                  <span v-else-if="userRole === 'donor'">❤️ Bağışçı Paneli</span>
                  <span v-else>📊 Panele Git</span>
                </button>
                <div class="dropdown-divider"></div>
                <button @click="handleLogout" class="dropdown-item logout-text">
                  🚪 Çıkış Yap
                </button>
              </div>
            </div>
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
          <a href="https://instagram.com/eduty.app" target="_blank" aria-label="Instagram">
            <img src="/img/instagram_logo.png" alt="Instagram" />
          </a>
          <a href="mailto:eduty.offical@gmail.com" aria-label="Email">
            <img src="/img/email-logo.png" alt="Email" />
          </a>
        </div>
        <p class="copyright">© 2026 Eduty. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { onAuthStateChanged, signOut } from "firebase/auth";

const isScrolled = ref(false)
const isMenuOpen = ref(false)
const isDropdownOpen = ref(false)
const userRole = ref(null)

const route = useRoute()
const router = useRouter()
const { $auth } = useNuxtApp()

const user = ref(null)

// --- YENİ EKLENEN KISIM: Dashboard kontrolü ---
const isDashboard = computed(() => {
  return route.path.includes('/dashboard');
});
// ----------------------------------------------

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
  document.body.style.overflow = isMenuOpen.value ? 'hidden' : ''
}

const closeMenu = () => {
  isMenuOpen.value = false
  isDropdownOpen.value = false
  document.body.style.overflow = ''
}

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const formatRoleName = (role) => {
  if (role === 'teacher') return 'Öğretmen';
  if (role === 'student') return 'Öğrenci';
  if (role === 'donor') return 'Bağışçı';
  if (role === 'admin') return 'Admin';
  return 'Hesap';
}

const goToDashboard = () => {
  if (userRole.value === 'teacher') {
    router.push('/dashboard-teacher')
  } else if (userRole.value === 'donor') {
    router.push('/dashboard-bagisci')
  } else if (userRole.value === 'admin') {
    router.push('/dashboard-admin')
  } else {
    router.push('/dashboard')
  }
  isDropdownOpen.value = false
  closeMenu()
}

const handleLogout = async () => {
  try {
    localStorage.removeItem('userRole');
    await signOut($auth);
    isDropdownOpen.value = false
    user.value = null;
    userRole.value = null;
    closeMenu();
    router.push('/');
  } catch (error) {
    console.error("Çıkış hatası:", error);
  }
}

watch(() => route.path, () => {
  closeMenu()
})

onMounted(() => {
  window.addEventListener('scroll', handleScroll);

  onAuthStateChanged($auth, async (currentUser) => {
    user.value = currentUser;
    if (currentUser) {
      try {
        const { getFirestore, doc, getDoc } = await import('firebase/firestore');
        const db = getFirestore();

        const savedRole = localStorage.getItem('userRole');

        if (savedRole) {
          userRole.value = savedRole;
          if (savedRole === 'donor' && !currentUser.displayName) {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              user.value.customName = data.firstName + ' ' + data.lastName;
            }
          }
        } else {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            userRole.value = data.role;
            localStorage.setItem('userRole', userRole.value);
            if (data.role === 'donor') {
              user.value.customName = data.firstName + ' ' + data.lastName;
            }
          }
        }
      } catch (error) {
        console.error("Kullanıcı verisi çekilemedi:", error);
      }
    } else {
      userRole.value = null;
    }
  });
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  document.body.style.overflow = ''
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');

/* ===== LAYOUT ===== */
.layout-container {
  background-color: #050a14;
  color: #ffffff;
  min-height: 100vh;
  font-family: 'DM Sans', sans-serif;
  overflow-x: hidden;
}

/* ===== NAV ===== */
nav {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 9999;
  padding: 18px 0;
  transition: all 0.4s ease;
  background: linear-gradient(to bottom, rgba(5, 10, 20, 0.85), transparent);
  clip-path: none !important;
  visibility: visible !important;
  opacity: 1 !important;
  height: auto !important;
}

nav.scrolled {
  background: rgba(5, 10, 30, 0.97);
  padding: 12px 0;
  box-shadow: 0 4px 24px rgba(0, 50, 180, 0.25);
  border-bottom: 1px solid rgba(56, 189, 248, 0.12);
  backdrop-filter: blur(16px);
}

.nav-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* ===== LOGO ===== */
.logo a {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: white;
  position: relative;
  z-index: 10002;
}

.nav-logo {
  height: 44px;
  width: auto;
  object-fit: contain;
  display: block;
  filter: drop-shadow(0 0 10px rgba(26, 107, 255, 0.6));
  transition: all 0.3s ease;
}

.logo a:hover .nav-logo {
  filter: drop-shadow(0 0 18px rgba(56, 189, 248, 0.8));
  transform: scale(1.05);
}

.eduty-text {
  font-size: 1.9rem;
  font-weight: 800;
  letter-spacing: 2px;
  display: flex;
  gap: 1px;
  font-family: 'DM Sans', sans-serif;
}

.eduty-text span:nth-child(1),
.eduty-text span:nth-child(2) {
  color: #4d94ff;
  text-shadow: 0 0 12px rgba(77, 148, 255, 0.5);
}

.eduty-text span:nth-child(3),
.eduty-text span:nth-child(4),
.eduty-text span:nth-child(5) {
  color: #38bdf8;
  text-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
}

.logo a:hover .eduty-text span {
  filter: brightness(1.25);
}

/* ===== NAV LİNKLER ===== */
.links a,
.links button {
  text-decoration: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.88rem;
  font-weight: 500;
  transition: 0.3s;
  background: none;
  border: none;
  font-family: 'DM Sans', sans-serif;
  padding: 5px 8px;
  border-radius: 6px;
  cursor: pointer;
}

.links a:hover,
.links a.router-link-active,
.links button:hover {
  color: white;
  background: rgba(56, 189, 248, 0.1);
}

.links a.router-link-active {
  color: #38bdf8;
}

/* ===== NAV BUTONLAR ===== */
.nav-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.apply-btn {
  border: 1.5px solid rgba(255, 255, 255, 0.35) !important;
  padding: 7px 18px !important;
  border-radius: 20px !important;
  cursor: pointer;
  font-size: 0.88rem !important;
  transition: all 0.3s ease !important;
}

.apply-btn:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: white !important;
  color: white !important;
}

.support-btn {
  border-color: rgba(56, 189, 248, 0.5) !important;
  color: #38bdf8 !important;
}

.support-btn:hover {
  background: rgba(56, 189, 248, 0.15) !important;
  border-color: #38bdf8 !important;
  color: white !important;
}

/* ===== DROPDOWN ===== */
.user-dropdown-wrapper {
  position: relative;
  display: inline-block;
}

.user-account-btn {
  background: rgba(255, 255, 255, 0.06);
  color: white;
  border: 1.5px solid rgba(56, 189, 248, 0.3);
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.88rem;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: 0.3s;
}

.user-account-btn:hover {
  background: rgba(56, 189, 248, 0.1);
  border-color: #38bdf8;
}

.dropdown-menu {
  position: absolute;
  top: 120%;
  right: 0;
  width: 210px;
  background: rgba(10, 18, 40, 0.98);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 14px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 36px rgba(0, 30, 100, 0.5);
  backdrop-filter: blur(16px);
  z-index: 10005;
}

.dropdown-item {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.75);
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: 'DM Sans', sans-serif;
  transition: 0.2s;
}

.dropdown-item:hover {
  background: rgba(56, 189, 248, 0.1);
  color: white;
}

.dropdown-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 5px 0;
}

.logout-text { color: #ff6b6b; }
.logout-text:hover { background: rgba(255, 68, 68, 0.1) !important; }

/* ===== HAMBURGERr ===== */
@media (min-width: 1031px) {
  .hamburger-btn { display: none !important; }

  .links {
    display: flex !important;
    align-items: center;
    gap: 6px;
    position: static;
    background: transparent;
    height: auto;
    width: auto;
    transform: none;
  }
}

@media (max-width: 1030px) {
  .nav-actions {
    flex-direction: column;
    width: 100%;
    padding: 0 40px;
  }

  .user-dropdown-wrapper {
    width: 100%;
    text-align: center;
    margin-top: 20px;
  }

  .user-account-btn {
    width: 100%;
    justify-content: center;
    font-size: 1.1rem;
    padding: 14px;
  }

  .dropdown-menu {
    position: static;
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    margin-top: 10px;
  }

  .hamburger-btn {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 28px;
    height: 20px;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    z-index: 10002;
    margin-left: 15px;
  }

  .hamburger-btn span {
    width: 100%;
    height: 2.5px;
    background-color: white;
    border-radius: 3px;
    transition: all 0.3s ease;
  }

  .hamburger-btn.active span:nth-child(1) { transform: translateY(8.75px) rotate(45deg); }
  .hamburger-btn.active span:nth-child(2) { opacity: 0; }
  .hamburger-btn.active span:nth-child(3) { transform: translateY(-8.75px) rotate(-45deg); }

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
    background: rgba(5, 10, 25, 0.99);
    backdrop-filter: blur(16px);
    z-index: 10001;
    gap: 28px;
    transform: translateX(100%);
    transition: transform 0.4s cubic-bezier(0.77, 0, 0.175, 1);
  }

  .links.nav-active { transform: translateX(0); }

  .links a, .links button { font-size: 1.4rem; color: white; margin: 0; }

  .apply-btn {
    margin-top: 16px;
    padding: 14px 40px !important;
    font-size: 1.1rem !important;
  }
}

@media (max-width: 480px) {
  .nav-content { padding: 0 16px; }
  .eduty-text { font-size: 1.5rem; }
  .nav-logo { height: 34px; }
  .logo a { gap: 8px; }
}

/* ===== FOOTER ===== */
footer {
  background: linear-gradient(160deg, #060d1f 0%, #0a1628 100%);
  border-top: 1px solid rgba(56, 189, 248, 0.15);
  padding: 3.5rem 1rem 2rem;
  text-align: center;
  margin-top: auto;
}

.footer-content h3 {
  font-family: 'Playfair Display', serif;
  font-size: 1.3rem;
  color: #38bdf8;
  margin-bottom: 0.75rem;
  letter-spacing: 0.5px;
}

.footer-content p {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.88rem;
  line-height: 1.6;
  max-width: 420px;
  margin: 0 auto;
}

.socials {
  margin: 1.75rem 0 1rem;
  display: flex;
  justify-content: center;
  gap: 14px;
}

.socials a {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(56, 189, 248, 0.2);
  transition: all 0.3s ease;
}

.socials a img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.socials a:hover {
  transform: translateY(-3px);
  background: rgba(56, 189, 248, 0.15);
  border-color: #38bdf8;
  box-shadow: 0 6px 20px rgba(56, 189, 248, 0.2);
}

.copyright {
  margin-top: 1.75rem;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.2);
}
</style>