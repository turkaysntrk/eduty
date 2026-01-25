<template>
	<div class="support-page-wrapper">

		<div class="hero-background-container">
			<div class="page-bg"></div>
			<div class="page-gradient"></div>
		</div>

		<div v-if="showLogoutConfirmModal" class="modal-overlay">
			<div class="modal-content">
				<h3>Oturum Çakışması</h3>
				<p>Şu anda <strong>{{ existingUserRole === 'student' ? 'Öğrenci' : 'Öğretmen' }}</strong> hesabı ile
					giriş yapmış durumdasınız.</p>
				<p>Bağışçı işlemi yapmak için mevcut hesabınızdan çıkış yapmanız gerekmektedir. Onaylıyor musunuz?</p>
				<div class="modal-actions">
					<button @click="showLogoutConfirmModal = false" class="btn-cancel">İptal (Sayfada Kal)</button>
					<button @click="confirmLogout" class="btn-confirm">Çıkış Yap ve Devam Et</button>
				</div>
			</div>
		</div>

		<div class="container relative-z">

			<section class="hero-split">
				<div class="info-side">
					<h4 class="badge">Gönüllü Ol</h4>
					<h1>Eğitimde <span class="blue">Fırsat Eşitliğine</span> Ortak Olun.</h1>
					<p>
						Eduty Gönüllüsü olarak, başarılı ama imkanı kısıtlı bir öğrencinin hayallerine dokunabilirsiniz.
						Bağışlarınız doğrudan sistemdeki öğrencilere "Ders Puanı" olarak aktarılır ve eğitim
						materyallerine erişim sağlar.
					</p>
					
					<div v-if="existingUserRole && existingUserRole !== 'donor'" class="user-warning-banner">
						⚠️ Şu an <strong>{{ existingUserRole === 'student' ? 'Öğrenci' : 'Öğretmen' }}</strong> hesabıyla görüntülüyorsunuz. Bağış yapmak için çıkış yapmalısınız.
					</div>

					<div class="trust-icons">
						<div class="trust-item"><span class="icon">🛡️</span><span>Güvenli Ödeme</span></div>
						<div class="trust-item"><span class="icon">✨</span><span>%100 Şeffaflık</span></div>
						<div class="trust-item"><span class="icon">🎓</span><span>Öğrenci Dostu</span></div>
					</div>
				</div>

				<div class="login-side">
					<div class="auth-card">
						<h3 v-if="viewState === 'login'">Bağışçı Girişi</h3>
						<h3 v-else-if="viewState === 'register'">Bağışçı Kaydı</h3>
						<h3 v-else>Şifre Yenileme</h3>

						<p v-if="viewState === 'login'">Paketleri seçmek ve bağış yapmak için giriş yapın.</p>
						<p v-else-if="viewState === 'register'">Öğrencilere destek olmak için aramıza katılın.</p>
						<p v-else>E-posta adresinize sıfırlama bağlantısı gönderilecek.</p>

						<form v-if="viewState === 'login'" @submit.prevent="handleLoginAttempt">
							<input v-model="loginForm.email" type="email" placeholder="E-posta" required />
							<input v-model="loginForm.password" type="password" placeholder="Parola" required />
							<button type="submit" class="btn-primary">Giriş Yap</button>
						</form>

						<form v-else-if="viewState === 'register'" @submit.prevent="handleRegisterAttempt">
							<div class="input-row">
								<input v-model="registerForm.firstName" type="text" placeholder="Ad" required />
								<input v-model="registerForm.lastName" type="text" placeholder="Soyad" required />
							</div>
							<input v-model="registerForm.email" type="email" placeholder="E-posta" required />
							<input v-model="registerForm.password" type="password" placeholder="Parola" required />
							<input v-model="registerForm.passwordConfirm" type="password" placeholder="Parola Tekrar"
								required />
							<button type="submit" class="btn-primary">Kayıt Ol ve Giriş Yap</button>
						</form>

						<form v-else @submit.prevent="handleForgot">
							<input v-model="forgotEmail" type="email" placeholder="E-posta adresiniz" required />
							<button type="submit" class="btn-primary">Gönder</button>
							<button type="button" class="btn-text" @click="viewState = 'login'">Geri Dön</button>
						</form>

						<div class="auth-footer">
							<p v-if="viewState === 'login'">Henüz hesabınız yok mu? <a href="#"
									@click.prevent="viewState = 'register'">Kayıt Ol</a></p>
							<p v-if="viewState === 'register'">Zaten hesabınız var mı? <a href="#"
									@click.prevent="viewState = 'login'">Giriş Yap</a></p>
							<p class="role-switch">Öğretmen veya Öğrenci misin? <NuxtLink to="/kayit-giris">Giriş Yap
								</NuxtLink>
							</p>
						</div>
					</div>
				</div>
			</section>

			<section class="packages-section">
				<div class="section-header">
					<h2 class="section-title">Destek Paketleri</h2>
					<p class="section-desc">Küçük yardımlar, büyük başarıların temelini atar.</p>
				</div>
				<div class="packages-grid">
					<div class="package-card">
						<div class="pkg-header">Başlangıç</div>
						<div class="price">250 ₺</div>
						<ul class="features">
							<li>✅ 1 Öğrenciye Kaynak</li>
							<li>✅ Teşekkür Sertifikası</li>
						</ul>
						<button class="btn-select" @click="selectPackage(250, 'Başlangıç')">Seç</button>
					</div>
					<div class="package-card featured">
						<div class="best-value">EN POPÜLER</div>
						<div class="pkg-header">Gelişim</div>
						<div class="price">750 ₺</div>
						<ul class="features">
							<li>✅ <strong>3 Öğrenciye</strong> Kaynak</li>
							<li>✅ Özel Destekçi Rozeti</li>
							<li>✅ Aylık Rapor</li>
						</ul>
						<button class="btn-select featured-btn" @click="selectPackage(750, 'Gelişim')">Seç</button>
					</div>
					<div class="package-card">
						<div class="pkg-header">Akademi</div>
						<div class="price">2.000 ₺</div>
						<ul class="features">
							<li>✅ <strong>1 Sınıfa</strong> Kaynak</li>
							<li>✅ Kurumsal Teşekkür</li>
							<li>✅ Etki Raporu</li>
						</ul>
						<button class="btn-select" @click="selectPackage(2000, 'Akademi')">Seç</button>
					</div>
					<div class="package-card custom-card">
						<div class="pkg-header">Gönlünden Kopan</div>
						<p class="custom-desc">Dilediğiniz miktarda bağış yaparak eğitime katkıda bulunun.</p>
						<div class="custom-input-wrapper">
							<span>₺</span>
							<input type="number" v-model="customAmount" placeholder="0" min="50" />
						</div>
						<button class="btn-select" @click="handleCustomDonation">Destek Ol</button>
					</div>
				</div>
			</section>
		</div>
	</div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	sendPasswordResetEmail,
	setPersistence,
	browserLocalPersistence,
	onAuthStateChanged,
	signOut
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const { $db, $auth } = useNuxtApp();
const router = useRouter();

