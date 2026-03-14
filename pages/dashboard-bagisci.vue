<template>
    <div v-if="isLoading" class="loading-screen">
        <div class="spinner"></div>
        <p>Bağışçı paneli yükleniyor...</p>
    </div>

    <div v-else class="dashboard-container">

        <button class="mobile-toggle-btn" @click="isSidebarOpen = !isSidebarOpen">
            ☰
        </button>

        <div v-if="isSidebarOpen" class="sidebar-overlay" @click="isSidebarOpen = false"></div>

        <aside class="sidebar" :class="{ 'open': isSidebarOpen }">

            <div class="sidebar-logo-container">
                <NuxtLink to="/" class="sidebar-logo-link" @click="isSidebarOpen = false">
                    <img src="/img/eduty_logo.png" alt="Eduty Logo" class="sidebar-logo-img" />
                    <div class="eduty-text">
                        <span>e</span><span>d</span><span>u</span><span>t</span><span>y</span>
                    </div>
                </NuxtLink>
            </div>

            <div class="profile-section">
                <div class="avatar-wrapper">
                    <img :src="currentAvatarUrl" alt="Profil" class="avatar" />
                    <div class="rank-badge">Gönüllü</div>
                </div>
                <h3 class="user-name">{{ userDisplayName }}</h3>
                <p class="user-email">{{ userEmail }}</p>
                <p class="user-role-info">Eduty Bağışçısı</p>
            </div>

            <nav class="sidebar-nav">
                <button @click="{ activeTab = 'stats'; isSidebarOpen = false }"
                    :class="{ active: activeTab === 'stats' }">
                    <span class="icon">📊</span> Genel İstatistikler
                </button>
                <button @click="{ activeTab = 'donate'; isSidebarOpen = false }"
                    :class="{ active: activeTab === 'donate' }">
                    <span class="icon">💙</span> Bağış Yap
                </button>
                <button @click="{ activeTab = 'distribution'; isSidebarOpen = false }"
                    :class="{ active: activeTab === 'distribution' }">
                    <span class="icon">🎯</span> Puan Dağıtımı
                    <span v-if="pendingPool > 0" class="pending-badge">{{ pendingPool }}</span>
                </button>
                <button @click="{ activeTab = 'history'; isSidebarOpen = false }"
                    :class="{ active: activeTab === 'history' }">
                    <span class="icon">📜</span> Bağış Geçmişi
                </button>

                <div class="sidebar-divider"></div>

                <NuxtLink to="/" class="nav-link-home" @click="isSidebarOpen = false">
                    <span class="icon">🏠</span> Ana Sayfaya Dön
                </NuxtLink>
            </nav>

            <button @click="handleLogout" class="logout-btn">Çıkış Yap</button>
        </aside>

        <main class="main-content">
            <header class="content-header">
                <div class="score-card">
                    <span class="score-label">TOPLAM BAĞIŞLANAN PUAN</span>
                    <div class="score-value">{{ totalDonatedPoints }} <span>Puan</span></div>
                </div>
                <div class="quick-stats">
                    <div class="q-item">
                        <span class="q-val">{{ donationCount }}</span>
                        <span class="q-lab">Bağış</span>
                    </div>
                </div>
            </header>

            <section class="tab-content">
                <div v-if="activeTab === 'stats'" class="animate-fade">
                    <h2 class="section-title">Etki Raporu</h2>
                    <div class="stats-grid">
                        <div class="stat-box">
                            <h4>Dağıtılan Puan</h4>
                            <p class="highlight-green">{{ distributedPoints }}</p>
                            <small>Öğrencilere aktarılan</small>
                        </div>
                        <div class="stat-box">
                            <h4>Kullanılan Puan</h4>
                            <p class="highlight-blue">{{ usedPoints }}</p>
                            <small>Ders/Test için harcanan</small>
                        </div>
                        <div class="stat-box">
                            <h4>Kullanım Oranı</h4>
                            <p>%{{ usageRate }}</p>
                            <small>Aktiflik durumu</small>
                        </div>
                    </div>

                    <div class="impact-message">
                        <h3>🎉 Teşekkürler!</h3>
                        <p>Sizin sayenizde <strong>{{ Math.floor(distributedPoints / 100) }}</strong> öğrenci eğitime
                            ücretsiz erişim sağladı.</p>
                    </div>
                </div>

                <div v-if="activeTab === 'donate'" class="animate-fade">
                    <h2 class="section-title">Destek Paketleri</h2>
                    <div class="packages-grid">
                        <div class="package-card" v-for="pkg in packages" :key="pkg.name"
                            :class="{ featured: pkg.featured }">
                            <div v-if="pkg.featured" class="best-value">POPÜLER</div>
                            <div class="pkg-header">{{ pkg.name }}</div>
                            <div class="price">{{ pkg.price }} ₺</div>
                            <ul class="features">
                                <li v-for="feat in pkg.features" :key="feat">{{ feat }}</li>
                            </ul>
                            <button class="btn-select" :class="{ 'featured-btn': pkg.featured }"
                                @click="processDonation(pkg.price, pkg.name)">
                                Bağış Yap
                            </button>
                        </div>

                        <div class="package-card custom-card">
                            <div class="pkg-header">Gönlünden Kopan</div>
                            <p class="custom-desc">Dilediğiniz miktarda destek olun.</p>
                            <div class="custom-input-wrapper">
                                <span>₺</span>
                                <input type="number" v-model="customAmount" placeholder="0" min="50" />
                            </div>
                            <button class="btn-select" @click="handleCustomDonation">Destek Ol</button>
                        </div>
                    </div>
                </div>

                <div v-if="activeTab === 'history'" class="animate-fade">
                    <h2 class="section-title">Bağış Geçmişi</h2>
                    <div v-if="donationHistory.length === 0" class="empty-state">
                        <p>Henüz bir bağış kaydınız bulunmuyor.</p>
                    </div>
                    <div v-else class="history-list">
                        <div v-for="item in donationHistory" :key="item.id" class="history-item">
                            <div class="h-left">
                                <span class="h-icon">💙</span>
                                <div>
                                    <h4>{{ item.packageName }}</h4>
                                    <small>{{ new Date(item.createdAt).toLocaleDateString('tr-TR') }} - {{ new Date(item.createdAt).toLocaleTimeString('tr-TR').slice(0, 5) }}</small>
                                </div>
                            </div>
                            <div class="h-right">
                                <span class="h-amount">{{ item.amount }} ₺</span>
                                <span class="h-points">+{{ item.points }} Puan</span>
                                <span class="h-status" :class="item.distributed ? 'distributed' : 'pending'">
                                    {{ item.distributed ? '✅ Dağıtıldı' : '⏳ Bekliyor' }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ===== PUAN DAĞITIM SEKMESİ ===== -->
                <div v-if="activeTab === 'distribution'" class="animate-fade">
                    <h2 class="section-title">Puan Dağıtım Merkezi</h2>

                    <!-- Havuz durumu -->
                    <div class="pool-status-card">
                        <div class="pool-left">
                            <div class="pool-label">Dağıtılmayı Bekleyen Puan Havuzu</div>
                            <div class="pool-value" :class="{ 'pool-empty': pendingPool === 0 }">
                                {{ pendingPool.toLocaleString('tr-TR') }}
                                <span>Puan</span>
                            </div>
                            <div class="pool-sub" v-if="pendingPool > 0">
                                Bu puanlar bağışçılar tarafından aktarıldı ve öğrencilere dağıtılmayı bekliyor.
                            </div>
                            <div class="pool-sub empty-pool-msg" v-else>
                                Şu an bekleyen puan yok. Yeni bir bağış yapıldığında burada görünecek.
                            </div>
                        </div>
                        <div class="pool-right">
                            <button class="btn-distribute"
                                :class="{ 'loading': isDistributing, 'disabled': pendingPool === 0 }"
                                :disabled="pendingPool === 0 || isDistributing" @click="triggerDistribution">
                                <span v-if="isDistributing" class="btn-spinner"></span>
                                <span v-else>🎯</span>
                                {{ isDistributing ? 'Dağıtılıyor...' : 'Dağıtımı Başlat' }}
                            </button>
                            <p class="distribute-note">
                                Puanlar öğrencilerin başarı oranına göre orantılı dağıtılır.
                            </p>
                        </div>
                    </div>

                    <!-- Son dağıtım sonucu -->
                    <div v-if="lastDistributionResult" class="dist-result-card"
                        :class="lastDistributionResult.success ? 'result-success' : 'result-error'">
                        <div v-if="lastDistributionResult.success">
                            <h3>✅ Dağıtım Tamamlandı!</h3>
                            <div class="dist-result-stats">
                                <div class="dr-stat">
                                    <span class="dr-val">{{ lastDistributionResult.totalDistributed.toLocaleString('tr-TR') }}</span>
                                    <span class="dr-lab">Puan Dağıtıldı</span>
                                </div>
                                <div class="dr-stat">
                                    <span class="dr-val">{{ lastDistributionResult.studentCount }}</span>
                                    <span class="dr-lab">Öğrenci Kazandı</span>
                                </div>
                                <div class="dr-stat">
                                    <span class="dr-val">{{ lastDistributionResult.processedDonations }}</span>
                                    <span class="dr-lab">Bağış İşlendi</span>
                                </div>
                            </div>
                            <!-- Kırılım tablosu -->
                            <div class="breakdown-table" v-if="lastDistributionResult.breakdown?.length > 0">
                                <h4>Öğrenci Kırılımı</h4>
                                <div class="breakdown-header">
                                    <span>Öğrenci</span>
                                    <span>Başarı</span>
                                    <span>Kazanılan</span>
                                    <span>Yeni Toplam</span>
                                </div>
                                <div class="breakdown-row" v-for="row in lastDistributionResult.breakdown"
                                    :key="row.uid">
                                    <span class="br-name">{{ row.name }}</span>
                                    <span class="br-rate">
                                        <div class="rate-bar">
                                            <div class="rate-fill" :style="{ width: row.successRate + '%' }"></div>
                                        </div>
                                        %{{ row.successRate }}
                                    </span>
                                    <span class="br-earned">+{{ row.pointsReceived }}</span>
                                    <span class="br-total">{{ row.newTotal.toLocaleString('tr-TR') }}</span>
                                </div>
                            </div>
                        </div>
                        <div v-else>
                            <h3>⚠️ Dağıtım Yapılamadı</h3>
                            <p>{{ lastDistributionResult.error }}</p>
                        </div>
                    </div>

                    <!-- Algoritma açıklaması -->
                    <div class="algo-explainer">
                        <h3>📐 Dağıtım Algoritması Nasıl Çalışır?</h3>
                        <div class="algo-steps">
                            <div class="algo-step">
                                <div class="step-num">1</div>
                                <div class="step-text">
                                    <strong>Havuz toplanır</strong><br>
                                    Tüm dağıtılmamış bağış puanları tek havuzda birleştirilir.
                                </div>
                            </div>
                            <div class="algo-step">
                                <div class="step-num">2</div>
                                <div class="step-text">
                                    <strong>Öğrenciler sıralanır</strong><br>
                                    En az 1 test çözmüş öğrenciler başarı oranlarına göre ağırlıklandırılır.
                                </div>
                            </div>
                            <div class="algo-step">
                                <div class="step-num">3</div>
                                <div class="step-text">
                                    <strong>Orantılı dağıtım</strong><br>
                                    Her öğrenci payı = (kendi başarı ağırlığı / toplam ağırlık) × havuz puanı
                                </div>
                            </div>
                            <div class="algo-step">
                                <div class="step-num">4</div>
                                <div class="step-text">
                                    <strong>Herkes kazanır</strong><br>
                                    Düşük başarılı öğrenci de minimum pay alır — kimse sıfır almaz.
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Geçmiş dağıtımlar -->
                    <div class="dist-history-section" v-if="distributionHistory.length > 0">
                        <h3>Geçmiş Dağıtımlar</h3>
                        <div class="dist-history-list">
                            <div class="dist-history-item" v-for="dh in distributionHistory" :key="dh.id">
                                <div class="dh-left">
                                    <span class="dh-icon">🎯</span>
                                    <div>
                                        <h4>{{ dh.totalPoints?.toLocaleString('tr-TR') }} Puan Dağıtıldı</h4>
                                        <small>{{ dh.studentCount }} öğrenci · {{ dh.processedDonations }} bağış
                                            işlendi</small>
                                        <small class="dh-date" v-if="dh.createdAt?.seconds">
                                            {{ new Date(dh.createdAt.seconds * 1000).toLocaleString('tr-TR') }}
                                        </small>
                                    </div>
                                </div>
                                <span class="dh-badge">Tamamlandı</span>
                            </div>
                        </div>
                    </div>
                </div>

            </section>
        </main>
    </div>
</template>

<script setup>
definePageMeta({ ssr: false })

import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { distributePoints, fetchPendingPool, fetchDistributionHistory } from '~/utils/distributionEngine.js'

const router = useRouter()
const { $auth } = useNuxtApp()
let db;

const isSidebarOpen = ref(false)
const isLoading = ref(true)
const activeTab = ref('stats')
const userDisplayName = ref('')
const userEmail = ref('')
const currentAvatarUrl = ref('https://ui-avatars.com/api/?name=G&background=00c853&color=fff')

// Mock Data & Real Logic
const totalDonatedPoints = ref(0)
const donationCount = ref(0)
const donationHistory = ref([])
const customAmount = ref(null)

// Dağıtım motoru state
const pendingPool = ref(0)
const isDistributing = ref(false)
const lastDistributionResult = ref(null)
const distributionHistory = ref([])

// Stats (Mocked or Calculated)
const distributedPoints = computed(() => Math.floor(totalDonatedPoints.value * 0.9))
const usedPoints = computed(() => Math.floor(distributedPoints.value * 0.75))
const usageRate = computed(() => totalDonatedPoints.value > 0 ? Math.floor((usedPoints.value / totalDonatedPoints.value) * 100) : 0)

const packages = [
    { name: 'Başlangıç', price: 250, features: ['✅ 1 Öğrenciye Kaynak', '✅ Teşekkür Sertifikası'] },
    { name: 'Gelişim', price: 750, featured: true, features: ['✅ 3 Öğrenciye Kaynak', '✅ Özel Rozet', '✅ Aylık Rapor'] },
    { name: 'Akademi', price: 2000, features: ['✅ 1 Sınıfa Kaynak', '✅ Kurumsal Teşekkür', '✅ Etki Raporu'] }
]

const processDonation = async (amount, packageName) => {
    if (!confirm(`${packageName} paketi için ${amount} TL bağış yapmak üzeresiniz. Onaylıyor musunuz? (Demo)`)) return;

    if (!db) db = getFirestore();
    const points = amount * 10;

    try {
        await addDoc(collection(db, "donations"), {
            donorId: $auth.currentUser.uid,
            amount: parseInt(amount),
            points: points,
            packageName: packageName,
            distributed: false,   // ← motor bu flag'i kullanır
            createdAt: new Date().toISOString()
        });

        alert("Bağışınız başarıyla alındı! Teşekkür ederiz.");
        fetchDonationHistory();
        // Havuzu da güncelle
        pendingPool.value = await fetchPendingPool(db)
    } catch (error) {
        console.error("Bağış hatası:", error);
    }
}

// ── DAĞITIMI BAŞLAT ──
const triggerDistribution = async () => {
    if (!db) db = getFirestore()
    isDistributing.value = true
    lastDistributionResult.value = null

    const result = await distributePoints(db, $auth.currentUser?.uid || 'donor')
    lastDistributionResult.value = result
    isDistributing.value = false

    if (result.success) {
        // Havuzu sıfırla, geçmişi güncelle
        pendingPool.value = 0
        await loadDistributionHistory()
        fetchDonationHistory()
    }
}

// ── Dağıtım geçmişi yükle ──
const loadDistributionHistory = async () => {
    if (!db) db = getFirestore()
    distributionHistory.value = await fetchDistributionHistory(db, 10)
}

const handleCustomDonation = () => {
    if (!customAmount.value || customAmount.value < 50) {
        alert("Minimum bağış tutarı 50 TL'dir.");
        return;
    }
    processDonation(customAmount.value, 'Özel Bağış');
}

const fetchDonationHistory = async () => {
    if (!db) db = getFirestore();
    const q = query(collection(db, "donations"), where("donorId", "==", $auth.currentUser.uid));
    const snap = await getDocs(q);

    let history = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    donationHistory.value = history;
    donationCount.value = history.length;
    totalDonatedPoints.value = history.reduce((acc, curr) => acc + (curr.points || 0), 0);
}

const handleLogout = async () => {
    await signOut($auth);
    router.push('/');
}

onMounted(() => {
    db = getFirestore();
    onAuthStateChanged($auth, async (user) => {
        if (user) {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.role !== 'donor') {
                    if (data.role === 'student') router.push('/dashboard');
                    else if (data.role === 'teacher') router.push('/dashboard-teacher');
                    return;
                }
                userDisplayName.value = data.firstName + ' ' + data.lastName || user.email;
                userEmail.value = user.email;
                if (data.firstName) {
                    currentAvatarUrl.value = `https://ui-avatars.com/api/?name=${data.firstName}+${data.lastName}&background=00c853&color=fff`;
                }

                fetchDonationHistory();
                // Dağıtım motoru verilerini yükle
                pendingPool.value = await fetchPendingPool(db)
                await loadDistributionHistory()
            }
        } else {
            router.push('/destek_ol');
        }
        isLoading.value = false;
    })
})
</script>

