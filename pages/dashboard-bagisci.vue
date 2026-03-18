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
                <button @click="{ activeTab = 'vault'; isSidebarOpen = false }"
                    :class="{ active: activeTab === 'vault' }">
                    <span class="icon">🏦</span> Kasa Durumu
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
                        <p>Sizin sayenizde <strong>{{ studentsHelped }}</strong> öğrenci eğitime
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
                            <div class="price">{{ pkg.points?.toLocaleString('tr-TR') }} <span class="price-unit">puan</span></div>
                            <div class="price-sub">{{ pkg.price }} ₺ karşılığı</div>
                            <ul class="features">
                                <li v-for="feat in pkg.features" :key="feat">{{ feat }}</li>
                            </ul>
                            <button class="btn-select" :class="{ 'featured-btn': pkg.featured }"
                                @click="processDonation(pkg.price, pkg.name, pkg.points)" :disabled="isDonating">
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
                            <button class="btn-select" @click="handleCustomDonation" :disabled="isDonating">{{ isDonating ? "İşleniyor..." : "Destek Ol" }}</button>
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
                                <span class="h-points">+{{ (item.totalPoints || item.points) }} Puan</span>
                                <span class="h-status" :class="item.distributed ? 'distributed' : 'pending'">
                                    {{ item.distributed ? '✅ Dağıtıldı' : '⏳ Bekliyor' }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ===== PUAN DAĞITIM SEKMESİ ===== -->
                <div v-if="activeTab === 'vault'" class="animate-fade">
                    <h2 class="section-title">🏦 Kasa Durumu</h2>

                    <div class="vault-status-card">
                        <div class="vault-main">
                            <div class="vault-icon">🏦</div>
                            <div class="vault-info">
                                <div class="vault-label">Ana Kasa Bakiyesi</div>
                                <div class="vault-balance">{{ vaultStats.totalBalance?.toLocaleString('tr-TR') || 0 }} <span>Puan</span></div>
                                <div class="vault-sub">Öğrencilerin test çözerek kazanabileceği puan</div>
                            </div>
                        </div>
                        <div class="vault-stats-row">
                            <div class="vs-item">
                                <span class="vs-val">{{ vaultStats.totalIn?.toLocaleString('tr-TR') || 0 }}</span>
                                <span class="vs-lab">Toplam Giren</span>
                            </div>
                            <div class="vs-divider"></div>
                            <div class="vs-item">
                                <span class="vs-val">{{ vaultStats.totalOut?.toLocaleString('tr-TR') || 0 }}</span>
                                <span class="vs-lab">Öğrencilere Dağıtılan</span>
                            </div>
                            <div class="vs-divider"></div>
                            <div class="vs-item">
                                <span class="vs-val">{{ estimatedStudentsCanHelp }}</span>
                                <span class="vs-lab">Yardım Edebilecek Öğrenci</span>
                            </div>
                        </div>
                    </div>

                    <!-- 🎯 DAĞIT BUTONU -->
                    <div class="distribute-hero">
                        <div class="dh-left">
                            <div class="dh-icon">🎯</div>
                            <div>
                                <h3>Puanları Öğrencilere Dağıt</h3>
                                <p>
                                    Kasadaki <strong>{{ (vaultStats.totalBalance || 0).toLocaleString('tr-TR') }} puan</strong>
                                    şu an öğrencilerin test çözmesini bekliyor.
                                    Butona basarak puanları aktif hale getir ve öğrencilerin kazanmaya başlamasını sağla!
                                </p>
                                <div class="dh-impact" v-if="(vaultStats.totalBalance || 0) > 0">
                                    💡 Bu puanlarla yaklaşık <strong>{{ estimatedStudentsCanHelp }} öğrenci</strong> ders alabilir.
                                </div>
                            </div>
                        </div>
                        <div class="dh-right">
                            <button
                                class="btn-distribute-hero"
                                :class="{ 'btn-dist-loading': isDonating, 'btn-dist-empty': (vaultStats.totalBalance || 0) === 0 }"
                                :disabled="(vaultStats.totalBalance || 0) === 0 || isDonating"
                                @click="celebrateDistribute"
                            >
                                <span v-if="isDonating" class="btn-spinner"></span>
                                <span v-else-if="distributeSuccess">🎉 Dağıtıldı!</span>
                                <span v-else-if="(vaultStats.totalBalance || 0) === 0">⏸ Kasa Boş</span>
                                <span v-else>🚀 Dağıtımı Başlat</span>
                            </button>
                            <small v-if="(vaultStats.totalBalance || 0) > 0" class="dh-note">
                                Puanlar öğrencilerin test çözdükçe otomatik aktarılır.
                            </small>
                        </div>
                    </div>

                    <div class="vault-info-box">
                        <h3>💡 Bağışınız Nasıl Çalışır?</h3>
                        <div class="vault-steps">
                            <div class="vault-step">
                                <span class="step-num">1</span>
                                <div>
                                    <strong>Bağış Yaparsınız</strong>
                                    <p>Ödemenizin %92'si Ana Kasa'ya aktarılır, %8'i platform giderlerine ayrılır.</p>
                                </div>
                            </div>
                            <div class="vault-step">
                                <span class="step-num">2</span>
                                <div>
                                    <strong>Öğrenci Test Çözer</strong>
                                    <p>Her test çözümünde öğrenci başarı oranına göre kasadan puan kazanır.</p>
                                </div>
                            </div>
                            <div class="vault-step">
                                <span class="step-num">3</span>
                                <div>
                                    <strong>Öğrenci Ders Alır</strong>
                                    <p>Kazandığı puanla öğretmenlerden ücretsiz ders alır.</p>
                                </div>
                            </div>
                            <div class="vault-step">
                                <span class="step-num">4</span>
                                <div>
                                    <strong>Kasa Yenilenir</strong>
                                    <p>Öğretmenler ders ücretinin %20'sini kasaya iade eder — döngü devam eder.</p>
                                </div>
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
import { addToVault, getVaultStats } from '~/utils/mainVault.js'

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
const vaultStats = ref({ totalBalance: 0, totalIn: 0, totalOut: 0 })
const distributeSuccess = ref(false)
const estimatedStudentsCanHelp = computed(() => {
    const balance = vaultStats.value.totalBalance || 0
    return Math.floor(balance / 25)
})

// Dağıt butonu — bağışçıya iyi hissettiren aksiyon
const celebrateDistribute = async () => {
    if (!db) db = getFirestore()
    isDonating.value = true
    distributeSuccess.value = false
    try {
        await new Promise(resolve => setTimeout(resolve, 1200))
        vaultStats.value = await getVaultStats(db)
        distributeSuccess.value = true
        setTimeout(() => { distributeSuccess.value = false }, 3000)
        alert(
            `🎉 Harika! Puanlar aktif!\n\n` +
            `✅ Kasadaki ${(vaultStats.value.totalBalance || 0).toLocaleString('tr-TR')} puan öğrencilere açık\n` +
            `👨‍🎓 Öğrenciler test çözdükçe puanları kazanmaya devam edecek\n` +
            `💙 Katkınız için teşekkürler!`
        )
    } catch(e) {
        console.error(e)
    } finally {
        isDonating.value = false
    }
}

// Gerçek istatistikler - Firestore'dan doldurulur
const distributedPoints = ref(0)
const usedPoints = ref(0)
const studentsHelped = ref(0)
const usageRate = computed(() => {
    if (distributedPoints.value <= 0) return 0
    return Math.floor((usedPoints.value / distributedPoints.value) * 100)
})

const packages = [
    { name: 'Başlangıç', price: 250, points: 250, features: ['✅ 230 puan öğrencilere aktarılır', '✅ Teşekkür Sertifikası'] },
    { name: 'Gelişim', price: 750, points: 750, featured: true, features: ['✅ 690 puan öğrencilere aktarılır', '✅ Özel Rozet', '✅ Aylık Rapor'] },
    { name: 'Akademi', price: 2000, points: 2000, features: ['✅ 1840 puan öğrencilere aktarılır', '✅ Kurumsal Teşekkür', '✅ Etki Raporu'] }
]

const isDonating = ref(false)
const COMMISSION_RATE = 0.08  // %8 platform payı — bağışçıya gösterilmez

// Ortalama kaç öğrenciye yardım dokunacağını hesapla
const estimatedStudentsHelped = (points) => {
    const netPoints = Math.floor(points * (1 - COMMISSION_RATE))
    // Ortalama test başına 25 puan varsayarak
    return Math.floor(netPoints / 25)
}

const processDonation = async (amount, packageName, totalPoints) => {
    if (!$auth.currentUser) { alert('Giriş yapmalısınız.'); return }
    const numAmount = parseInt(amount)
    if (!numAmount || numAmount < 1) { alert('Geçersiz tutar.'); return }

    const pointsTotal = totalPoints || numAmount
    const studentPoints = Math.floor(pointsTotal * (1 - COMMISSION_RATE))
    const estStudents = estimatedStudentsHelped(pointsTotal)
    const commissionPoints = pointsTotal - studentPoints

    if (!confirm(
        `📦 ${packageName} Paketi\n\n` +
        `💳 Ödeme: ${numAmount} ₺\n` +
        `🎯 Puan Havuzuna: ${studentPoints.toLocaleString('tr-TR')} puan\n` +
        `🏛️ Platform Giderleri: ${commissionPoints} puan (%8)\n` +
        `👨‍🎓 Tahminen ${estStudents}+ öğrenciye yardım dokunacak\n\n` +
        `Onaylıyor musunuz?`
    )) return

    if (!db) db = getFirestore()
    isDonating.value = true
    try {
        // 1. Donations koleksiyonuna kayıt (geçmiş için)
        await addDoc(collection(db, "donations"), {
            donorId: $auth.currentUser.uid,
            donorName: userDisplayName.value || $auth.currentUser.email || 'Bağışçı',
            amount: numAmount,
            points: studentPoints,        // kasaya giden net puan
            totalPoints: pointsTotal,     // bağışçının gördüğü
            commissionPoints,
            packageName,
            distributed: true,            // artık direkt kasaya gidiyor
            vaultDeposit: true,
            createdAt: new Date().toISOString()
        })

        // 2. Ana Kasaya direkt ekle
        const vaultResult = await addToVault(
            db,
            studentPoints,
            `Bağış: ${packageName} (${numAmount}₺)`,
            $auth.currentUser.uid,
            userDisplayName.value || $auth.currentUser.email || 'Bağışçı'
        )

        if (!vaultResult.success) {
            throw new Error('Kasa güncellenemedi: ' + vaultResult.error)
        }

        alert(
            `🎉 Bağışınız Ana Kasaya Eklendi!\n\n` +
            `✅ ${studentPoints.toLocaleString('tr-TR')} puan öğrenci havuzuna aktarıldı\n` +
            `👨‍🎓 Yaklaşık ${estStudents}+ öğrenci bu puanı kullanabilecek\n` +
            `📊 Etkiyi "İstatistikler" sekmesinden takip edebilirsiniz`
        )

        customAmount.value = null
        await fetchDonationHistory()
        await fetchRealStats()
        activeTab.value = 'stats'
    } catch (error) {
        console.error("Bağış hatası:", error)
        if (error.code === 'permission-denied') {
            alert('⛔ Yetki hatası! Firebase Rules güncellenmesi gerekiyor.')
        } else {
            alert('Hata: ' + error.message)
        }
    } finally {
        isDonating.value = false
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
    processDonation(customAmount.value, 'Özel Bağış', customAmount.value);
}

const fetchDonationHistory = async () => {
    if (!db) db = getFirestore()
    const q = query(collection(db, "donations"), where("donorId", "==", $auth.currentUser.uid))
    const snap = await getDocs(q)
    let history = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    donationHistory.value = history
    donationCount.value = history.length
    // Bağışçıya totalPoints göster (gördüğü puan), yoksa points'e düş
    totalDonatedPoints.value = history.reduce((acc, curr) => acc + (curr.totalPoints || curr.points || 0), 0)
    distributedPoints.value = history.filter(d => d.distributed).reduce((acc, d) => acc + (d.totalPoints || d.points || 0), 0)
    // Bekleyen havuz: dağıtılmamış bağışların totalPoints toplamı
    pendingPool.value = history
        .filter(d => !d.distributed)
        .reduce((acc, d) => acc + (d.totalPoints || d.points || 0), 0)
}

const fetchRealStats = async () => {
    if (!db) db = getFirestore()
    try {
        const distSnap = await getDocs(collection(db, 'distributions'))
        const allStudents = new Set()
        distSnap.docs.forEach(d => {
            const data = d.data()
            if (data.breakdown) data.breakdown.forEach(row => allStudents.add(row.uid))
        })
        studentsHelped.value = allStudents.size
        const booksSnap = await getDocs(query(collection(db, 'bookings'), where('status', '==', 'completed')))
        usedPoints.value = booksSnap.docs.reduce((acc, d) => acc + (d.data().lessonPrice || 0), 0)
    } catch(e) { console.error('Stats yüklenemedi:', e) }
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

                await fetchDonationHistory();
                // Kasa istatistiklerini yükle
                vaultStats.value = await getVaultStats(db)
                await fetchRealStats()
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
    background-color: #060d1f;
    color: white;
    font-family: 'DM Sans', 'Montserrat', sans-serif;
    padding-top: 0;
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
    gap: 12px;
}

.sidebar-logo-img {
    height: 40px;
    width: auto;
    filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.4));
}

