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

        <div v-if="isBookingModalOpen" class="modal-overlay">
            <div class="modal-content booking-modal">
                <div class="modal-header">
                    <h3>Ders Zamanı Seç</h3>
                    <p>Öğretmen: <span class="highlight-text">{{ selectedTeacherForBooking?.displayName ||
                            selectedTeacherForBooking?.email }}</span></p>
                </div>

                <div class="scheduler-grid">
                    <div v-if="availableSlots.length === 0" class="no-slots">
                        Bu öğretmen için şu an uygun saat bulunamadı.
                    </div>
                    <div v-else v-for="slot in availableSlots" :key="slot.id" class="time-slot-card"
                        :class="{ 'selected': bookingSlot === slot }" @click="bookingSlot = slot">
                        <span class="slot-day">{{ slot.day }}</span>
                        <span class="slot-time">{{ slot.time }}</span>
                    </div>
                </div>

                <div class="modal-actions">
                    <button @click="isBookingModalOpen = false" class="btn-cancel">Vazgeç</button>
                    <button @click="confirmBooking" class="btn-save" :disabled="!bookingSlot">
                        {{ bookingSlot ? 'Randevuyu Onayla' : 'Saat Seçiniz' }}
                    </button>
                </div>
            </div>
        </div>

        <div v-if="isTakingTest" class="test-runner-overlay">
            <div class="test-runner-header">
                <div class="tr-info">
                    <h3>{{ currentTest?.title }}</h3>
                    <span class="tr-badge">{{ currentTest?.subject }}</span>
                </div>
                <div class="tr-tools">
                    <button @click="setTool('pen')" :class="{ active: drawingTool === 'pen' }" title="Kalem">✏️</button>
                    <button @click="setTool('eraser')" :class="{ active: drawingTool === 'eraser' }"
                        title="Silgi">🧹</button>
                    <button @click="clearCanvas" title="Temizle">🗑️</button>
                    <button class="btn-close-test" @click="confirmExitTest">Çıkış Yap</button>
                </div>
            </div>

            <div class="test-runner-body">
                <div class="pdf-container" ref="pdfContainer">
                    <iframe :src="currentTest?.pdfUrl || '/sample.pdf'" class="pdf-frame"></iframe>
                    <canvas ref="drawCanvas" class="drawing-canvas" @mousedown="startDrawing" @mousemove="draw"
                        @mouseup="stopDrawing" @mouseleave="stopDrawing"></canvas>
                </div>
                <div class="optical-form">
                    <h4>Cevap Anahtarı</h4>
                    <div class="questions-list">
                        <div v-for="n in parseInt(currentTest?.questionCount || 0)" :key="n" class="opt-row">
                            <span class="q-no">{{ n }}.</span>
                            <div class="opt-options">
                                <button v-for="opt in ['A', 'B', 'C', 'D', 'E']" :key="opt"
                                    :class="{ selected: userAnswers[n - 1] === opt }" @click="userAnswers[n - 1] = opt">
                                    {{ opt }}
                                </button>
                            </div>
                        </div>
                    </div>
                    <button class="btn-finish-test" @click="finishTest">TESTİ BİTİR</button>
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
                <p v-if="userGrade" class="user-grade-info">{{ userGrade === 'Mezun' || userGrade === 13 ? 'Mezun' :
                    userGrade + '. Sınıf' }}</p>
            </div>

            <nav class="sidebar-nav">
                <button @click="activeTab = 'stats'" :class="{ active: activeTab === 'stats' }">
                    <span class="icon">📊</span> İstatistiklerim
                </button>
                <button @click="activeTab = 'test-solve'" :class="{ active: activeTab === 'test-solve' }">
                    <span class="icon">📝</span> Test Çöz
                </button>
                <button @click="activeTab = 'calendar'" :class="{ active: activeTab === 'calendar' }">
                    <span class="icon">📅</span> Takvimim
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
                        <span class="q-lab">Bitirilen Test</span>
                    </div>
                </div>
            </header>

            <section class="tab-content">
                <div v-if="activeTab === 'stats'" class="animate-fade">
                    <h2 class="section-title">Genel İstatistikler</h2>
                    <div class="stats-grid" v-if="completedLessons > 0">
                        <div class="stat-box">
                            <h4>Çözülen Test</h4>
                            <p>{{ completedTestCount }}</p>
                        </div>
                        <div class="stat-box">
                            <h4>Başarı Oranı</h4>
                            <p>%{{ successRate }}</p>
                        </div>
                        <div class="stat-box">
                            <h4>Haftalık Puan</h4>
                            <p>+{{ studentScore }}</p>
                        </div>
                    </div>
                    <div v-else class="empty-state">
                        <p>Henüz bir test çözmedin. Test çözerek puan kazanmaya başlayabilirsin! 🚀</p>
                    </div>
                </div>

                <div v-if="activeTab === 'test-solve'" class="animate-fade">
                    <h2 class="section-title">Test Çöz</h2>

                    <div v-if="!selectedTestSubject">
                        <p style="color:#888; margin-bottom: 20px;">Çözmek istediğiniz dersi seçiniz.</p>
                        <div class="subjects-grid">
                            <div v-for="subject in lessons" :key="subject" class="subject-card"
                                @click="selectSubject(subject)">
                                <div class="subject-icon">📚</div>
                                <h3>{{ subject }}</h3>
                                <span class="test-count-badge">{{ getTestCountForSubject(subject) }} Test</span>
                            </div>
                        </div>
                    </div>

                    <div v-else>
                        <div class="test-list-header">
                            <button class="btn-back" @click="selectedTestSubject = null">← Derslere Dön</button>
                            <h3>{{ selectedTestSubject }} Testleri</h3>
                        </div>

                        <div v-if="testsForSelectedSubject.length === 0" class="empty-state">
                            <span class="icon-empty">📂</span>
                            <p>Bu dersten henüz test yüklenmemiş.</p>
                        </div>

                        <div v-else class="test-grid">
                            <div v-for="test in testsForSelectedSubject" :key="test.id" class="test-card">
                                <div class="test-header">
                                    <span class="badge-subject">{{ test.subject }}</span>
                                    <span class="badge-grade">{{ test.grade === 'Mezun' ? 'Mezun' : test.grade + '.Sınıf' }}</span>
                                </div>
                                <h3>{{ test.title }}</h3>
                                <div class="test-meta">
                                    <span>❓ {{ test.questionCount }} Soru</span>
                                    <span>📅 {{ new Date(test.createdAt).toLocaleDateString('tr-TR') }}</span>
                                </div>

                                <div class="teacher-actions-mini">
                                    <span class="t-name">👨‍🏫 {{ test.uploaderName || 'Öğretmen' }}</span>
                                    <div class="actions">
                                        <button @click.stop="addToFavoritesById(test.uploaderId)"
                                            title="Favorilere Ekle" class="btn-icon-action">❤️</button>
                                        <button @click.stop="bookLessonById(test.uploaderId)" title="Ders Talep Et"
                                            class="btn-icon-action">📅</button>
                                    </div>
                                </div>

                                <button class="btn-start-test" @click="openTestRunner(test)">Testi Başlat</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="activeTab === 'calendar'" class="animate-fade">
                    <h2 class="section-title">Takvimim</h2>
                    <div class="calendar-container">
                        <div class="calendar-header-control">
                            <button @click="changeMonth(-1)">❮</button>
                            <h3>{{ currentMonthName }} {{ currentYear }}</h3>
                            <button @click="changeMonth(1)">❯</button>
                        </div>
                        <div class="calendar-grid-header">
                            <div v-for="day in ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']" :key="day">{{ day }}
                            </div>
                        </div>
                        <div class="calendar-grid">
                            <div v-for="blank in firstDayOffset" :key="'blank-' + blank" class="calendar-day empty"></div>
                            <div v-for="date in daysInMonth" :key="date" class="calendar-day">
                                <span class="day-number" :class="{ 'today': isToday(date) }">{{ date }}</span>
                                <div class="day-events">
                                    <div v-for="booking in getBookingsForDate(date)" :key="booking.id"
                                        class="event-pill">
                                        {{ booking.time }} - {{ booking.teacherName }}
                                    </div>
                                </div>
                            </div>
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
                            <div class="teacher-img">
                                <img :src="teacher.avatar?.uploadedImage || teacher.avatar?.selectedPreset || 'https://ui-avatars.com/api/?name=' + (teacher.displayName || 'T')"
                                    style="width:100%; height:100%; border-radius:50%; object-fit:cover;" />
                            </div>
                            <div class="teacher-info">
                                <h3>{{ teacher.displayName || teacher.email || 'İsimsiz Öğretmen' }}</h3>
                                <span class="badge">{{ teacher.branch || 'Branş Belirtilmedi' }}</span>
                                <p class="t-time">🕒 Müsaitlik: {{ hasAvailability(teacher) ? 'Müsait' : 'Sorunuz' }}
                                </p>
                                <button class="btn-request" @click="openBookingModal(teacher)">Ders Talep Et</button>
                                <button class="btn-message" @click="startChat(teacher)">💬 Mesaj At</button>
                            </div>
                        </div>
                    </div>

                    <div v-else class="no-results">
                        <div class="icon-warning">⚠️</div>
                        <p>Aradığınız kriterlere uygun öğretmen şu anda sistemde bulunamadı.</p>
                        <button @click="filters = { subject: '', time: '' }" class="btn-reset">Filtreleri
                            Temizle</button>
                    </div>
                </div>

                <div v-if="activeTab === 'favorites'" class="animate-fade">
                    <h2 class="section-title">Favori Öğretmenlerim</h2>
                    <div v-if="myFavorites.length > 0" class="teachers-grid">
                        <div v-for="teacher in myFavorites" :key="teacher.id" class="teacher-card">
                            <div class="teacher-img">
                                <img :src="teacher.avatar?.uploadedImage || teacher.avatar?.selectedPreset || 'https://ui-avatars.com/api/?name=' + (teacher.displayName || 'T')"
                                    style="width:100%; height:100%; border-radius:50%; object-fit:cover;" />
                            </div>
                            <div class="teacher-info">
                                <h3>{{ teacher.displayName || teacher.email }}</h3>
                                <span class="badge">{{ teacher.branch }}</span>
                                <button class="btn-request" @click="openBookingModal(teacher)">Ders Talep Et</button>
                                <button class="btn-message" @click="startChat(teacher)">💬 Mesaj At</button>
                            </div>
                        </div>
                    </div>
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
                        <div class="chat-header">Mesajlarım</div>
                        <div class="chat-list">
                            <div v-for="chat in myChats" :key="chat.id" class="chat-item"
                                :class="{ active: activeChat?.id === chat.id }" @click="selectChat(chat)">
                                <div class="chat-avatar">{{ chat.otherUserName?.charAt(0) || '?' }}</div>
                                <div class="chat-info">
                                    <h4>{{ chat.otherUserName || 'Kullanıcı' }}</h4>
                                    <p>{{ chat.lastMessage || 'Mesaj yok' }}</p>
                                </div>
                            </div>
                            <div v-if="myChats.length === 0" class="empty-chat-list">
                                <small>Henüz mesajınız yok.</small>
                            </div>
                        </div>
                    </div>
                    <div class="chat-window">
                        <div v-if="activeChat" class="chat-content">
                            <div class="chat-top-bar">
                                <h3>
                                    {{ activeChat.otherUserName }}
                                    <span v-if="activeChat.typing && activeChat.typing[activeChat.otherUserId]"
                                        class="typing-indicator">yazıyor...</span>
                                </h3>
                            </div>
                            <div class="messages-area" ref="messagesContainer">
                                <div v-for="msg in activeMessages" :key="msg.id" class="message-bubble"
                                    :class="{ 'my-message': msg.senderId === $auth.currentUser.uid }">
                                    {{ msg.text }}
                                    <span v-if="msg.senderId === $auth.currentUser.uid" class="read-status">
                                        {{ isMessageRead(msg) ? '✓✓' : '✓' }}
                                    </span>
                                </div>
                            </div>
                            <div class="chat-input-area">
                                <input v-model="newMessage" @keyup.enter="sendMessage" @input="handleTyping"
                                    placeholder="Bir mesaj yazın..." />
                                <button @click="sendMessage">Gönder</button>
                            </div>
                        </div>
                        <div v-else class="empty-chat-state">
                            <span class="icon-msg">📩</span>
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
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth'
import { getFirestore, doc, getDoc, updateDoc, collection, getDocs, query, where, addDoc, onSnapshot, orderBy, serverTimestamp, deleteField } from 'firebase/firestore'