const viewState = ref('login');
const loginForm = reactive({ email: '', password: '' });
const registerForm = reactive({ firstName: '', lastName: '', email: '', password: '', passwordConfirm: '' });
const forgotEmail = ref('');
const customAmount = ref(null);

// Modal State
const showLogoutConfirmModal = ref(false);
const existingUserRole = ref(null); // Başlangıçta null

onMounted(() => {
	window.scrollTo(0, 0);
	checkExistingSession();
});

// MEVCUT OTURUMU KONTROL ET (Modal açmadan sadece durumu kaydet)
const checkExistingSession = () => {
	onAuthStateChanged($auth, async (user) => {
		if (user) {
			const db = getFirestore();
			const docRef = doc(db, "users", user.uid);
			const docSnap = await getDoc(docRef);

			if (docSnap.exists()) {
				const data = docSnap.data();
				// Eğer zaten bağışçıysa, panele yönlendir
				if (data.role === 'donor') {
					router.push('/dashboard-bagisci');
				} else {
					// Eğer öğrenci veya öğretmense, rolü kaydet ama MODALI AÇMA.
					// Kullanıcı sayfayı gezebilsin.
					existingUserRole.value = data.role;
				}
			}
		}
	});
};

const confirmLogout = async () => {
	await signOut($auth);
	showLogoutConfirmModal.value = false;
	existingUserRole.value = null;
	window.location.reload(); 
};

