<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,  
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore"; // Firestore eklendi

const router = useRouter();
const { $auth } = useNuxtApp(); 
const db = getFirestore(); // Veritabanını başlat

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
  // Formları temizle (İsteğe bağlı)
};

// --- GİRİŞ İŞLEMLERİ ---
const handleLogin = async () => {
  try {
    const persistenceType = loginForm.rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence($auth, persistenceType);
    await signInWithEmailAndPassword($auth, loginForm.identity, loginForm.password);
    
    // Giriş başarılı, ana sayfaya yönlendir
    router.push('/');
  } catch (error) {
    alert("Giriş başarısız: " + error.message);
  }
};

// --- KAYIT İŞLEMLERİ ---
const handleRegister = async () => {
  let formToUse = selectedRole.value === 'student' ? studentForm : teacherForm;

  // 1. Basit Doğrulamalar
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
    // 2. Kullanıcıyı Firebase Auth'ta oluştur
    const userCredential = await createUserWithEmailAndPassword($auth, formToUse.email, formToUse.password);
    const user = userCredential.user;
    
    // 3. Verileri Hazırla
    // Ortak veriler
    let userData = {
      email: formToUse.email,
      role: selectedRole.value, // 'student' veya 'teacher'
      createdAt: new Date().toISOString()
    };

    // Role özel verileri ekle
    if (selectedRole.value === 'student') {
      Object.assign(userData, {
        grade: studentForm.grade,
        city: studentForm.city,
        district: studentForm.district,
        schoolName: studentForm.schoolName
      });
    } else if (selectedRole.value === 'teacher') {
      Object.assign(userData, {
        workStatus: teacherForm.workStatus,
        city: teacherForm.city || '', 
        district: teacherForm.district || '',
        schoolName: teacherForm.schoolName || ''
        // Not: Dosya yükleme (certificateFile) işlemi için Firebase Storage gerekir.
        // Şimdilik sadece veritabanı kaydını yapıyoruz.
      });
    }

    // 4. Firestore'a Kaydet ("users" koleksiyonu altında UID ile)
    await setDoc(doc(db, "users", user.uid), userData);
    
    console.log("Kayıt başarılı, rol:", selectedRole.value);
    
    // Güvenlik veya akış gereği çıkış yaptırıp giriş ekranına atıyoruz
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
    <div class="auth-container">
      
      <div v-if="currentView === 'login'" class="auth-box">
        <div class="brand-header">
          <img src="/img/eduty_logo.png" alt="Logo" class="site-logo" />
          <span class="site-name">EDUTY</span>
        </div>

        <h1>Giriş Yap</h1>
        <p class="subtitle">Hoş geldin, seni tekrar görmek güzel.</p>
        
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
        
        <p class="switch-text">
          Hesabın yok mu?
          <a href="#" @click.prevent="currentView = 'register'">Hemen kayıt ol</a>
        </p>
      </div>

      <div v-else-if="currentView === 'register'" class="auth-box register-box">
        <div class="brand-header">
          <img src="/img/eduty_logo.png" alt="Logo" class="site-logo" />
          <span class="site-name">EDUTY</span>
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

          <p class="switch-text">
            Zaten hesabın var mı?
            <a href="#" @click.prevent="currentView = 'login'">Giriş yap</a>
          </p>
        </div>

        <div v-else>
          <h1>{{ selectedRole === 'student' ? 'Öğrenci Kaydı' : 'Öğretmen Kaydı' }}</h1>
          <p class="subtitle">Bilgilerini doldur ve aramıza katıl.</p>
          
          <form @submit.prevent="handleRegister">
            
            <div class="input-row">
              <input 
                v-if="selectedRole === 'student'"
                v-model="studentForm.email" 
                type="email" 
                placeholder="E-posta Adresi" 
                required 
              />
              <input 
                v-else
                v-model="teacherForm.email" 
                type="email" 
                placeholder="E-posta Adresi" 
                required 
              />
            </div>

            <div class="input-row two-col">
              <input 
                v-if="selectedRole === 'student'"
                v-model="studentForm.password" 
                type="password" 
                placeholder="Parola" 
                required 
              />
              <input 
                v-else
                v-model="teacherForm.password" 
                type="password" 
                placeholder="Parola" 
                required 
              />

              <input 
                v-if="selectedRole === 'student'"
                v-model="studentForm.passwordConfirm" 
                type="password" 
                placeholder="Parola Tekrar" 
                required 
              />
              <input 
                v-else
                v-model="teacherForm.passwordConfirm" 
                type="password" 
                placeholder="Parola Tekrar" 
                required 
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

          <p class="switch-text">
            Zaten hesabın var mı?
            <a href="#" @click.prevent="currentView = 'login'">Giriş yap</a>
          </p>
        </div>
      </div>

      <div v-else-if="currentView === 'forgot'" class="auth-box">
        <div class="brand-header">
          <img src="/img/eduty_logo.png" alt="Logo" class="site-logo" />
          <span class="site-name">EDUTY</span>
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
/* Sayfa Genel Yapısı */
.auth-page {
  min-height: 100vh;
  padding: 80px 20px 40px; 
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #050505;
}

.auth-container {
  width: 100%;
  max-width: 450px; 
}

.auth-box {
  background: #111;
  padding: 40px 30px;
  border-radius: 12px;
  border: 1px solid #222;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  text-align: center;
}

.brand-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 25px;
}