const router = useRouter()
const { $auth } = useNuxtApp()
let db;

// State
const isLoading = ref(true)
const isStudent = ref(false)
const activeTab = ref('stats')
const userDisplayName = ref('')
const userEmail = ref('')
const userGrade = ref(null)
const studentScore = ref(0)
const completedLessons = ref(0)
const completedTestCount = ref(0)
const successRate = ref(0)

const availableTests = ref([])
const realTeachers = ref([])
const myFavorites = ref([])
const filters = ref({ subject: '', time: '' })
const myBookings = ref([]) // Öğrencinin randevuları

// Test Grouping State
const selectedTestSubject = ref(null)

// Booking State
const isBookingModalOpen = ref(false)
const selectedTeacherForBooking = ref(null)
const bookingSlot = ref(null)
const availableSlots = ref([]) // Gerçek verilerle dolacak

// Test Runner State
const isTakingTest = ref(false)
const currentTest = ref(null)
const userAnswers = ref([])
const drawingTool = ref('pen')
const drawCanvas = ref(null)
const isDrawing = ref(false)
let ctx = null

// Calendar State
const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())

// Chat State
const myChats = ref([])
const activeChat = ref(null)
const activeMessages = ref([])
const newMessage = ref('')
let typingTimeout = null

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

// FONKSİYONLAR
const fetchTests = async () => {
    if (!db) db = getFirestore();
    const q = await getDocs(collection(db, "tests"));
    availableTests.value = q.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const fetchTeachers = async () => {
    if (!db) db = getFirestore();
    try {
        const q = query(collection(db, "users"), where("role", "==", "teacher"));
        const snapshot = await getDocs(q);
        realTeachers.value = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(t => !t.displayName || !t.displayName.toLowerCase().includes('piç'));
    } catch (e) { console.error(e) }
}

const filteredTeachers = computed(() => {
    return realTeachers.value.filter(t => {
        const matchSubject = filters.value.subject === '' || t.branch === filters.value.subject
        return matchSubject
    })
})

const hasAvailability = (teacher) => {
    return teacher.availability && Object.keys(teacher.availability).length > 0;
}

// Randevu İşlemleri
const openBookingModal = (teacher) => {
    selectedTeacherForBooking.value = teacher
    bookingSlot.value = null

    // Öğretmenin müsaitlik verisini işle
    const slots = [];
    if (teacher.availability) {
        Object.keys(teacher.availability).forEach(key => {
            // key formatı: "Pzt-10:00"
            const [day, time] = key.split('-');
            slots.push({ id: key, day, time });
        });
    }
    availableSlots.value = slots;
    isBookingModalOpen.value = true
}

const confirmBooking = async () => {
    if (!db) db = getFirestore();
    if (!selectedTeacherForBooking.value || !bookingSlot.value) return;

    try {
        // 1. Randevuyu bookings koleksiyonuna ekle
        await addDoc(collection(db, "bookings"), {
            teacherId: selectedTeacherForBooking.value.id,
            teacherName: selectedTeacherForBooking.value.displayName || selectedTeacherForBooking.value.email,
            studentId: $auth.currentUser.uid,
            studentName: userDisplayName.value,
            day: bookingSlot.value.day,
            time: bookingSlot.value.time,
            createdAt: serverTimestamp(),
            status: 'confirmed'
        });

        // 2. Öğretmenin müsaitlik listesinden bu saati düş (Opsiyonel ama önerilir)
        const teacherRef = doc(db, "users", selectedTeacherForBooking.value.id);
        const slotKey = `${bookingSlot.value.day}-${bookingSlot.value.time}`;

        // deleteField() kullanarak sadece o anahtarı siliyoruz
        await updateDoc(teacherRef, {
            [`availability.${slotKey}`]: deleteField()
        });

        alert(`Tebrikler! ${selectedTeacherForBooking.value.displayName} ile ${bookingSlot.value.day} saat ${bookingSlot.value.time} için dersiniz oluşturuldu.`);
        isBookingModalOpen.value = false;

        // Listeleri güncelle
        fetchBookings();
        fetchTeachers();

    } catch (error) {
        console.error("Randevu hatası:", error);
        alert("Randevu oluşturulurken bir hata oluştu.");
    }
}

const fetchBookings = async () => {
    if (!db) db = getFirestore();
    const q = query(collection(db, "bookings"), where("studentId", "==", $auth.currentUser.uid));
    const snap = await getDocs(q);
    myBookings.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Takvim Yardımcıları
const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]
const currentMonthName = computed(() => monthNames[currentMonth.value])
const daysInMonth = computed(() => new Date(currentYear.value, currentMonth.value + 1, 0).getDate())
const firstDayOffset = computed(() => {
    let d = new Date(currentYear.value, currentMonth.value, 1).getDay()
    return d === 0 ? 6 : d - 1 // Pzt=0 yapmak için
})
const changeMonth = (delta) => {
    currentMonth.value += delta
    if (currentMonth.value > 11) { currentMonth.value = 0; currentYear.value++ }
    if (currentMonth.value < 0) { currentMonth.value = 11; currentYear.value-- }
}
const isToday = (date) => {
    const today = new Date()
    return date === today.getDate() && currentMonth.value === today.getMonth() && currentYear.value === today.getFullYear()
}

// Basitçe o gün için randevuları filtrele (Gün ismine göre - Örn: "Sal")
const getBookingsForDate = (date) => {
    // Gerçek tarihten gün ismini bul (Pzt, Sal...)
    const d = new Date(currentYear.value, currentMonth.value, date);
    const dayIndex = d.getDay(); // 0=Paz, 1=Pzt
    const dayMap = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
    const dayName = dayMap[dayIndex];

    // myBookings içinde 'day' alanı 'Pzt', 'Sal' gibi tutuluyor
    return myBookings.value.filter(b => b.day === dayName);
}


// Mesajlaşma (Chat) Fonksiyonları
const startChat = async (teacher) => {
    if (!db) db = getFirestore();
    const myUid = $auth.currentUser.uid;
    const teacherUid = teacher.id;

    // 1. Zaten bir sohbet var mı kontrol et
    // (Firebase'de array-contains ile tek sorguda iki ID'yi kontrol etmek zor, client taraflı filtreliyoruz veya composite key kullanıyoruz.
    // Basitlik için tüm chatlerimi çekip filter yapacağız - prod için composite key önerilir)
    const q = query(collection(db, "chats"), where("participants", "array-contains", myUid));
    const snap = await getDocs(q);

    let existingChat = snap.docs.find(doc => {
        const data = doc.data();
        return data.participants.includes(teacherUid);
    });

    if (existingChat) {
        // Var olan sohbeti aç
        activeTab.value = 'messages';
        const chatData = existingChat.data();
        selectChat({
            id: existingChat.id,
            ...chatData,
            otherUserName: teacher.displayName || teacher.email,
            otherUserId: teacherUid
        });
    } else {
        // Yeni sohbet oluştur
        const newChatRef = await addDoc(collection(db, "chats"), {
            participants: [myUid, teacherUid],
            studentId: myUid,
            teacherId: teacherUid,
            studentName: userDisplayName.value,
            teacherName: teacher.displayName || teacher.email,
            createdAt: serverTimestamp(),
            lastMessage: '',
            typing: {}
        });

        activeTab.value = 'messages';
        selectChat({
            id: newChatRef.id,
            participants: [myUid, teacherUid],
            otherUserName: teacher.displayName || teacher.email,
            otherUserId: teacherUid
        });
    }
}

const fetchChats = () => {
    if (!db) db = getFirestore();
    const q = query(collection(db, "chats"), where("participants", "array-contains", $auth.currentUser.uid));

    onSnapshot(q, (snapshot) => {
        myChats.value = snapshot.docs.map(doc => {
            const data = doc.data();
            const otherId = data.participants.find(p => p !== $auth.currentUser.uid);
            // Karşı tarafın adını belirle
            const otherName = otherId === data.teacherId ? data.teacherName : data.studentName;
            return { id: doc.id, ...data, otherUserName: otherName, otherUserId: otherId };
        });
        if (activeChat.value) {
            const updated = myChats.value.find(c => c.id === activeChat.value.id);
            if (updated) activeChat.value = { ...activeChat.value, ...updated };
        }
    });
};

const selectChat = (chat) => {
    activeChat.value = chat;
    loadMessages(chat.id);
    markAsRead(chat.id);
};

const loadMessages = (chatId) => {
    if (!db) db = getFirestore();
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));

    onSnapshot(q, (snapshot) => {
        activeMessages.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTimeout(() => {
            const container = document.querySelector('.messages-area');
            if (container) container.scrollTop = container.scrollHeight;
        }, 100);
    });
};

