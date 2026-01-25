<template>
    <div v-if="isLoading" class="loading-screen">
        <div class="spinner"></div>
        <p>Veriler yükleniyor...</p>
    </div>

    <div v-else-if="isStudent" class="dashboard-container">

        <div v-if="isProfileModalOpen" class="modal-overlay">
            <div class="modal-content">
                <h3>Profili Düzenle</h3>

                <div class="modal-body">
                    <label>Adınız Soyadınız:</label>
                    <input type="text" v-model="tempProfile.name" placeholder="Örn: Ali Yılmaz" />

                    <label>Sınıfınız:</label>
                    <select v-model="tempProfile.grade" class="modal-select">
                        <option :value="null" disabled>Seçiniz</option>
                        <option v-for="g in availableGrades" :key="g" :value="g">
                            {{ g === 'Mezun' ? 'Mezun' : g + '. Sınıf' }}
                        </option>
                    </select>

                    <label>Profil Fotoğrafı:</label>
                    <div class="avatar-selection">
                        <div class="avatar-option"
                            :class="{ selected: tempProfile.avatarType === 'upload' && tempProfile.uploadedImage }"
                            @click="triggerFileUpload">
                            <span>📁</span>
                            <small>Yükle</small>
                        </div>
                        <input type="file" ref="fileInput" @change="handleFileUpload" style="display: none"
                            accept="image/*">

                        <div v-for="(avatar, index) in presetAvatars" :key="index" class="avatar-option"
                            :class="{ selected: tempProfile.avatarType === 'preset' && tempProfile.selectedPreset === avatar }"
                            @click="selectPresetAvatar(avatar)">
                            <img :src="avatar" alt="Avatar" />
                        </div>
                    </div>
                </div>

                <div class="modal-actions">
                    <button @click="isProfileModalOpen = false" class="btn-cancel">İptal</button>
                    <button @click="saveProfile" class="btn-save">Kaydet</button>
                </div>
            </div>
        </div>
        <aside class="sidebar">
            <div class="profile-section">
                <div class="avatar-wrapper">
                    <button class="edit-profile-btn" @click="openProfileModal" title="Profili Düzenle">✏️</button>

                    <img :src="currentAvatarUrl" alt="Profil" class="avatar" />
                    <div class="rank-badge" :class="studentRank.class">{{ studentRank.title }}</div>
                </div>
                <h3 class="user-name">{{ userDisplayName || 'Öğrenci' }}</h3>
                <p class="user-email">{{ userEmail }}</p>
                <p v-if="userGrade" class="user-grade-info">{{ userGrade === 'Mezun' || userGrade === 13 ? 'Mezun' : userGrade + '. Sınıf' }}</p>
            </div>

            <nav class="sidebar-nav">
                <button @click="activeTab = 'stats'" :class="{ active: activeTab === 'stats' }">
                    <span class="icon">📊</span> İstatistiklerim
                </button>
                <button @click="activeTab = 'test-solve'" :class="{ active: activeTab === 'test-solve' }">
                    <span class="icon">📝</span> Test Çöz
                </button>
                <button @click="activeTab = 'find-teacher'" :class="{ active: activeTab === 'find-teacher' }">
                    <span class="icon">🔍</span> Öğretmen Ara
                </button>
                <button @click="activeTab = 'favorites'" :class="{ active: activeTab === 'favorites' }">
                    <span class="icon">⭐</span> Favori Öğretmenlerim
                </button>
                <button @click="activeTab = 'history'" :class="{ active: activeTab === 'history' }">
                    <span class="icon">📚</span> Geçmiş Derslerim
                </button>
                <button @click="activeTab = 'messages'" :class="{ active: activeTab === 'messages' }">
                    <span class="icon">💬</span> Mesajlar
                </button>
            </nav>

            <button @click="handleLogout" class="logout-btn">Çıkış Yap</button>
        </aside>

        <main class="main-content">
            <header class="content-header">
                <div class="score-card">
                    <span class="score-label">TOPLAM EDUTY PUANI</span>
                    <div class="score-value">{{ studentScore }} <span>Puan</span></div>
                </div>
                <div class="quick-stats">
                    <div class="q-item">
                        <span class="q-val">{{ completedLessons }}</span>
                        <span class="q-lab">Bitirilen Ders</span>
                    </div>
                </div>
            </header>

            <section class="tab-content">
                <div v-if="activeTab === 'stats'" class="animate-fade">
                    <h2 class="section-title">Genel İstatistikler</h2>
                    <div class="stats-grid" v-if="completedLessons > 0">
                        <div class="stat-box">
                            <h4>Çözülen Test</h4>
                            <p>24</p>
                        </div>
                        <div class="stat-box">
                            <h4>Başarı Oranı</h4>
                            <p>%85</p>
                        </div>
                        <div class="stat-box">
                            <h4>Haftalık Puan</h4>
                            <p>+450</p>
                        </div>
                    </div>
                    <div v-else class="empty-state">
                        <p>Henüz bir test çözmedin. Test çözerek puan kazanmaya başlayabilirsin! 🚀</p>
                    </div>
                </div>

                <div v-if="activeTab === 'test-solve'" class="animate-fade">
                    <h2 class="section-title">Test Çöz</h2>
                    <p style="color:#888; margin-bottom: 20px;">Öğretmenler tarafından yüklenen güncel testler aşağıdadır.</p>

                    <div v-if="availableTests.length === 0" class="empty-state">
                        <span class="icon-empty">📂</span>
                        <p>Henüz yüklenmiş bir test bulunmuyor.</p>
                    </div>

                    <div v-else class="test-grid">
                        <div v-for="test in availableTests" :key="test.id" class="test-card">
                            <div class="test-header">
                                <span class="badge-subject">{{ test.subject }}</span>
                                <span class="badge-grade">{{ test.grade === 'Mezun' ? 'Mezun' : test.grade + '. Sınıf' }}</span>
                            </div>
                            <h3>{{ test.title }}</h3>
                            <div class="test-meta">
                                <span>👤 {{ test.uploaderName }}</span>
                                <span>❓ {{ test.questionCount }} Soru</span>
                            </div>
                            <button class="btn-start-test" @click="startTest(test)">Testi Başlat</button>
                        </div>
                    </div>
                </div>

                <div v-if="activeTab === 'find-teacher'" class="animate-fade">
                    <h2 class="section-title">Öğretmen Ara</h2>
                    <div class="filter-bar">
                        <select v-model="filters.subject">
                            <option value="">Tüm Dersler</option>
                            <option v-for="l in lessons" :key="l" :value="l">{{ l }}</option>
                        </select>
                        <select v-model="filters.time">
                            <option value="">Tüm Saatler</option>
                            <option value="09:00-12:00">09:00 - 12:00</option>
                            <option value="13:00-17:00">13:00 - 17:00</option>
                            <option value="18:00-22:00">18:00 - 22:00</option>
                        </select>
                    </div>

                    <div class="teachers-grid" v-if="filteredTeachers.length > 0">
                        <div v-for="teacher in filteredTeachers" :key="teacher.id" class="teacher-card">
                            <div class="teacher-img">{{ teacher.avatar }}</div>
                            <div class="teacher-info">
                                <h3>{{ teacher.name }}</h3>
                                <span class="badge">{{ teacher.subject }}</span>
                                <p class="t-time">🕒 {{ teacher.time }}</p>
                                <button class="btn-request">Ders Talep Et</button>
                            </div>
                        </div>
                    </div>

                    <div v-else class="no-results">
                        <div class="icon-warning">⚠️</div>
                        <p>Aradığınız kriterlere uygun öğretmen şu anda sistemde bulunamadı.</p>
                        <small>Farklı bir ders veya saat seçmeyi deneyebilirsiniz.</small>
                        <br>
                        <button @click="filters = { subject: '', time: '' }" class="btn-reset">Filtreleri
                            Temizle</button>
                    </div>
                </div>

                <div v-if="activeTab === 'favorites'" class="animate-fade">
                    <h2 class="section-title">Favori Öğretmenlerim</h2>
                    <div v-if="favoriteTeachers.length > 0" class="teachers-grid"></div>
                    <div v-else class="empty-favorites">
                        <div class="empty-icon">⭐</div>
                        <p>Henüz favorilere eklediğiniz bir öğretmen yok.</p>
                        <button class="btn-action-blue" @click="activeTab = 'find-teacher'">Hemen Ekle</button>
                    </div>
                </div>

                <div v-if="activeTab === 'history'" class="animate-fade">
                    <h2 class="section-title">Geçmiş Derslerim</h2>
                    <div class="history-list">
                        <p class="empty-state">Henüz tamamlanmış bir özel dersiniz bulunmuyor.</p>
                    </div>
                </div>

                <div v-if="activeTab === 'messages'" class="animate-fade messages-container">
                    <div class="chat-sidebar">
                        <div class="chat-header">Sohbetler</div>
                        <div class="chat-list empty-chat-list">
                            <small>Aktif sohbet yok</small>
                        </div>
                    </div>
                    <div class="chat-window">
                        <div class="empty-chat-state">
                            <span class="icon-msg">💬</span>
                            <h3>Mesaj Bulunamadı</h3>
                            <p>Öğretmenlerinizle yapacağınız görüşmeler burada listelenir.</p>
                        </div>
                    </div>
                </div>

            </section>
        </main>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth'