<style scoped>
/* Dashboard genel stilleri */
.dashboard-container {
    display: flex;
    min-height: 100vh;
    background-color: #0a0a0a;
    color: white;
    font-family: 'Montserrat', sans-serif;
    padding-top: 0;
    /* Mobilde padding sıfırlandı */
}

/* Sidebar Logo */
.sidebar-logo-container {
    padding: 0 10px 30px 10px;
    display: flex;
    justify-content: center;
}

.sidebar-logo-link {
    display: flex;
    flex-direction: row;
    align-items: center;
    text-decoration: none;
    gap: 15px;
}

.sidebar-logo-img {
    height: 40px;
    width: auto;
}

.eduty-text {
    font-size: 1.8rem;
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

/* Mobil Toggle Button */
.mobile-toggle-btn {
    display: none;
    position: fixed;
    top: 15px;
    left: 15px;
    z-index: 10002;
    background: #222;
    border: 1px solid #333;
    color: white;
    font-size: 1.5rem;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.sidebar-overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.8);
    z-index: 9998;
    backdrop-filter: blur(2px);
}

.loading-screen {
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: #0a0a0a;
    color: white;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #333;
    border-top: 4px solid #00c853;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

/* Sidebar */
.sidebar {
    width: 280px;
    background-color: #121212;
    border-right: 1px solid #222;
    display: flex;
    flex-direction: column;
    padding: 40px 20px;
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;
    z-index: 100;
    flex-shrink: 0;
    scrollbar-width: thin;
    scrollbar-color: #333 #121212;
}

.main-content {
    flex-grow: 1;
    padding: 20px 40px 40px 40px;
    width: calc(100% - 280px);
    position: relative;
    z-index: 1;
}

.profile-section {
    text-align: center;
    margin-bottom: 40px;
}

.avatar {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    border: 3px solid #00c853;
    object-fit: cover;
    margin-bottom: 10px;
}

.rank-badge {
    background: #00c853;
    color: black;
    padding: 4px 12px;
    border-radius: 20px;
    font-weight: bold;
    font-size: 0.8rem;
    display: inline-block;
    margin-top: -15px;
    position: relative;
}

.user-name {
    font-size: 1.2rem;
    margin: 10px 0 5px;
    color: white;
}

.user-email {
    font-size: 0.8rem;
    color: #666;
}

.user-role-info {
    color: #00c853;
    font-size: 0.9rem;
    margin-top: 5px;
}

/* Navigasyon */
.sidebar-nav {
    display: flex;
    flex-direction: column;
    margin-bottom: 20px;
}

.sidebar-nav button,
.nav-link-home {
    background: transparent;
    border: none;
    color: #aaa;
    text-align: left;
    padding: 14px 15px;
    border-radius: 12px;
    cursor: pointer;
    transition: 0.3s;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    margin-bottom: 5px;
    text-decoration: none;
    font-family: inherit;
}

.sidebar-nav button:hover,
.sidebar-nav button.active {
    background: rgba(0, 200, 83, 0.1);
    color: #00c853;
}

.nav-link-home:hover {
    color: white;
    background: #222;
}

.sidebar-divider {
    height: 1px;
    background: #222;
    margin: 10px 0;
}

.logout-btn {
    margin-top: auto;
    padding: 10px;
    background: #1a1a1a;
    border: 1px solid #333;
    color: #ff4444;
    border-radius: 8px;
    cursor: pointer;
    width: 100%;
}

.logout-btn:hover {
    background: #2a1a1a;
}

/* Content Header */
.content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40px;
    background: linear-gradient(90deg, #111, #1a1a1a);
    padding: 30px;
    border-radius: 16px;
    border: 1px solid #222;
    flex-wrap: wrap;
    gap: 20px;
    position: relative;
    z-index: 10;
}

.score-card {
    display: flex;
    flex-direction: column;
}

.score-label {
    color: #888;
    font-size: 0.8rem;
    letter-spacing: 1px;
}

.score-value {
    font-size: 2.5rem;
    font-weight: 800;
    color: #00c853;
}

.score-value span {
    font-size: 1rem;
    color: #eee;
}

.quick-stats {
    display: flex;
    align-items: center;
}

.q-item {
    text-align: center;
    background: #000;
    padding: 15px 25px;
    border-radius: 12px;
    border: 1px solid #222;
}

.q-val {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: #00c853;
}

.q-lab {
    font-size: 0.8rem;
    color: #666;
}

/* RESPONSIVE GÜNCELLEMELER */
@media (max-width: 1024px) {
    .mobile-toggle-btn {
        display: block;
    }

    .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        width: 280px;
        z-index: 9999;
        transform: translateX(-100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 5px 0 15px rgba(0, 0, 0, 0.5);
        height: 100%;
        overflow-y: auto;
        background: #121212;
    }

    .sidebar.open {
        transform: translateX(0);
    }

    .sidebar-overlay {
        display: block;
        z-index: 9998;
    }

    .main-content {
        margin-left: 0;
        width: 100%;
        padding: 70px 20px 20px 20px;
    }
}

/* Diğer mevcut stiller */
.section-title {
    font-size: 1.8rem;
    margin-bottom: 20px;
    color: white;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
}

.stat-box {
    background: #161616;
    padding: 25px;
    border-radius: 12px;
    border: 1px solid #333;
    text-align: center;
}

.stat-box h4 {
    color: #888;
    font-size: 0.9rem;
    margin-bottom: 10px;
}

.stat-box p {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 5px;
}

.stat-box small {
    color: #555;
    font-size: 0.8rem;
}

.highlight-green {
    color: #00c853;
}

.highlight-blue {
    color: #2979ff;
}

.impact-message {
    background: linear-gradient(45deg, #161616, #1a1a1a);
    padding: 30px;
    border-radius: 16px;
    border: 1px solid #333;
    text-align: center;
    border-left: 5px solid #00c853;
}

.impact-message h3 {
    color: white;
    margin-bottom: 10px;
}

.impact-message p {
    color: #ccc;
    font-size: 1.1rem;
}

.history-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #161616;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #333;
}

.h-left {
    display: flex;
    align-items: center;
    gap: 15px;
}

.h-icon {
    font-size: 1.5rem;
    background: #222;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.h-left h4 {
    margin: 0 0 5px 0;
    color: white;
}

.h-left small {
    color: #666;
}

.h-right {
    text-align: right;
    display: flex;
    flex-direction: column;
}

.h-amount {
    font-size: 1.2rem;
    font-weight: bold;
    color: white;
}

.h-points {
    font-size: 0.9rem;
    color: #00c853;
}

.empty-state {
    text-align: center;
    padding: 50px;
    color: #666;
    border: 2px dashed #333;
    border-radius: 12px;
}

.packages-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
}