const sendMessage = async () => {
    if (!newMessage.value.trim() || !activeChat.value) return;

    const text = newMessage.value;
    newMessage.value = '';

    const chatRef = doc(db, "chats", activeChat.value.id);
    await addDoc(collection(chatRef, "messages"), {
        text,
        senderId: $auth.currentUser.uid,
        createdAt: serverTimestamp()
    });

    await updateDoc(chatRef, {
        lastMessage: text,
        updatedAt: serverTimestamp()
    });

    if (typingTimeout) clearTimeout(typingTimeout);
    await updateDoc(chatRef, { [`typing.${$auth.currentUser.uid}`]: false });
};

const handleTyping = async () => {
    if (!activeChat.value) return;
    const chatRef = doc(db, "chats", activeChat.value.id);
    await updateDoc(chatRef, { [`typing.${$auth.currentUser.uid}`]: true });

    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(async () => {
        await updateDoc(chatRef, { [`typing.${$auth.currentUser.uid}`]: false });
    }, 2000);
};

const markAsRead = async (chatId) => {
    if (!chatId) return;
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
        [`lastRead.${$auth.currentUser.uid}`]: serverTimestamp()
    });
};

const isMessageRead = (msg) => {
    if (!activeChat.value || !activeChat.value.lastRead || !msg.createdAt) return false;
    const otherUserId = activeChat.value.otherUserId;
    const readTime = activeChat.value.lastRead[otherUserId];
    if (!readTime) return false;
    return readTime.seconds >= msg.createdAt.seconds;
};