// --- YENİ AKSİYON KONTROL FONKSİYONLARI ---

// Giriş butonuna basıldığında tetiklenir
const handleLoginAttempt = () => {
    // Eğer içeride farklı bir rol varsa modalı aç ve dur.
    if (existingUserRole.value && existingUserRole.value !== 'donor') {
        showLogoutConfirmModal.value = true;
        return;
    }
    // Yoksa normal giriş işlemini yap
    handleLogin();
};

// Kayıt butonuna basıldığında tetiklenir
const handleRegisterAttempt = () => {
    if (existingUserRole.value && existingUserRole.value !== 'donor') {
        showLogoutConfirmModal.value = true;
        return;
    }
    handleRegister();
}

// Paket seçildiğinde tetiklenir
const selectPackage = (amount, name) => {
    // Eğer öğrenci/öğretmen giriş yapmışsa ve paket seçerse modalı aç
    if (existingUserRole.value && existingUserRole.value !== 'donor') {
        showLogoutConfirmModal.value = true;
        return;
    }

	// Normal akış
	alert("Lütfen önce giriş yapın veya kayıt olun.");
	window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleCustomDonation = () => {
	selectPackage(customAmount.value, 'Özel Bağış');
};

// KAYIT İŞLEMİ (Logik Aynı)
const handleRegister = async () => {
	if (registerForm.password !== registerForm.passwordConfirm) { alert("Parolalar eşleşmiyor!"); return; }
	if (registerForm.password.length < 6) { alert("Parola en az 6 karakter olmalı."); return; }

	try {
		const db = getFirestore();
		await setPersistence($auth, browserLocalPersistence);

		const userCredential = await createUserWithEmailAndPassword($auth, registerForm.email, registerForm.password);
		const user = userCredential.user;

		await setDoc(doc(db, "users", user.uid), {
			firstName: registerForm.firstName,
			lastName: registerForm.lastName,
			email: registerForm.email,
			role: 'donor',
			createdAt: new Date().toISOString()
		});

		alert("Kayıt başarılı! Yönlendiriliyorsunuz...");
		router.push('/dashboard-bagisci');

	} catch (error) {
		alert("Kayıt hatası: " + error.message);
	}
};

// GİRİŞ İŞLEMİ (Logik Aynı)
const handleLogin = async () => {
	try {
		await setPersistence($auth, browserLocalPersistence);
		await signInWithEmailAndPassword($auth, loginForm.email, loginForm.password);

		const db = getFirestore();
		const docRef = doc(db, "users", $auth.currentUser.uid);
		const docSnap = await getDoc(docRef);

		if (docSnap.exists() && docSnap.data().role === 'donor') {
			router.push('/dashboard-bagisci');
		} else {
            // Eğer bir şekilde donor olmayan biri buradan girmeyi başarırsa
			alert("Bu giriş sadece bağışçılar içindir. Lütfen doğru sayfadan giriş yapınız.");
			await signOut($auth);
		}

	} catch (error) {
		alert("Giriş hatası: " + error.message);
	}
};

const handleForgot = async () => {
	try {
		await sendPasswordResetEmail($auth, forgotEmail.value);
		alert("Sıfırlama bağlantısı gönderildi.");
		viewState.value = 'login';
	} catch (error) {
		alert("Hata: " + error.message);
	}
};
</script>

<style scoped>
/* Mevcut stiller korunuyor, sadece yeni uyarı banner'ı için stil eklendi */
.support-page-wrapper {
	background-color: #050505;
	min-height: 100vh;
	position: relative;
	padding-bottom: 50px;
}

.user-warning-banner {
    background: rgba(255, 152, 0, 0.15);
    border: 1px solid #ff9800;
    color: #ffcc80;
    padding: 10px 15px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 0.9rem;
    display: inline-block;
}

.hero-background-container {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100vh;
	z-index: 0;
	overflow: hidden;
}

.page-bg {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-image: url('/img/destek-bg.jpg');
	background-size: cover;
	background-position: center top;
}

.page-gradient {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: linear-gradient(to bottom, rgba(5, 5, 5, 0.4) 0%, rgba(5, 5, 5, 0.8) 60%, #050505 100%);
	z-index: 1;
}

.relative-z {
	position: relative;
	z-index: 2;
}

.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 20px;
	padding-top: 140px;
}

.hero-split {
	display: flex;
	align-items: flex-start;
	gap: 60px;
	margin-bottom: 150px;
}

.info-side {
	flex: 1;
	padding-top: 20px;
}

.login-side {
	flex: 1;
	display: flex;
	justify-content: flex-end;
}

.badge {
	color: var(--primary-color);
	letter-spacing: 2px;
	text-transform: uppercase;
	margin-bottom: 15px;
	display: block;
	font-weight: 700;
}

h1 {
	font-size: 3.5rem;
	line-height: 1.1;
	margin-bottom: 25px;
	color: white;
}

.blue {
	color: var(--primary-color);
}

.info-side p {
	font-size: 1.1rem;
	color: #ccc;
	line-height: 1.6;
	max-width: 90%;
    margin-bottom: 20px;
}

.trust-icons {
	margin-top: 40px;
	display: flex;
	gap: 25px;
	flex-wrap: wrap;
}

.trust-item {
	display: flex;
	align-items: center;
	gap: 10px;
	color: #aaa;
	font-size: 0.9rem;
}

.auth-card {
	background: rgba(17, 17, 17, 0.85);
	backdrop-filter: blur(15px);
	border: 1px solid rgba(255, 255, 255, 0.1);
	padding: 35px;
	border-radius: 16px;
	width: 100%;
	max-width: 420px;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
}

.auth-card h3 {
	font-size: 1.5rem;
	margin-bottom: 10px;
	color: white;
}

.auth-card p {
	color: #aaa;
	font-size: 0.9rem;
	margin-bottom: 20px;
}

.auth-card input {
	width: 100%;
	padding: 14px;
	margin-bottom: 15px;
	background: rgba(0, 0, 0, 0.5);
	border: 1px solid #444;
	color: white;
	border-radius: 8px;
	font-size: 1rem;
}

.auth-card input:focus {
	border-color: var(--primary-color);
	outline: none;
}

.input-row {
	display: flex;
	gap: 10px;
}

.btn-primary {
	width: 100%;
	padding: 14px;
	background: var(--primary-color);
	color: white;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	font-weight: 700;
	font-size: 1rem;
	transition: 0.3s;
}

.btn-primary:hover {
	background: var(--secondary-color);
}

.btn-text {
	background: none;
	border: none;
	color: #aaa;
	width: 100%;
	margin-top: 10px;
	cursor: pointer;
}

.auth-footer {
	margin-top: 20px;
	text-align: center;
	font-size: 0.9rem;
	color: #999;
	border-top: 1px solid #333;
	padding-top: 20px;
}

.auth-footer p {
	margin-bottom: 8px;
}

.auth-footer a {
	color: var(--primary-color);
	text-decoration: none;
}

.role-switch {
	margin-top: 10px;
	font-size: 0.9rem;
	color: #888;
}

.packages-section {
	position: relative;
	background-color: #050505;
	z-index: 2;
	padding-bottom: 50px;
}

.section-header {
	text-align: center;
	margin-bottom: 60px;
	width: 100%;
}

.section-title {
	font-size: 2.5rem;
	margin-bottom: 10px;
	display: block;
	color: white;
}

.section-desc {
	color: #bbb;
}

.packages-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
	gap: 30px;
	align-items: start;
}