.site-logo {
  height: 50px;
  width: auto;
  object-fit: contain;
}

.site-name {
  font-family: 'Times New Roman', Times, serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 2px;
  text-transform: uppercase;
}

h1 {
  font-family: 'Times New Roman', Times, serif;
  font-size: 1.8rem;
  margin-bottom: 10px;
  color: #ffffff;
}

.subtitle {
  color: #888;
  font-size: 0.9rem;
  margin-bottom: 30px;
}

.input-group, .input-row {
  margin-bottom: 15px;
}

.input-row.two-col {
  display: flex;
  gap: 10px;
}

input, select {
  width: 100%;
  padding: 12px 15px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  transition: 0.3s;
}

input:focus, select:focus {
  outline: none;
  border-color: #0055ff;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  font-size: 0.9rem;
  color: #ccc;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.remember-me input {
  width: auto;
  margin: 0;
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background: #0055ff;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 10px;
  transition: 0.3s;
}

.btn-primary:hover {
  background: #003bb0;
}

.btn-secondary {
  width: 100%;
  padding: 10px;
  background: transparent;
  color: #888;
  border: 1px solid #333;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 10px;
}
.btn-secondary:hover {
  border-color: #666;
  color: white;
}

.role-selector {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.role-card {
  background: #1a1a1a;
  border: 1px solid #333;
  padding: 20px;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition: 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.role-card:hover {
  border-color: #0055ff;
  background: #222;
}

.role-icon {
  font-size: 2rem;
  margin-bottom: 10px;
}

.role-card h3 {
  color: white;
  font-size: 1.1rem;
  margin-bottom: 5px;
}

.role-card p {
  color: #888;
  font-size: 0.85rem;
  margin: 0;
}

.file-group {
  text-align: left;
}
.file-group label {
  display: block;
  font-size: 0.85rem;
  color: #aaa;
  margin-bottom: 5px;
}
.file-group input[type="file"] {
  padding: 8px;
  font-size: 0.9rem;
}

.divider {
  display: flex;
  align-items: center;
  margin: 25px 0;
  color: #555;
  font-size: 0.8rem;
}

.divider::before, .divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: #333;
}

.divider span { padding: 0 10px; }

.btn-social {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #333;
  background: #1a1a1a;
  color: white;
  cursor: pointer;
}

.forgot-link, .switch-text a {
  color: #0055ff;
  text-decoration: none;
}

.switch-text {
  margin-top: 15px;
  font-size: 0.9rem;
  color: #888;
}
</style>