// GÜNCELLENEN IMPORT: collection ve getDocs eklendi
import { getFirestore, doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore'

const router = useRouter()
const { $auth } = useNuxtApp()
let db; 

// State
const isLoading = ref(true)
const isStudent = ref(false) // Rol Kontrolü
const activeTab = ref('stats')
const userDisplayName = ref('')
const userEmail = ref('')
const userGrade = ref(null) 
const studentScore = ref(0)
const completedLessons = ref(0)
const favoriteTeachers = ref([])
const availableTests = ref([]) // YENİ: Testleri tutacak dizi

// Filtreler
const filters = ref({ subject: '', time: '' })

// Sınıf Listesi
const availableGrades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, "Mezun"]

// DİNAMİK DERS LİSTESİ MANTIĞI
const lessons = computed(() => {
    if (!userGrade.value) return ["Sınıf Bilgisi Yükleniyor..."]

    let g = userGrade.value
    if (g === 'Mezun') g = 12
    g = parseInt(g)

    const list = []
    list.push("Matematik")

    if (g >= 1 && g <= 8) list.push("Türkçe")
    if (g >= 3 && g <= 8) list.push("Fen Bilimleri")
    if (g >= 4 && g <= 8) list.push("Sosyal Bilgiler")

    if (g >= 9) {
        list.push("Türk Dili ve Edebiyatı") 
        list.push("Fizik")
        list.push("Kimya")
        list.push("Biyoloji")
        list.push("Tarih")
        list.push("Coğrafya")
        list.push("Felsefe")
    }

    if (g >= 2) list.push("İngilizce")
    if (g >= 5) list.push("Almanca")
    if (g >= 4) list.push("Din Kültürü")

    return list
})