.package-card {
	background: #111;
	border: 1px solid #333;
	padding: 40px 30px;
	text-align: center;
	border-radius: 16px;
	transition: transform 0.3s, border-color 0.3s;
	position: relative;
	display: flex;
	flex-direction: column;
	height: 100%;
}

.package-card:hover {
	transform: translateY(-10px);
	border-color: #555;
	background: #161616;
}

.pkg-header {
	font-size: 1.4rem;
	font-weight: 700;
	margin-bottom: 15px;
	color: #fff;
}

.price {
	font-size: 2.8rem;
	font-weight: 800;
	color: white;
	margin-bottom: 25px;
}

.features {
	list-style: none;
	padding: 0;
	margin: 0 0 30px 0;
	text-align: left;
	flex-grow: 1;
}

.features li {
	margin-bottom: 12px;
	color: #ccc;
	font-size: 0.95rem;
	display: flex;
	align-items: center;
	gap: 10px;
}

.btn-select {
	width: 100%;
	padding: 12px;
	background: transparent;
	border: 1px solid #444;
	color: white;
	border-radius: 8px;
	cursor: pointer;
	font-weight: 600;
	transition: 0.3s;
}

.btn-select:hover {
	border-color: white;
	background: rgba(255, 255, 255, 0.1);
}