// Test Runner
const selectSubject = (subject) => { selectedTestSubject.value = subject; }
const getTestCountForSubject = (subject) => { return availableTests.value.filter(t => t.subject === subject).length; }
const testsForSelectedSubject = computed(() => {
    if (!selectedTestSubject.value) return [];
    return availableTests.value
        .filter(t => t.subject === selectedTestSubject.value)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
});
const addToFavoritesById = (teacherId) => {
    const teacher = findTeacherById(teacherId);
    if (teacher && !myFavorites.value.find(f => f.id === teacher.id)) {
        myFavorites.value.push(teacher);
        alert(`${teacher.displayName || 'Öğretmen'} favorilere eklendi.`);
    }
}
const findTeacherById = (id) => { return realTeachers.value.find(t => t.id === id); }
const bookLessonById = (teacherId) => {
    const teacher = findTeacherById(teacherId);
    if (teacher) openBookingModal(teacher);
}

const openTestRunner = async (test) => {
    currentTest.value = test
    userAnswers.value = new Array(parseInt(test.questionCount)).fill(null)
    isTakingTest.value = true
    await nextTick()
    const canvas = drawCanvas.value
    canvas.width = canvas.parentElement.clientWidth
    canvas.height = canvas.parentElement.clientHeight
    ctx = canvas.getContext('2d')
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0055ff'; ctx.lineWidth = 2;
}
const startDrawing = (e) => { isDrawing.value = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); }
const draw = (e) => { if (!isDrawing.value) return; ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); }
const stopDrawing = () => { isDrawing.value = false; ctx.closePath(); }
const setTool = (t) => { drawingTool.value = t; ctx.globalCompositeOperation = t === 'eraser' ? 'destination-out' : 'source-over'; ctx.lineWidth = t === 'eraser' ? 20 : 2; }
const clearCanvas = () => ctx.clearRect(0, 0, drawCanvas.value.width, drawCanvas.value.height)
const confirmExitTest = () => {
    if (confirm("Testten çıkmak istediğine emin misin? İlerlemen kaybolacak.")) { isTakingTest.value = false }
}
const finishTest = () => { alert("Test tamamlandı! Sonuçlar hesaplanıyor..."); isTakingTest.value = false; }