// YENİ: Testleri Veritabanından Çekme Fonksiyonu
const fetchTests = async () => {
    if (!db) db = getFirestore();
    try {
        const querySnapshot = await getDocs(collection(db, "tests"));
        availableTests.value = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Testler çekilirken hata:", error);
    }
};

const startTest = (test) => {
    alert(`"${test.title}" testi başlatılıyor... (Test çözme ekranı entegrasyonu yapılacaktır)`);
    // Burada test çözme sayfasına yönlendirme yapabilirsin: router.push(`/test-coz/${test.id}`)
}

// AVATAR VE PROFİL YÖNETİMİ
const isProfileModalOpen = ref(false)
const fileInput = ref(null)

const presetAvatars = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Bubba",
    "https://api.dicebear.com/7.x/micah/svg?seed=Callie",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Cookie"
]

const profileState = ref({
    avatarType: 'initials',
    selectedPreset: '',
    uploadedImage: null
})

const tempProfile = ref({
    name: '',
    grade: null,
    avatarType: 'initials',
    selectedPreset: '',
    uploadedImage: null
})

const currentAvatarUrl = computed(() => {
    if (profileState.value.avatarType === 'upload' && profileState.value.uploadedImage) {
        return profileState.value.uploadedImage
    }
    if (profileState.value.avatarType === 'preset' && profileState.value.selectedPreset) {
        return profileState.value.selectedPreset
    }
    return `https://ui-avatars.com/api/?name=${userDisplayName.value || 'O'}&background=0055ff&color=fff`
})

const openProfileModal = () => {
    tempProfile.value = {
        name: userDisplayName.value,
        grade: userGrade.value,
        avatarType: profileState.value.avatarType,
        selectedPreset: profileState.value.selectedPreset,
        uploadedImage: profileState.value.uploadedImage
    }
    isProfileModalOpen.value = true
}

const triggerFileUpload = () => {
    fileInput.value.click()
}

const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
            tempProfile.value.uploadedImage = e.target.result
            tempProfile.value.avatarType = 'upload'
        }
        reader.readAsDataURL(file)
    }
}

const selectPresetAvatar = (url) => {
    tempProfile.value.selectedPreset = url
    tempProfile.value.avatarType = 'preset'
}