.package-card.featured {
	border: 2px solid var(--primary-color);
	background: #0a0a0a;
	transform: scale(1.05);
	z-index: 3;
	box-shadow: 0 0 30px rgba(0, 85, 255, 0.15);
}

.package-card.featured:hover {
	transform: scale(1.05) translateY(-10px);
}

.best-value {
	position: absolute;
	top: -16px;
	left: 50%;
	transform: translateX(-50%);
	background: var(--primary-color);
	color: white;
	font-size: 0.75rem;
	font-weight: 800;
	padding: 6px 16px;
	border-radius: 20px;
	letter-spacing: 1px;
}

.featured-btn {
	background: var(--primary-color);
	border-color: var(--primary-color);
}

.featured-btn:hover {
	background: var(--secondary-color);
}

.custom-card .custom-desc {
	color: #aaa;
	font-size: 0.9rem;
	margin-bottom: 20px;
}

.custom-input-wrapper {
	display: flex;
	align-items: center;
	justify-content: center;
	background: #1a1a1a;
	border: 1px solid #333;
	border-radius: 8px;
	padding: 10px 20px;
	margin-bottom: 25px;
}

.custom-input-wrapper span {
	font-size: 1.5rem;
	color: #666;
	margin-right: 5px;
}

.custom-input-wrapper input {
	background: transparent;
	border: none;
	color: white;
	font-size: 1.8rem;
	width: 100%;
	text-align: center;
	font-weight: 700;
	padding: 0;
	margin: 0;
}

.custom-input-wrapper input::-webkit-outer-spin-button,
.custom-input-wrapper input::-webkit-inner-spin-button {
	-webkit-appearance: none;
	margin: 0;
}

/* MODAL STİLLERİ */
.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.85);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 9999;
}

.modal-content {
	background: #1a1a1a;
	padding: 30px;
	border-radius: 12px;
	border: 1px solid #333;
	max-width: 400px;
	text-align: center;
}

.modal-content h3 {
	color: #fff;
	margin-bottom: 15px;
}

.modal-content p {
	color: #ccc;
	margin-bottom: 20px;
}

.modal-actions {
	display: flex;
	gap: 10px;
	justify-content: center;
}

.btn-cancel {
	background: #333;
	color: white;
	border: none;
	padding: 10px 20px;
	border-radius: 6px;
	cursor: pointer;
}

.btn-confirm {
	background: #ff4444;
	color: white;
	border: none;
	padding: 10px 20px;
	border-radius: 6px;
	cursor: pointer;
	font-weight: bold;
}

@media (max-width: 992px) {
	.hero-split {
		flex-direction: column;
	}

	.info-side {
		text-align: center;
	}

	.info-side p {
		margin: 0 auto 30px;
	}

	.trust-icons {
		justify-content: center;
	}

	.login-side {
		justify-content: center;
		width: 100%;
	}

	.package-card.featured {
		transform: scale(1);
		margin: 20px 0;
	}
}
</style>