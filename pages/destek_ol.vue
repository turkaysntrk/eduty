<template>
	<div class="support-page">
		<div class="container">

			<section class="hero-split">
				<div class="info-side">
					<h4 class="badge">Gönüllü Ol</h4>
					<h1>Eğitimde <span class="blue">Fırsat Eşitliğine</span> Ortak Olun.</h1>
					<p>
						Eduty Gönüllüsü olarak, başarılı ama imkanı kısıtlı bir öğrencinin hayallerine dokunabilirsiniz.
						Bağışlarınız doğrudan sistemdeki öğrencilere "Ders Puanı" olarak aktarılır ve eğitim
						materyallerine erişim sağlar.
					</p>
					<div class="trust-icons">
						<div class="trust-item">
							<span class="icon">🛡️</span>
							<span>Güvenli Ödeme</span>
						</div>
						<div class="trust-item">
							<span class="icon">✨</span>
							<span>%100 Şeffaflık</span>
						</div>
						<div class="trust-item">
							<span class="icon">🎓</span>
							<span>Öğrenci Dostu</span>
						</div>
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

						<form v-if="viewState === 'login'" @submit.prevent="handleLogin">
							<input v-model="loginForm.email" type="email" placeholder="E-posta" required />
							<input v-model="loginForm.password" type="password" placeholder="Parola" required />

							<div class="form-options">
								<label class="remember-me">
									<input type="checkbox" v-model="loginForm.rememberMe">
									<span>Beni Hatırla</span>
								</label>
								<a href="#" @click.prevent="viewState = 'forgot'" class="forgot-link">Parolamı
									Unuttum</a>
							</div>

							<button type="submit" class="btn-primary">Giriş Yap</button>
						</form>

						<form v-else-if="viewState === 'register'" @submit.prevent="handleRegister">
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
							<p v-if="viewState === 'login'">
								Henüz hesabınız yok mu? <a href="#" @click.prevent="viewState = 'register'">Kayıt Ol</a>
							</p>
							<p v-if="viewState === 'register'">
								Zaten hesabınız var mı? <a href="#" @click.prevent="viewState = 'login'">Giriş Yap</a>
							</p>
                            <p class="role-switch">
                                Öğretmen veya Öğrenci misin? 
                                <NuxtLink to="/kayit-giris">Giriş Yap</NuxtLink>
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
							<li>✅ Aylık Bülten</li>
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
							<li>✅ Öğrencilerden Mesajlar</li>
							<li>✅ Aylık Gelişim Raporu</li>
						</ul>
						<button class="btn-select featured-btn" @click="selectPackage(750, 'Gelişim')">Seç</button>
					</div>

					<div class="package-card">
						<div class="pkg-header">Akademi</div>
						<div class="price">2.000 ₺</div>
						<ul class="features">
							<li>✅ <strong>1 Sınıfa</strong> Kaynak</li>
							<li>✅ Kurumsal Teşekkür</li>
							<li>✅ Özel Davetiyeler</li>
							<li>✅ Yıllık Etki Raporu</li>
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
import { ref, reactive } from 'vue'
import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	sendPasswordResetEmail,
	setPersistence,
	browserLocalPersistence,
	browserSessionPersistence
} from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const { $auth } = useNuxtApp();
const db = getFirestore();

// Görünüm Durumu
const viewState = ref('login');

// Form Verileri
const loginForm = reactive({ email: '', password: '', rememberMe: false });
const registerForm = reactive({ firstName: '', lastName: '', email: '', password: '', passwordConfirm: '' });
const forgotEmail = ref('');
const customAmount = ref(null);

// --- PAKET SEÇİMİ ---
const selectPackage = (amount, name) => {
	if (!$auth.currentUser) {
		alert("Lütfen bir paket seçmeden önce giriş yapın veya kayıt olun.");
		window.scrollTo({ top: 0, behavior: 'smooth' });
		return;
	}
	alert(`${name} paketi seçildi. Tutar: ${amount} TL. Ödeme sayfasına yönlendirileceksiniz (Demo).`);
};

const handleCustomDonation = () => {
	if (!customAmount.value || customAmount.value < 10) {
		alert("Lütfen geçerli bir tutar giriniz (Min 10 TL).");
		return;
	}
	selectPackage(customAmount.value, 'Özel Bağış');
};