// Profil
const isProfileModalOpen = ref(false)
const fileInput = ref(null)
const profileState = ref({ avatarType: 'initials', selectedPreset: '', uploadedImage: null })
const tempProfile = ref({ name: '', grade: null, avatarType: 'initials', selectedPreset: '', uploadedImage: null })
const presetAvatars = ["https://api.dicebear.com/7.x/avataaars/svg?seed=Felix", "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka", "https://api.dicebear.com/7.x/bottts/svg?seed=Bubba", "https://api.dicebear.com/7.x/micah/svg?seed=Callie", "https://api.dicebear.com/7.x/notionists/svg?seed=Cookie"]

const currentAvatarUrl = computed(() => {
    if (profileState.value.avatarType === 'upload' && profileState.value.uploadedImage) return profileState.value.uploadedImage
    if (profileState.value.avatarType === 'preset' && profileState.value.selectedPreset) return profileState.value.selectedPreset
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
const triggerFileUpload = () => fileInput.value.click()
const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
        const reader = new FileReader()
        reader.onload = (e) => { tempProfile.value.uploadedImage = e.target.result; tempProfile.value.avatarType = 'upload' }
        reader.readAsDataURL(file)
    }
}
const selectPresetAvatar = (url) => { tempProfile.value.selectedPreset = url; tempProfile.value.avatarType = 'preset' }