const saveProfile = async () => {
    if (!db) db = getFirestore();

    userDisplayName.value = tempProfile.value.name
    userGrade.value = tempProfile.value.grade
    
    profileState.value = {
        avatarType: tempProfile.value.avatarType,
        selectedPreset: tempProfile.value.selectedPreset,
        uploadedImage: tempProfile.value.uploadedImage
    }

    if ($auth.currentUser) {
        try {
            await updateProfile($auth.currentUser, {
                displayName: tempProfile.value.name
            })

            const userRef = doc(db, "users", $auth.currentUser.uid);
            await updateDoc(userRef, {
                displayName: tempProfile.value.name,
                grade: tempProfile.value.grade,
                avatar: {
                    type: tempProfile.value.avatarType,
                    preset: tempProfile.value.selectedPreset,
                    uploadedImage: tempProfile.value.uploadedImage 
                }
            })
            
        } catch (e) {
            console.error("Profil güncellenemedi", e)
            alert("Kaydedilirken bir hata oluştu: " + e.message)
        }
    }

    isProfileModalOpen.value = false
}

const mockTeachers = ref([])
const filteredTeachers = computed(() => {
    return mockTeachers.value.filter(t => {
        const matchSubject = filters.value.subject === '' || t.subject === filters.value.subject
        const matchTime = filters.value.time === '' || t.time === filters.value.time
        return matchSubject && matchTime
    })
})

onMounted(() => {
    db = getFirestore();

    onAuthStateChanged($auth, async (user) => {
        if (user) {
            userEmail.value = user.email
            userDisplayName.value = user.displayName || '' 

            try {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();

                    // ROL KONTROLÜ
                    if (data.role !== 'student') {
                        // Eğer öğrenci değilse, öğretmen paneline yolla
                        if (data.role === 'teacher') {
                             router.push('/dashboard-teacher');
                        } else {
                            router.push('/');
                        }
                        return;
                    }
                    
                    isStudent.value = true;
                    // Rol bilgisini localStorage'a kaydet (Navbar için)
                    localStorage.setItem('userRole', 'student');
                    
                    if (data.grade) userGrade.value = data.grade;
                    if (data.displayName) userDisplayName.value = data.displayName;

                    if (data.avatar) {
                        profileState.value = {
                            avatarType: data.avatar.type || 'initials',
                            selectedPreset: data.avatar.preset || '',
                            uploadedImage: data.avatar.uploadedImage || null
                        }
                    }

                    // YENİ: Öğrenci giriş yaptıktan sonra testleri çek
                    await fetchTests();
                }
            } catch (error) {
                console.error("Veri çekme hatası:", error);
            } finally {
                isLoading.value = false
            }

        } else {
            router.push('/kayit-giris')
        }
    })
})

const handleLogout = async () => {
    try {
        localStorage.removeItem('userRole'); // Çıkışta temizle
        await signOut($auth)
        router.push('/')
    } catch (error) {
        console.error("Çıkış hatası:", error)
    }
}

const studentRank = computed(() => {
    const s = studentScore.value
    if (s < 100) return { title: 'Acemi', class: 'rank-1' }
    if (s < 500) return { title: 'Hırslı', class: 'rank-2' }
    if (s < 1000) return { title: 'Kalfa', class: 'rank-3' }
    if (s < 2000) return { title: 'Usta', class: 'rank-4' }
    if (s < 5000) return { title: 'Doçent', class: 'rank-5' }
    return { title: 'Profesör', class: 'rank-6' }
})
</script>

<style scoped>
.dashboard-container {
    display: flex;
    min-height: 100vh;
    background-color: #0a0a0a;
    color: white;
    font-family: 'Montserrat', sans-serif;
    padding-top: 110px;
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
    border-top: 4px solid #0055ff;
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

/* SIDEBAR */
.sidebar {
    width: 280px;
    background-color: #121212;
    border-right: 1px solid #222;
    display: flex;
    flex-direction: column;
    padding: 40px 20px;
    position: fixed;
    top: 80px;
    bottom: 0;
    height: auto;
    z-index: 90;
    overflow-y: auto;
}

.main-content {
    margin-left: 280px;
    flex-grow: 1;
    padding: 40px;
    width: calc(100% - 280px);
    position: relative;
    z-index: 1;
}

.profile-section {
    text-align: center;
    margin-bottom: 40px;
}

.avatar-wrapper {
    position: relative;
    display: inline-block;
    margin-bottom: 15px;
}

.avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border: 3px solid #0055ff;
    object-fit: cover;
}