.package-card {
    background: #161616;
    border: 1px solid #333;
    padding: 30px;
    border-radius: 16px;
    text-align: center;
    position: relative;
    display: flex;
    flex-direction: column;
}

.package-card.featured {
    border: 2px solid #00c853;
    transform: translateY(-10px);
    background: #0e0e0e;
}

.best-value {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: #00c853;
    color: black;
    font-weight: bold;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.8rem;
}

.pkg-header {
    font-size: 1.2rem;
    font-weight: bold;
    color: white;
    margin-bottom: 10px;
}

.price {
    font-size: 2rem;
    color: #00c853;
    font-weight: bold;
    margin-bottom: 20px;
}

.features {
    list-style: none;
    padding: 0;
    text-align: left;
    margin-bottom: 20px;
    flex-grow: 1;
}

.features li {
    margin-bottom: 8px;
    color: #ccc;
    font-size: 0.9rem;
}

.btn-select {
    width: 100%;
    padding: 12px;
    background: transparent;
    border: 1px solid #555;
    color: white;
    border-radius: 8px;
    cursor: pointer;
    transition: 0.3s;
}

.btn-select:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: white;
}

.featured-btn {
    background: #00c853;
    border-color: #00c853;
    color: black;
    font-weight: bold;
}

.featured-btn:hover {
    background: #00e676;
}