const saveProfile = async () => {
    if (!db) db = getFirestore();
    userDisplayName.value = tempProfile.value.name
    userGrade.value = tempProfile.value.grade
    profileState.value = { avatarType: tempProfile.value.avatarType, selectedPreset: tempProfile.value.selectedPreset, uploadedImage: tempProfile.value.uploadedImage }
    if ($auth.currentUser) {
        try {
            await updateProfile($auth.currentUser, { displayName: tempProfile.value.name })
            const userRef = doc(db, "users", $auth.currentUser.uid);
            await updateDoc(userRef, {
                displayName: tempProfile.value.name,
                grade: tempProfile.value.grade,
                avatar: { type: tempProfile.value.avatarType, preset: tempProfile.value.selectedPreset, uploadedImage: tempProfile.value.uploadedImage }
            })
        } catch (e) { console.error("Profil güncellenemedi", e) }
    }
    isProfileModalOpen.value = false
}

const handleLogout = async () => { await signOut($auth); router.push('/'); }

const studentRank = computed(() => {
    const s = studentScore.value
    if (s < 100) return { title: 'Acemi', class: 'rank-1' }
    if (s < 500) return { title: 'Hırslı', class: 'rank-2' }
    if (s < 1000) return { title: 'Kalfa', class: 'rank-3' }
    if (s < 2000) return { title: 'Usta', class: 'rank-4' }
    if (s < 5000) return { title: 'Doçent', class: 'rank-5' }
    return { title: 'Profesör', class: 'rank-6' }
})