.edit-profile-btn {
    position: absolute;
    top: 0;
    right: 0;
    background: #333;
    border: 1px solid #555;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    cursor: pointer;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.2s;
    z-index: 2;
}

.edit-profile-btn:hover {
    background: #0055ff;
    border-color: #0055ff;
}

.rank-badge {
    position: absolute;
    bottom: 0;
    right: -10px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    background: #333;
}

.rank-1 {
    background: #555;
    color: white;
}

.rank-2 {
    background: #ff9800;
    color: black;
}

.rank-3 {
    background: #00bcd4;
    color: black;
}

.rank-4 {
    background: #9c27b0;
    color: white;
}

.rank-5 {
    background: #f44336;
    color: white;
}

.rank-6 {
    background: linear-gradient(45deg, #ffd700, #ff8c00);
    color: black;
}

.user-name {
    font-size: 1.2rem;
    margin-bottom: 5px;
    color: #fff;
}

.user-email {
    font-size: 0.85rem;
    color: #666;
    word-break: break-all;
}
.user-grade-info {
    color: #0055ff;
    font-weight: bold;
    font-size: 0.9rem;
    margin-top: 5px;
}

.sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex-grow: 1;
}

.sidebar-nav button {
    background: transparent;
    border: none;
    color: #aaa;
    text-align: left;
    padding: 12px 15px;
    border-radius: 8px;
    cursor: pointer;
    transition: 0.3s;
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: 10px;
}

.sidebar-nav button:hover,
.sidebar-nav button.active {
    background: rgba(0, 85, 255, 0.1);
    color: #0055ff;
}

.logout-btn {
    margin-top: 20px;
    padding: 10px;
    background: #1a1a1a;
    border: 1px solid #333;
    color: #ff4444;
    border-radius: 8px;
    cursor: pointer;
    transition: 0.3s;
}

.logout-btn:hover {
    background: #2a1a1a;
}

/* HEADER */
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
    color: #0055ff;
}

.score-value span {
    font-size: 1rem;
    color: #eee;
}

.q-item {
    text-align: center;
    background: #000;
    padding: 15px 25px;
    border-radius: 12px;
    border: 1px solid #333;
}

.q-val {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: #0055ff;
}

.q-lab {
    font-size: 0.8rem;
    color: #666;
}

.section-title {
    font-size: 1.8rem;
    margin-bottom: 30px;
    font-family: 'serif';
}

/* YENİ TEST KARTLARI STİLİ */
.test-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
}

.test-card {
    background: #161616;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #333;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: 0.3s;
}

.test-card:hover {
    transform: translateY(-5px);
    border-color: #0055ff;
    box-shadow: 0 5px 15px rgba(0, 85, 255, 0.15);
}

.test-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
}

.badge-subject {
    background: #0055ff;
    color: white;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: bold;
}

.badge-grade {
    background: #333;
    color: #ccc;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 0.75rem;
}

.test-card h3 {
    margin: 10px 0;
    font-size: 1.1rem;
    color: white;
    flex-grow: 1;
}

.test-meta {
    display: flex;
    justify-content: space-between;
    color: #888;
    font-size: 0.85rem;
    margin-bottom: 15px;
}

.btn-start-test {
    background: transparent;
    border: 1px solid #0055ff;
    color: #0055ff;
    padding: 10px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: 0.3s;
    width: 100%;
}

.btn-start-test:hover {
    background: #0055ff;
    color: white;
}

.icon-empty {
    font-size: 3rem;
    display: block;
    margin-bottom: 15px;
}

/* ESKİ DERSLER IZGARASI (Hâlâ filtrelerde kullanılabilir) */
.lessons-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
}

.filter-bar {
    display: flex;
    gap: 15px;
    margin-bottom: 30px;
    flex-wrap: wrap;
}

.filter-bar select {
    background: #161616;
    color: white;
    border: 1px solid #333;
    padding: 12px;
    border-radius: 8px;
    flex: 1;
    min-width: 200px;
}

.teachers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
}

.teacher-card {
    background: #161616;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #333;
    display: flex;
    align-items: center;
    gap: 15px;
}

.teacher-img {
    font-size: 2.5rem;
    background: #222;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.teacher-info h3 {
    margin: 0 0 5px 0;
    font-size: 1.1rem;
}

.badge {
    background: #0055ff;
    color: white;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
}

.t-time {
    color: #888;
    font-size: 0.85rem;
    margin-top: 5px;
}

.btn-request {
    margin-top: 10px;
    background: transparent;
    border: 1px solid #0055ff;
    color: #0055ff;
    padding: 5px 10px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: 0.3s;
}