.custom-input-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    background: #222;
    padding: 10px;
    border-radius: 8px;
    margin-bottom: 20px;
}

.custom-input-wrapper input {
    background: transparent;
    border: none;
    color: white;
    font-size: 1.5rem;
    width: 100px;
    text-align: center;
    font-weight: bold;
}

.custom-input-wrapper input:focus {
    outline: none;
}

.animate-fade {
    animation: fadeIn 0.4s ease-in-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* ── Bağış geçmişinde dağıtım durumu ── */
.h-status {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 20px;
    margin-top: 4px;
    display: inline-block;
}

.h-status.distributed {
    background: rgba(0, 200, 83, 0.15);
    color: #00c853;
}

.h-status.pending {
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
}

/* ── Sidebar bekleyen puan rozeti ── */
.pending-badge {
    background: #f59e0b;
    color: black;
    font-size: 0.65rem;
    font-weight: 800;
    padding: 2px 7px;
    border-radius: 20px;
    margin-left: auto;
}

/* ── Havuz durumu kartı ── */
.pool-status-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, #0d1a0d, #111);
    border: 1px solid #1a3d1a;
    border-left: 5px solid #00c853;
    border-radius: 16px;
    padding: 35px 40px;
    margin-bottom: 30px;
    gap: 30px;
    flex-wrap: wrap;
}