// Auth & Init
onMounted(() => {
    db = getFirestore();
    onAuthStateChanged($auth, async (user) => {
        if (user) {
            userEmail.value = user.email
            userDisplayName.value = user.displayName || ''
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.role !== 'student') { router.push(data.role === 'teacher' ? '/dashboard-teacher' : '/'); return; }
                isStudent.value = true;
                if (data.grade) userGrade.value = data.grade;
                if (data.displayName) userDisplayName.value = data.displayName;
                studentScore.value = data.score || 0;
                completedTestCount.value = data.completedTestCount || 0;
                completedLessons.value = data.completedTestCount || 0;
                if (data.avatar) profileState.value = { avatarType: data.avatar.type || 'initials', selectedPreset: data.avatar.preset || '', uploadedImage: data.avatar.uploadedImage || null }

                try {
                    await fetchTests();
                    await fetchTeachers();
                    await fetchBookings();
                    fetchChats();
                } catch (e) { console.error("Veri yükleme hatası:", e); }
            }
            isLoading.value = false;
        } else { router.push('/'); }
    })
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
    border: 1px solid #222;
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
    flex-direction: column;
    text-align: center;
}

.teacher-img {
    font-size: 2.5rem;
    background: #222;
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.teacher-info h3 {
    margin: 10px 0 5px 0;
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
    margin: 10px 0;
}

.btn-request {
    background: transparent;
    border: 1px solid #0055ff;
    color: #0055ff;
    padding: 5px 10px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: 0.3s;
    width: 100%;
    margin-bottom: 5px;
}

.btn-request:hover {
    background: #0055ff;
    color: white;
}

.btn-message {
    background: #222;
    border: 1px solid #444;
    color: #ccc;
    padding: 5px 10px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: 0.3s;
    width: 100%;
}

.btn-message:hover {
    background: #333;
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

/* MESAJLAŞMA */
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

/* CHAT ITEM & BUBBLES */
.chat-item {
    display: flex;
    align-items: center;
    padding: 15px;
    border-bottom: 1px solid #222;
    cursor: pointer;
    transition: 0.2s;
}

.chat-item:hover,
.chat-item.active {
    background: #1f1f1f;
}

.chat-avatar {
    width: 40px;
    height: 40px;
    background: #333;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 10px;
    font-weight: bold;
}

.chat-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
}

.chat-top-bar {
    padding: 15px;
    border-bottom: 1px solid #222;
    background: #111;
}

.messages-area {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.message-bubble {
    max-width: 70%;
    padding: 10px 15px;
    border-radius: 12px;
    background: #222;
    color: #ddd;
    align-self: flex-start;
    position: relative;
}

.message-bubble.my-message {
    background: #0055ff;
    color: white;
    align-self: flex-end;
}

.chat-input-area {
    padding: 15px;
    border-top: 1px solid #222;
    display: flex;
    gap: 10px;
}

.chat-input-area input {
    flex: 1;
    background: #111;
    border: 1px solid #333;
    padding: 10px;
    border-radius: 20px;
    color: white;
}

.chat-input-area button {
    background: #0055ff;
    color: white;
    border: none;
    padding: 0 20px;
    border-radius: 20px;
    cursor: pointer;
}

.typing-indicator {
    font-size: 0.8rem;
    color: #0055ff;
    margin-left: 10px;
    font-weight: normal;
    animation: pulse 1.5s infinite;
}

.read-status {
    font-size: 0.7rem;
    margin-left: 5px;
    color: #88ffaa;
}

/* BOOKING MODAL */
.highlight-text {
    color: #0055ff;
    font-weight: bold;
}

.scheduler-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin: 20px 0;
}

.no-slots {
    grid-column: span 3;
    text-align: center;
    color: #777;
    padding: 20px;
}

.time-slot-card {
    background: #111;
    border: 1px solid #333;
    padding: 15px;
    text-align: center;
    border-radius: 8px;
    cursor: pointer;
}

.time-slot-card:hover {
    border-color: #555;
}

.time-slot-card.selected {
    background: #0055ff;
    border-color: #0055ff;
    color: white;
}

.btn-save:disabled {
    background: #333;
    cursor: not-allowed;
}

/* Test Runner Overlay */
.test-runner-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: #000;
    z-index: 100000;
    display: flex;
    flex-direction: column;
}

