<script setup>
// Bu sayfa Firebase auth kullandığı için SSR kapatılmıştır
definePageMeta({ ssr: false })

import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const particlesBg = ref(null)

onMounted(() => {
  // Parçacıkları oluştur
  const container = particlesBg.value
  if (!container) return
  for (let i = 0; i < 22; i++) {
    const p = document.createElement('div')
    p.className = 'particle'
    const size = Math.random() * 3 + 1.5
    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}%;
      bottom: ${Math.random() * 10}%;
      animation-duration: ${4 + Math.random() * 6}s;
      animation-delay: ${Math.random() * 6}s;
    `
    container.appendChild(p)
  }
})
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,  
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const router = useRouter();
const { $auth } = useNuxtApp(); 
let db  // Firebase SSR fix: initialized lazily on first use

// GÖRÜNÜM KONTROLLERİ
const currentView = ref('login');
const registerStep = ref(1); 
const selectedRole = ref(null); 

// ORTAK FORM VERİLERİ (Giriş)
const loginForm = reactive({
  identity: '',
  password: '',
  rememberMe: false
});

// ÖĞRENCİ KAYIT FORMU
const studentForm = reactive({
  email: '',
  password: '',
  passwordConfirm: '',
  grade: '',
  city: '',
  district: '',
  schoolName: ''
});

// ÖĞRETMEN KAYIT FORMU
const teacherForm = reactive({
  email: '',
  password: '',
  passwordConfirm: '',
  branch: '',          
  educationLevel: '',  
  workStatus: '',
  city: '',
  district: '',
  schoolName: '',
  certificateFile: null
});

// --- YARDIMCI FONKSİYONLAR ---
const resetRegister = () => {
  registerStep.value = 1;
  selectedRole.value = null;
};

// --- GİRİŞ İŞLEMLERİ ---
const handleLogin = async () => {
  try {
    const persistenceType = loginForm.rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence($auth, persistenceType);
    
    const userCredential = await signInWithEmailAndPassword($auth, loginForm.identity, loginForm.password);
    const user = userCredential.user;

    // Firestore'dan kullanıcının rolünü çekiyoruz
    const { getFirestore, doc, getDoc } = await import("firebase/firestore");
    const db = getFirestore()
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (userDoc.exists()) {
      const userData = userDoc.data();
      // Role göre otomatik yönlendirme
      if (userData.role === 'student') {
        router.push('/dashboard');
      } else if (userData.role === 'teacher') {
        router.push('/dashboard-teacher');
      } else if (userData.role === 'donor') {
        router.push('/destek_ol');
      } else if (userData.role === 'admin') {
        router.push('/dashboard-admin');
      }
    } else {
      router.push('/'); // Rol bulunamazsa ana sayfaya
    }
  } catch (error) {
    alert("Giriş başarısız: " + error.message);
  }
};

// --- KAYIT İŞLEMLERİ ---
const handleRegister = async () => {
  let formToUse = selectedRole.value === 'student' ? studentForm : teacherForm;

  if (formToUse.password !== formToUse.passwordConfirm) {
    alert("Parolalar eşleşmiyor!");
    return;
  }
  if (formToUse.password.length < 6) {
    alert("Parola en az 6 karakter olmalıdır.");
    return;
  }
  if (selectedRole.value === 'teacher' && !teacherForm.certificateFile) {
    alert("Lütfen öğretmenlik belgenizi veya diplomanızı yükleyin.");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword($auth, formToUse.email, formToUse.password);
    const user = userCredential.user;
    
    let userData = {
      email: formToUse.email,
      role: selectedRole.value,
      createdAt: new Date().toISOString()
    };

    if (selectedRole.value === 'student') {
      Object.assign(userData, {
        grade: studentForm.grade,
        city: studentForm.city,
        district: studentForm.district,
        schoolName: studentForm.schoolName
      });
    } else if (selectedRole.value === 'teacher') {
      Object.assign(userData, {
        branch: teacherForm.branch,
        educationLevel: teacherForm.educationLevel,
        workStatus: teacherForm.workStatus,
        city: teacherForm.city || '', 
        district: teacherForm.district || '',
        schoolName: teacherForm.schoolName || ''
      });
    }

    if (!db) db = getFirestore()
    await setDoc(doc(db, "users", user.uid), userData);
    
    await $auth.signOut(); 
    alert("Kayıt başarılı! Giriş ekranına yönlendiriliyorsunuz.");
    
    currentView.value = 'login';
    resetRegister();

  } catch (error) {
    console.error("Kayıt hatası:", error);
    alert("Kayıt hatası: " + error.message);
  }
};

const handleFileUpload = (event) => {
  teacherForm.certificateFile = event.target.files[0];
};

const handleForgot = async () => {
  if (!loginForm.identity.includes('@')) {
    alert("Lütfen geçerli bir e-posta adresi girin.");
    return;
  }
  try {
    await sendPasswordResetEmail($auth, loginForm.identity);
    alert("Sıfırlama e-postası gönderildi.");
    currentView.value = 'login';
  } catch (error) {
    alert("Hata: " + error.message);
  }
};
</script>

<template>
  <div class="auth-page">
    <div class="particles-bg" ref="particlesBg"></div>
    <div class="auth-container">
      
      <div v-if="currentView === 'login'" class="auth-box">
        <div class="brand-header">
          <img src="/img/eduty_logo.png" alt="Logo" class="site-logo" />
          <div class="eduty-text">
            <span>e</span><span>d</span><span>u</span><span>t</span><span>y</span>
          </div>
        </div>

        <h1>Giriş Yap</h1>
        <p class="subtitle">Hoş geldin! Seni tekrar görmek ne güzel.</p>
        
        <form @submit.prevent="handleLogin">
          <div class="input-group">
            <input v-model="loginForm.identity" type="text" placeholder="E-posta" required />
          </div>
          <div class="input-group">
            <input v-model="loginForm.password" type="password" placeholder="Parola" required />
          </div>
          
          <div class="login-options">
            <label class="remember-me">
              <input v-model="loginForm.rememberMe" type="checkbox" />
              <span>Beni Hatırla</span>
            </label>
            <a href="#" @click.prevent="currentView = 'forgot'" class="forgot-link">Parolamı unuttum?</a>
          </div>

          <button type="submit" class="btn-primary">Giriş Yap</button>
        </form>
        
        <div class="auth-footer">
          <p class="switch-text">
            Hesabın yok mu?
            <a href="#" @click.prevent="currentView = 'register'">Hemen kayıt ol</a>
          </p>
          <p class="support-text">
            Destek mi olmak istiyorsun? 
            <NuxtLink to="/destek_ol">Bağışçı Ol</NuxtLink>
          </p>
        </div>
      </div>

      <div v-else-if="currentView === 'register'" class="auth-box register-box">
        <div class="brand-header">
          <img src="/img/eduty_logo.png" alt="Logo" class="site-logo" />
          <div class="eduty-text">
            <span>e</span><span>d</span><span>u</span><span>t</span><span>y</span>
          </div>
        </div>

        <div v-if="registerStep === 1">
          <h1>Kayıt Türü Seçin</h1>
          <p class="subtitle">Size en uygun deneyimi sunabilmemiz için lütfen seçin.</p>
          
          <div class="role-selector">
            <button class="role-card" @click="selectedRole = 'student'; registerStep = 2">
              <span class="role-icon">🎓</span>
              <h3>Öğrenciyim</h3>
              <p>Ders kaynaklarına ulaşmak istiyorum.</p>
            </button>

            <button class="role-card" @click="selectedRole = 'teacher'; registerStep = 2">
              <span class="role-icon">👩‍🏫</span>
              <h3>Öğretmenim</h3>
              <p>İçerik üretmek ve ders vermek istiyorum.</p>
            </button>
          </div>

          <div class="auth-footer">
            <p class="switch-text">
              Zaten hesabın var mı?
              <a href="#" @click.prevent="currentView = 'login'">Giriş yap</a>
            </p>
            <p class="support-text">
              Destek mi olmak istiyorsun? 
              <NuxtLink to="/destek_ol">Bağışçı Ol</NuxtLink>
            </p>
          </div>
        </div>

        <div v-else>
          <h1>{{ selectedRole === 'student' ? 'Öğrenci Kaydı' : 'Öğretmen Kaydı' }}</h1>
          <p class="subtitle">Bilgilerini doldur ve aramıza katıl.</p>
          
          <form @submit.prevent="handleRegister">
            
            <div class="input-row">
              <input 
                v-if="selectedRole === 'student'" v-model="studentForm.email" 
                type="email" placeholder="E-posta Adresi" required 
              />
              <input 
                v-else v-model="teacherForm.email" 
                type="email" placeholder="E-posta Adresi" required 
              />
            </div>

            <div class="input-row two-col">
              <input 
                v-if="selectedRole === 'student'" v-model="studentForm.password" 
                type="password" placeholder="Parola" required 
              />
              <input 
                v-else v-model="teacherForm.password" 
                type="password" placeholder="Parola" required 
              />

              <input 
                v-if="selectedRole === 'student'" v-model="studentForm.passwordConfirm" 
                type="password" placeholder="Parola Tekrar" required 
              />
              <input 
                v-else v-model="teacherForm.passwordConfirm" 
                type="password" placeholder="Parola Tekrar" required 
              />
            </div>

            <div v-if="selectedRole === 'student'">
              <div class="input-group">
                <select v-model="studentForm.grade" required>
                  <option value="" disabled selected>Sınıf Seviyesi Seçin</option>
                  <option v-for="n in 12" :key="n" :value="n">{{ n }}. Sınıf</option>
                  <option value="mezun">Mezun</option>
                </select>
              </div>

              <div class="input-row two-col">
                <input v-model="studentForm.city" type="text" placeholder="İl" required />
                <input v-model="studentForm.district" type="text" placeholder="İlçe" required />
              </div>

              <div class="input-group">
                <input v-model="studentForm.schoolName" type="text" placeholder="Okul Adı" required />
              </div>
            </div>

            <div v-if="selectedRole === 'teacher'">
              <div class="input-row two-col">
                <select v-model="teacherForm.branch" required>
                  <option value="" disabled selected>Branş Seçiniz</option>
                  <option value="Türkçe">Türkçe</option>
                  <option value="Türk Dili ve Edebiyatı">Türk Dili ve Edebiyatı</option>
                  <option value="Matematik">Matematik</option>
                  <option value="Fen">Fen Bilimleri</option>
                  <option value="Fizik">Fizik</option>
                  <option value="Kimya">Kimya</option>
                  <option value="Biyoloji">Biyoloji</option>
                  <option value="Sosyal Bilgiler">Sosyal Bilgiler</option>
                  <option value="Tarih">Tarih</option>
                  <option value="Coğrafya">Coğrafya</option>
                  <option value="Felsefe">Felsefe</option>
                  <option value="DKAB">DKAB</option>
                  <option value="İngilizce">İngilizce</option>
                  <option value="Almanca">Almanca</option>
                </select>

                <select v-model="teacherForm.educationLevel" required>
                  <option value="" disabled selected>Eğitim Kademesi</option>
                  <option value="ilkokul">İlkokul</option>
                  <option value="ortaokul">Ortaokul</option>
                  <option value="lise">Lise</option>
                </select>
              </div>

              <div class="input-group">
                <select v-model="teacherForm.workStatus" required>
                  <option value="" disabled selected>Çalışma Durumu</option>
                  <option value="okul">Bir okulda çalışıyorum</option>
                  <option value="dershane">Bir dershanede/kurs merkezinde çalışıyorum</option>
                  <option value="none">Çalışmıyorum / Özel Ders Veriyorum</option>
                </select>
              </div>

              <div v-if="teacherForm.workStatus !== 'none' && teacherForm.workStatus !== ''">
                 <div class="input-row two-col">
                  <input v-model="teacherForm.city" type="text" placeholder="İl" required />
                  <input v-model="teacherForm.district" type="text" placeholder="İlçe" required />
                </div>
                <div class="input-group">
                  <input v-model="teacherForm.schoolName" type="text" placeholder="Kurum Adı" required />
                </div>
              </div>
               
              <div v-else-if="teacherForm.workStatus === 'none'">
                 <div class="input-row two-col">
                  <input v-model="teacherForm.city" type="text" placeholder="İl" required />
                  <input v-model="teacherForm.district" type="text" placeholder="İlçe" required />
                </div>
              </div>

              <div class="input-group file-group">
                <label>Öğretmenlik Belgesi / Diploma </label>
                <input type="file" @change="handleFileUpload" accept=".pdf,.jpg,.png" />
              </div>
            </div>

            <button type="submit" class="btn-primary">Kayıt Ol</button>
            <button type="button" class="btn-secondary" @click="registerStep = 1">Geri Dön</button>
          </form>

          <div class="auth-footer">
            <p class="switch-text">
              Zaten hesabın var mı?
              <a href="#" @click.prevent="currentView = 'login'">Giriş yap</a>
            </p>
          </div>
        </div>
      </div>

      <div v-else-if="currentView === 'forgot'" class="auth-box">
        <div class="brand-header">
          <img src="/img/eduty_logo.png" alt="Logo" class="site-logo" />
          <div class="eduty-text">
            <span>e</span><span>d</span><span>u</span><span>t</span><span>y</span>
          </div>
        </div>

        <h1>Şifre Yenileme</h1>
        <p class="subtitle">Bilgilerini gir, sana yardımcı olalım.</p>
        
        <form @submit.prevent="handleForgot">
          <div class="input-group">
            <input v-model="loginForm.identity" type="text" placeholder="E-posta adresini gir" required />
          </div>
          <button type="submit" class="btn-primary">Sıfırlama Bağlantısı Gönder</button>
        </form>
        
        <p class="switch-text">
          <a href="#" @click.prevent="currentView = 'login'">← Giriş ekranına dön</a>
        </p>
      </div>

    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');

/* Sayfa Genel Yapısı */
.auth-page {
  min-height: 100vh;
  padding: 90px 20px 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #060d1f, #0b1c42, #060d1f, #07152e, #0d1f4a, #060d1f);
  background-size: 400% 400%;
  animation: gradientShift 10s ease infinite;
  position: relative;
  overflow: hidden;
}

@keyframes gradientShift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Nokta deseni (sabit) */
.auth-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 1px 1px, rgba(56, 189, 248, 0.05) 1px, transparent 0);
  background-size: 36px 36px;
  pointer-events: none;
  z-index: 0;
}

/* Parçacık kapsayıcı */
.particles-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.particle {
  position: absolute;
  border-radius: 50%;
  background: rgba(56, 189, 248, 0.7);
  animation: floatUp linear infinite;
  opacity: 0;
}

@keyframes floatUp {
  0%   { transform: translateY(0) scale(1); opacity: 0; }
  10%  { opacity: 1; }
  85%  { opacity: 0.5; }
  100% { transform: translateY(-100vh) scale(0.3); opacity: 0; }
}

.auth-container {
  width: 100%;
  max-width: 460px;
  position: relative;
  z-index: 1;
}

.auth-box {
  background: rgba(10, 18, 45, 0.85);
  padding: 44px 34px;
  border-radius: 20px;
  border: 1px solid rgba(56, 189, 248, 0.15);
  box-shadow: 0 24px 64px rgba(0, 20, 80, 0.5);
  text-align: center;
  backdrop-filter: blur(16px);
}

.brand-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 28px;
}

.site-logo {
  height: 44px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 0 6px rgba(26, 107, 255, 0.35));
}

.eduty-text {
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: 2px;
  display: flex;
  gap: 1px;
  font-family: 'DM Sans', sans-serif;
}

.eduty-text span:nth-child(1),
.eduty-text span:nth-child(2) {
  color: #4d94ff;
  text-shadow: 0 0 10px rgba(77, 148, 255, 0.4);
}

.eduty-text span:nth-child(3),
.eduty-text span:nth-child(4),
.eduty-text span:nth-child(5) {
  color: #38bdf8;
  text-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
}

h1 {
  font-family: 'Playfair Display', serif;
  font-size: 1.75rem;
  margin-bottom: 8px;
  color: #ffffff;
  font-weight: 700;
}

.subtitle {
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.9rem;
  margin-bottom: 28px;
  font-family: 'DM Sans', sans-serif;
}

.input-group, .input-row {
  margin-bottom: 14px;
}

.input-row.two-col {
  display: flex;
  gap: 10px;
}

input, select {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1.5px solid rgba(56, 189, 248, 0.15);
  border-radius: 10px;
  color: white;
  font-size: 0.95rem;
  font-family: 'DM Sans', sans-serif;
  transition: 0.3s;
}

input::placeholder { color: rgba(255,255,255,0.3); }

input:focus, select:focus {
  outline: none;
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.06);
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.1);
}

select option { background: #0a1228; color: white; }

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  font-size: 0.88rem;
  color: rgba(255,255,255,0.55);
  font-family: 'DM Sans', sans-serif;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.remember-me input { width: auto; margin: 0; }

.btn-primary {
  width: 100%;
  padding: 13px;
  background: linear-gradient(135deg, #1a6bff, #0a4fd6);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.97rem;
  cursor: pointer;
  margin-top: 10px;
  transition: 0.3s;
  box-shadow: 0 4px 16px rgba(26, 107, 255, 0.35);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #38bdf8, #1a6bff);
  box-shadow: 0 6px 24px rgba(56, 189, 248, 0.4);
  transform: translateY(-1px);
}

.btn-secondary {
  width: 100%;
  padding: 11px;
  background: transparent;
  color: rgba(255,255,255,0.45);
  border: 1.5px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  margin-top: 10px;
  transition: 0.3s;
}

.btn-secondary:hover {
  border-color: rgba(255,255,255,0.35);
  color: rgba(255,255,255,0.8);
}

.role-selector {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 20px;
}

.role-card {
  background: rgba(255,255,255,0.03);
  border: 1.5px solid rgba(56, 189, 248, 0.12);
  padding: 20px;
  border-radius: 14px;
  cursor: pointer;
  transition: 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.role-card:hover {
  border-color: rgba(56, 189, 248, 0.5);
  background: rgba(26, 107, 255, 0.08);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(26, 107, 255, 0.2);
}

.role-icon { font-size: 2rem; margin-bottom: 10px; }

.role-card h3 {
  color: white;
  font-size: 1.05rem;
  margin-bottom: 5px;
  font-family: 'Playfair Display', serif;
}

.role-card p {
  color: rgba(255,255,255,0.45);
  font-size: 0.84rem;
  margin: 0;
  font-family: 'DM Sans', sans-serif;
}

.file-group { text-align: left; }

.file-group label {
  display: block;
  font-size: 0.84rem;
  color: rgba(255,255,255,0.45);
  margin-bottom: 6px;
  font-family: 'DM Sans', sans-serif;
}

.file-group input[type="file"] { padding: 8px; font-size: 0.88rem; }

.forgot-link, .switch-text a, .support-text a {
  color: #38bdf8;
  text-decoration: none;
  transition: 0.2s;
}

.forgot-link:hover, .switch-text a:hover, .support-text a:hover {
  color: white;
}

.auth-footer {
  margin-top: 22px;
  border-top: 1px solid rgba(255,255,255,0.07);
  padding-top: 18px;
}

.switch-text {
  font-size: 0.88rem;
  color: rgba(255,255,255,0.4);
  margin-bottom: 8px;
  font-family: 'DM Sans', sans-serif;
}

.support-text {
  font-size: 0.88rem;
  color: rgba(255,255,255,0.4);
  font-family: 'DM Sans', sans-serif;
}
</style>