.pool-label {
    font-size: 0.8rem;
    color: #666;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 10px;
}

.pool-value {
    font-size: 3rem;
    font-weight: 800;
    color: #00c853;
    line-height: 1;
    margin-bottom: 12px;
}

.pool-value span {
    font-size: 1rem;
    color: #aaa;
    margin-left: 6px;
}

.pool-value.pool-empty {
    color: #444;
}

.pool-sub {
    font-size: 0.85rem;
    color: #666;
    max-width: 360px;
}

.empty-pool-msg {
    color: #555;
    font-style: italic;
}

.pool-right {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    min-width: 200px;
}

.btn-distribute {
    background: linear-gradient(135deg, #00c853, #00e676);
    color: black;
    border: none;
    padding: 18px 35px;
    border-radius: 12px;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: 0.3s;
    width: 100%;
    justify-content: center;
}

.btn-distribute:hover:not(:disabled) {
    background: linear-gradient(135deg, #00e676, #69f0ae);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 200, 83, 0.3);
}

.btn-distribute.disabled,
.btn-distribute:disabled {
    background: #1a1a1a;
    color: #444;
    cursor: not-allowed;
    border: 1px solid #333;
}

.btn-distribute.loading {
    background: #1a3d1a;
    color: #00c853;
    cursor: wait;
}

.btn-spinner {
    width: 18px;
    height: 18px;
    border: 3px solid rgba(0, 200, 83, 0.3);
    border-top-color: #00c853;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    display: inline-block;
}

.distribute-note {
    font-size: 0.75rem;
    color: #555;
    text-align: center;
}

/* ── Dağıtım sonuç kartı ── */
.dist-result-card {
    border-radius: 16px;
    padding: 30px;
    margin-bottom: 30px;
    border: 1px solid #333;
}

.result-success {
    background: linear-gradient(135deg, #0a1f0a, #0d1a0d);
    border-color: #1a4d1a;
}

.result-error {
    background: linear-gradient(135deg, #1a0a0a, #200d0d);
    border-color: #4d1a1a;
}

.dist-result-card h3 {
    font-size: 1.4rem;
    margin-bottom: 20px;
    color: #00c853;
}

.result-error h3 {
    color: #f59e0b;
}

.dist-result-card p {
    color: #aaa;
}

.dist-result-stats {
    display: flex;
    gap: 20px;
    margin-bottom: 25px;
    flex-wrap: wrap;
}

.dr-stat {
    background: rgba(0, 0, 0, 0.4);
    border-radius: 12px;
    padding: 15px 20px;
    text-align: center;
    min-width: 120px;
    flex: 1;
}

.dr-val {
    display: block;
    font-size: 1.8rem;
    font-weight: 800;
    color: #00c853;
}

.dr-lab {
    font-size: 0.75rem;
    color: #666;
}

/* ── Kırılım tablosu ── */
.breakdown-table {
    margin-top: 20px;
}

.breakdown-table h4 {
    font-size: 1rem;
    color: #888;
    margin-bottom: 12px;
}

.breakdown-header,
.breakdown-row {
    display: grid;
    grid-template-columns: 2fr 2fr 1fr 1.5fr;
    gap: 10px;
    padding: 10px 15px;
    font-size: 0.85rem;
}

.breakdown-header {
    color: #555;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #222;
}

.breakdown-row {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    margin-bottom: 4px;
    align-items: center;
    color: #ccc;
}

.br-name {
    font-weight: 600;
    color: white;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.br-rate {
    display: flex;
    align-items: center;
    gap: 8px;
}

.rate-bar {
    flex: 1;
    height: 6px;
    background: #222;
    border-radius: 3px;
    overflow: hidden;
    max-width: 60px;
}

.rate-fill {
    height: 100%;
    background: linear-gradient(90deg, #00c853, #00e676);
    border-radius: 3px;
    transition: width 0.5s ease;
}

.br-earned {
    color: #00c853;
    font-weight: 700;
}

.br-total {
    font-weight: 600;
}

/* ── Algoritma açıklaması ── */
.algo-explainer {
    background: #111;
    border: 1px solid #222;
    border-radius: 16px;
    padding: 30px;
    margin-bottom: 30px;
}

.algo-explainer h3 {
    font-size: 1.1rem;
    margin-bottom: 20px;
    color: #aaa;
}

.algo-steps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
}

.algo-step {
    display: flex;
    gap: 15px;
    align-items: flex-start;
}

.step-num {
    width: 32px;
    height: 32px;
    background: #00c853;
    color: black;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 0.9rem;
    flex-shrink: 0;
}

.step-text {
    font-size: 0.85rem;
    color: #888;
    line-height: 1.6;
}

.step-text strong {
    color: #ccc;
    display: block;
    margin-bottom: 3px;
}

/* ── Dağıtım geçmişi ── */
.dist-history-section {
    margin-top: 10px;
}

.dist-history-section h3 {
    font-size: 1.1rem;
    color: #aaa;
    margin-bottom: 15px;
}

.dist-history-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.dist-history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #111;
    border: 1px solid #222;
    border-radius: 12px;
    padding: 18px 20px;
}

.dh-left {
    display: flex;
    align-items: center;
    gap: 15px;
}

.dh-icon {
    font-size: 1.5rem;
}

.dh-left h4 {
    margin: 0 0 4px;
    font-size: 0.95rem;
    color: white;
}

.dh-left small {
    color: #555;
    font-size: 0.78rem;
    display: block;
}

.dh-date {
    color: #444 !important;
    margin-top: 2px;
}

.dh-badge {
    background: rgba(0, 200, 83, 0.1);
    color: #00c853;
    border: 1px solid rgba(0, 200, 83, 0.2);
    border-radius: 20px;
    padding: 4px 12px;
    font-size: 0.75rem;
    font-weight: 600;
}
</style>