// --- AUTH İŞLEMLERİ ---
const handleRegister = async () => {
	if (registerForm.password !== registerForm.passwordConfirm) {
		alert("Parolalar eşleşmiyor!"); return;
	}
	if (registerForm.password.length < 6) {
		alert("Parola en az 6 karakter olmalı."); return;
	}

	try {
		const userCredential = await createUserWithEmailAndPassword($auth, registerForm.email, registerForm.password);
		const user = userCredential.user;

		await setDoc(doc(db, "users", user.uid), {
			firstName: registerForm.firstName,
			lastName: registerForm.lastName,
			email: registerForm.email,
			role: 'donor',
			createdAt: new Date().toISOString()
		});

		alert("Kayıt başarılı! Giriş yapıldı.");
		viewState.value = 'login';
		loginForm.email = registerForm.email;

	} catch (error) {
		alert("Kayıt hatası: " + error.message);
	}
};

const handleLogin = async () => {
	try {
		const persistenceType = loginForm.rememberMe ? browserLocalPersistence : browserSessionPersistence;
		await setPersistence($auth, persistenceType);
		await signInWithEmailAndPassword($auth, loginForm.email, loginForm.password);
		alert("Giriş başarılı! Paket seçebilirsiniz.");
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
/* GENEL SAYFA */
.support-page {
	padding-top: 140px;
	padding-bottom: 50px;
	background-color: #050505;
	color: white;
	min-height: 100vh;
}

.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 20px;
}

/* HERO BÖLÜMÜ */
.hero-split {
	display: flex;
	align-items: flex-start;
	gap: 60px;
	margin-bottom: 120px;
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
}

.blue {
	color: var(--primary-color);
}

.info-side p {
	font-size: 1.1rem;
	color: #ccc;
	line-height: 1.6;
	max-width: 90%;
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

/* AUTH CARD */
.auth-card {
	background: #111;
	border: 1px solid #222;
	padding: 35px;
	border-radius: 16px;
	width: 100%;
	max-width: 420px;
	box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.auth-card h3 {
	font-size: 1.5rem;
	margin-bottom: 10px;
	color: white;
}

.auth-card p {
	color: #888;
	font-size: 0.9rem;
	margin-bottom: 20px;
}

.auth-card input {
	width: 100%;
	padding: 14px;
	margin-bottom: 15px;
	background: #1a1a1a;
	border: 1px solid #333;
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

.form-options {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;
	font-size: 0.85rem;
	color: #ccc;
}

.remember-me {
	display: flex;
	align-items: center;
	gap: 5px;
	cursor: pointer;
}

.remember-me input {
	width: 16px !important;
	height: 16px !important;
	margin: 0 !important;
	cursor: pointer;
}

.forgot-link {
	color: var(--primary-color);
	text-decoration: none;
    font-size: 0.85rem;
    text-align: right;
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
	color: #888;
	width: 100%;
	margin-top: 10px;
	cursor: pointer;
}

.auth-footer {
	margin-top: 20px;
	text-align: center;
	font-size: 0.9rem;
	color: #666;
    border-top: 1px solid #222;
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

/* Başlığı Ortala */
.section-header {
	text-align: center;
	margin-bottom: 60px;
	width: 100%;
}

.section-title {
	font-size: 2.5rem;
	margin-bottom: 10px;
	display: block;
}

/* PAKETLER BÖLÜMÜ */
.packages-section {
	padding-bottom: 50px;
}

.section-desc {
	color: #888;
}

.packages-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
	gap: 30px;
	align-items: start;
}

/* PAKET KARTI */
.package-card {
	background: #111;
	border: 1px solid #222;
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
	border-color: #444;
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
	background: #222;
}

/* FEATURED (AVANTAJLI) PAKET */
.package-card.featured {
	border: 2px solid var(--primary-color);
	background: #0a0a0a;
	transform: scale(1.05);
	z-index: 2;
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

/* CUSTOM (ÖZEL) PAKET */
.custom-card .custom-desc {
	color: #888;
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

/* RESPONSIVE */
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

	.package-card.featured:hover {
		transform: translateY(-10px);
	}
}

@media (max-width: 600px) {
	h1 {
		font-size: 2.5rem;
	}

	.packages-grid {
		grid-template-columns: 1fr;
	}
}
</style>