.btn-request:hover {
    background: #0055ff;
    color: white;
}

.modal-select {
    width: 100%;
    padding: 10px;
    background: #0a0a0a;
    border: 1px solid #333;
    color: white;
    border-radius: 8px;
    margin-bottom: 20px;
    box-sizing: border-box;
    cursor: pointer;
}

.modal-select:focus {
    border-color: #0055ff;
    outline: none;
}

/* BOŞ DURUM VE FAVORİLER */
.no-results,
.empty-favorites {
    text-align: center;
    padding: 50px;
    border: 1px dashed #333;
    border-radius: 12px;
    color: #666;
    width: 100%;
}

.icon-warning,
.empty-icon {
    font-size: 3rem;
    margin-bottom: 15px;
    display: block;
}

.btn-reset {
    margin-top: 15px;
    background: #222;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
}

.btn-action-blue {
    margin-top: 20px;
    background-color: #0055ff;
    color: white;
    border: none;
    padding: 10px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: 0.2s;
}

.btn-action-blue:hover {
    background-color: #0044cc;
    transform: translateY(-2px);
}

.empty-state {
    text-align: center;
    padding: 100px 0;
    color: #555;
    border: 2px dashed #222;
    border-radius: 16px;
}

.stats-grid {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
}

.stat-box {
    background: #161616;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #333;
    flex: 1;
    min-width: 150px;
    text-align: center;
}

.stat-box h4 {
    font-size: 0.9rem;
    color: #888;
    margin-bottom: 10px;
}

.stat-box p {
    font-size: 1.5rem;
    font-weight: bold;
    color: white;
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

/* MODAL */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: #161616;
    padding: 30px;
    border-radius: 16px;
    width: 90%;
    max-width: 400px;
    border: 1px solid #333;
}

.modal-content h3 {
    margin-top: 0;
    margin-bottom: 20px;
    color: white;
    text-align: center;
}

.modal-body input[type="text"] {
    width: 100%;
    padding: 10px;
    background: #0a0a0a;
    border: 1px solid #333;
    color: white;
    border-radius: 8px;
    margin-bottom: 20px;
    box-sizing: border-box;
}

.avatar-selection {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 20px;
}

.avatar-option {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid transparent;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #222;
}

.avatar-option img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-option span {
    font-size: 1.5rem;
}

.avatar-option small {
    font-size: 0.6rem;
    color: #aaa;
}

.avatar-option.selected {
    border-color: #0055ff;
    background: rgba(0, 85, 255, 0.1);
}

.avatar-option:hover {
    background: #333;
}

.modal-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
}

.btn-cancel {
    background: transparent;
    color: #888;
    border: none;
    padding: 10px 20px;
    cursor: pointer;
}

.btn-save {
    background: #0055ff;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
}

/* MESAJLAŞMA ARAYÜZÜ (CHAT) */
.messages-container {
    display: flex;
    height: 600px;
    background: #161616;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid #222;
}

.chat-sidebar {
    width: 250px;
    background: #121212;
    border-right: 1px solid #222;
    display: flex;
    flex-direction: column;
}

.chat-header {
    padding: 15px;
    border-bottom: 1px solid #222;
    font-weight: bold;
    color: #fff;
}

.chat-list {
    flex-grow: 1;
    overflow-y: auto;
}

.empty-chat-list {
    display: flex;
    justify-content: center;
    align-items: center;
    color: #555;
    padding: 20px;
}

.chat-window {
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #161616;
}

.empty-chat-state {
    text-align: center;
    color: #666;
}

.icon-msg {
    font-size: 3rem;
    display: block;
    margin-bottom: 10px;
    opacity: 0.5;
}

@media (max-width: 1024px) {
    .dashboard-container {
        padding-top: 80px;
    }

    .sidebar {
        width: 80px;
        padding: 20px 10px;
        top: 60px;
    }

    .user-name,
    .user-email,
    .user-grade-info,
    .sidebar-nav button span:not(.icon) {
        display: none;
    }

    .main-content {
        margin-left: 80px;
        width: calc(100% - 80px);
        padding: 20px;
    }

    .profile-section {
        margin-bottom: 20px;
    }

    .avatar {
        width: 50px;
        height: 50px;
    }

    .rank-badge {
        display: none;
    }

    .edit-profile-btn {
        width: 20px;
        height: 20px;
        font-size: 12px;
    }

    .chat-sidebar {
        width: 80px;
    }

    .chat-header {
        display: none;
    }
}
</style>