.test-runner-header {
    height: 60px;
    background: #111;
    border-bottom: 1px solid #333;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
}

.test-runner-body {
    flex: 1;
    display: flex;
    overflow: hidden;
}

.pdf-container {
    flex: 3;
    position: relative;
    background: #222;
}

.pdf-frame {
    width: 100%;
    height: 100%;
    border: none;
}

.drawing-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
    cursor: crosshair;
}

.optical-form {
    flex: 1;
    min-width: 320px;
    background: #0f0f0f;
    border-left: 1px solid #333;
    display: flex;
    flex-direction: column;
    padding: 20px;
}

.questions-list {
    flex: 1;
    overflow-y: auto;
    margin: 20px 0;
}

.opt-row {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
}

.q-no {
    width: 30px;
    color: #888;
    font-size: 0.9rem;
}

.opt-options button {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #1a1a1a;
    border: 1px solid #333;
    color: #aaa;
    margin-right: 6px;
    cursor: pointer;
    transition: 0.2s;
}

.opt-options button:hover {
    border-color: #0055ff;
}

.opt-options button.selected {
    background: #0055ff;
    color: white;
    border-color: #0055ff;
}

.btn-finish-test {
    background: #10b981;
    color: white;
    border: none;
    padding: 15px;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    width: 100%;
}

.tr-tools button {
    background: #222;
    border: 1px solid #444;
    color: #ccc;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    margin-left: 8px;
    cursor: pointer;
}

.tr-tools button.active {
    background: #0055ff;
    color: white;
    border-color: #0055ff;
}

.btn-close-test {
    width: auto !important;
    padding: 0 20px;
    background: #dc2626 !important;
    border-color: #dc2626 !important;
    color: white;
}

/* SUBJECTS & TEST LIST */
.subjects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
}

.subject-card {
    background: #161616;
    border: 1px solid #333;
    border-radius: 12px;
    padding: 30px 20px;
    text-align: center;
    cursor: pointer;
    transition: 0.3s;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.subject-card:hover {
    border-color: #0055ff;
    transform: translateY(-5px);
    background: #1a1a1a;
}

.subject-icon {
    font-size: 3rem;
    margin-bottom: 15px;
}

.subject-card h3 {
    margin: 0 0 10px 0;
    font-size: 1.2rem;
    color: white;
}

.test-count-badge {
    background: #222;
    color: #888;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 0.8rem;
}

.test-list-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 30px;
}

.btn-back {
    background: transparent;
    border: 1px solid #333;
    color: #ccc;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: 0.2s;
}

.btn-back:hover {
    border-color: white;
    color: white;
}

.teacher-actions-mini {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-top: 10px;
    border-top: 1px solid #222;
}

.t-name {
    font-size: 0.85rem;
    color: #aaa;
}

.actions {
    display: flex;
    gap: 5px;
}

.btn-icon-action {
    background: #222;
    border: 1px solid #333;
    color: #ccc;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.2s;
}

.btn-icon-action:hover {
    background: #0055ff;
    border-color: #0055ff;
    color: white;
}

/* CALENDAR STYLES */
.calendar-container {
    background: #161616;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #333;
}

.calendar-header-control {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.calendar-header-control button {
    background: transparent;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
}

.calendar-header-control h3 {
    margin: 0;
}

.calendar-grid-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    font-weight: bold;
    margin-bottom: 10px;
    color: #888;
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 5px;
}

.calendar-day {
    min-height: 100px;
    background: #111;
    border: 1px solid #222;
    padding: 5px;
    font-size: 0.9rem;
    position: relative;
}

.calendar-day.empty {
    background: transparent;
    border: none;
}

.day-number {
    display: block;
    text-align: right;
    margin-bottom: 5px;
    color: #666;
}

.day-number.today {
    color: #0055ff;
    font-weight: bold;
}

.day-events {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.event-pill {
    background: #0055ff;
    color: white;
    font-size: 0.7rem;
    padding: 2px 4px;
    border-radius: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* RESPONSIVE */
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