.eduty-text {
    font-size: 1.8rem;
    font-weight: 800;
    letter-spacing: 2px;
    display: flex;
    gap: 1px;
    font-family: 'DM Sans', 'Segoe UI', sans-serif;
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
    background: #060d1f;
    color: white;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #1a2a4a;
    border-top: 4px solid #00c853;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Sidebar */
.sidebar {
    width: 280px;
    background: linear-gradient(160deg, #080f25 0%, #0a1228 100%);
    border-right: 1px solid rgba(0, 200, 83, 0.12);
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
    scrollbar-color: #1a2a4a #080f25;
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
    background: rgba(255,255,255,0.06);
}

.sidebar-divider {
    height: 1px;
    background: rgba(0, 200, 83, 0.1);
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
    background: linear-gradient(135deg, #080f25 0%, #0a1a20 100%);
    padding: 30px;
    border-radius: 16px;
    border: 1px solid rgba(0, 200, 83, 0.12);
    flex-wrap: wrap;
    gap: 20px;
    position: relative;
    z-index: 10;
    box-shadow: 0 8px 32px rgba(0, 20, 40, 0.3);
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
    background: rgba(8, 15, 37, 0.9);
    padding: 15px 25px;
    border-radius: 12px;
    border: 1px solid rgba(0, 200, 83, 0.15);
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
        background: linear-gradient(160deg, #080f25 0%, #0a1228 100%);
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
    background: rgba(8, 15, 37, 0.8);
    padding: 25px;
    border-radius: 12px;
    border: 1px solid rgba(56, 189, 248, 0.1);
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
    background: linear-gradient(135deg, #080f25, #091a12);
    padding: 30px;
    border-radius: 16px;
    border: 1px solid rgba(0, 200, 83, 0.15);
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
    background: rgba(8, 15, 37, 0.8);
    padding: 20px;
    border-radius: 12px;
    border: 1px solid rgba(56, 189, 248, 0.1);
}

.h-left {
    display: flex;
    align-items: center;
    gap: 15px;
}

.h-icon {
    font-size: 1.5rem;
    background: rgba(56, 189, 248, 0.08);
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
    background: rgba(8, 15, 37, 0.9);
    border: 1px solid rgba(56, 189, 248, 0.1);
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
    margin-bottom: 4px;
}

.price-unit {
    font-size: 1rem;
    color: #00c853;
    font-weight: 600;
}

.price-sub {
    font-size: 0.8rem;
    color: #555;
    margin-bottom: 16px;
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
/* ── Dağıt Butonu ── */
.distribute-hero {
    background: linear-gradient(135deg, #0a1a0a, #0d1a10);
    border: 1px solid #1a3a1a;
    border-radius: 16px; padding: 25px;
    display: flex; align-items: center;
    justify-content: space-between;
    gap: 20px; flex-wrap: wrap;
    margin-bottom: 20px;
}
.dh-left { display: flex; align-items: flex-start; gap: 16px; flex: 1; }
.dh-icon { font-size: 2.5rem; flex-shrink: 0; }
.dh-left h3 { color: white; font-size: 1rem; margin-bottom: 8px; }
.dh-left p { color: #888; font-size: 0.85rem; line-height: 1.6; margin: 0 0 8px; }
.dh-impact { color: #00c853; font-size: 0.82rem; }
.dh-right { display: flex; flex-direction: column; align-items: center; gap: 8px; flex-shrink: 0; }
.btn-distribute-hero {
    background: linear-gradient(135deg, #00c853, #00a844);
    color: white; border: none;
    padding: 16px 32px; border-radius: 12px;
    font-size: 1rem; font-weight: 800;
    cursor: pointer; transition: 0.2s;
    white-space: nowrap; min-width: 180px;
    box-shadow: 0 4px 20px rgba(0,200,83,0.3);
    display: flex; align-items: center; justify-content: center; gap: 8px;
}
.btn-distribute-hero:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,200,83,0.4); }
.btn-dist-loading { background: #333 !important; box-shadow: none !important; cursor: not-allowed !important; }
.btn-dist-empty { background: #1a1a1a !important; color: #444 !important; box-shadow: none !important; cursor: not-allowed !important; }
.dh-note { font-size: 0.72rem; color: #555; text-align: center; max-width: 180px; }

/* ── Kasa Durumu ── */
.vault-status-card {
    background: linear-gradient(135deg, #0a1020, #0d1830);
    border: 1px solid #1e3050;
    border-radius: 16px; padding: 25px; margin-bottom: 25px;
}
.vault-main { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }
.vault-icon { font-size: 3rem; }
.vault-label { font-size: 0.78rem; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
.vault-balance { font-size: 2.2rem; font-weight: 800; color: #00c853; }
.vault-balance span { font-size: 1rem; color: #888; }
.vault-sub { font-size: 0.78rem; color: #555; margin-top: 4px; }
.vault-stats-row { display: flex; background: rgba(0,0,0,0.3); border-radius: 12px; overflow: hidden; }
.vs-item { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 12px; }
.vs-val { font-size: 1.3rem; font-weight: 800; color: #00c853; }
.vs-lab { font-size: 0.65rem; color: #555; margin-top: 3px; text-align: center; }
.vs-divider { width: 1px; background: #1a1a1a; flex-shrink: 0; }

.vault-info-box {
    background: #111; border: 1px solid #1a1a1a;
    border-radius: 14px; padding: 25px;
}
.vault-info-box h3 { color: white; font-size: 1rem; margin-bottom: 20px; }
.vault-steps { display: flex; flex-direction: column; gap: 15px; }
.vault-step { display: flex; gap: 15px; align-items: flex-start; }
.step-num {
    width: 28px; height: 28px; background: #00c853;
    color: black; border-radius: 50%; display: flex;
    align-items: center; justify-content: center;
    font-weight: 800; font-size: 0.85rem; flex-shrink: 0;
}
.vault-step strong { display: block; color: white; font-size: 0.88rem; margin-bottom: 3px; }
.vault-step p { color: #666; font-size: 0.8rem; line-height: 1.5; margin: 0; }

</style>