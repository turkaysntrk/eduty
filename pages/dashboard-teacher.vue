<template>
    <div v-if="isLoading" class="loading-screen">
        <div class="spinner"></div>
        <p>Yetki kontrolü yapılıyor...</p>
        <small style="color: #666; margin-top: 5px;">Veriler yükleniyor...</small>
    </div>

    <div v-else-if="isTeacher" class="dashboard-container">

        <div v-if="isProfileModalOpen" class="modal-overlay">
            <div class="modal-content">
                <h3>Öğretmen Profilini Düzenle</h3>
                <div class="modal-body">
                    <div class="read-only-group">
                        <label>Adınız Soyadınız:</label>
                        <div class="read-only-text">{{ userDisplayName }}</div>
                        <small>İsim değişikliği için yönetimle iletişime geçiniz.</small>
                    </div>

                    <div class="read-only-group">
                        <label>Branşınız:</label>
                        <div class="read-only-text highlight">{{ userBranch }}</div>
                        <small>Branş bilgisi sabittir.</small>
                    </div>

                    <label style="margin-top: 15px; display:block;">Profil Fotoğrafı:</label>
                    <div class="avatar-selection">
                        <div class="avatar-option"
                            :class="{ selected: tempProfile.avatarType === 'upload' && tempProfile.uploadedImage }"
                            @click="triggerFileUpload">
                            <span>📁</span><small>Yükle</small>
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

        <div v-if="isUpdateModalOpen" class="modal-overlay">
            <div class="modal-content update-modal">
                <h3>Testi Güncelle</h3>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Test Başlığı</label>
                        <input type="text" v-model="editTestForm.title" />
                    </div>
                    <div class="form-row">
                        <div class="form-group half">
                            <label>Sınıf</label>
                            <select v-model="editTestForm.grade">
                                <option v-for="g in availableGrades" :key="g" :value="g">
                                    {{ g === 'Mezun' ? 'Mezun' : g + '.Sınıf' }}
                                </option>
                            </select>
                        </div>
                        <div class="form-group half">
                            <label>Ders</label>
                            <input type="text" :value="editTestForm.subject" disabled class="disabled-input" />
                        </div>
                    </div>
                    <p style="font-size:0.8rem; color:#666;">Not: PDF ve Cevap Anahtarı bu ekrandan değiştirilemez.
                        Hatalıysa testi silip yeniden yükleyiniz.</p>
                </div>
                <div class="modal-actions">
                    <button @click="isUpdateModalOpen = false" class="btn-cancel">İptal</button>
                    <button @click="saveTestUpdate" class="btn-save">Güncelle</button>
                </div>
            </div>
        </div>

        <aside class="sidebar">
            <div class="profile-section">
                <div class="avatar-wrapper">
                    <button class="edit-profile-btn" @click="openProfileModal" title="Profili Düzenle">✏️</button>
                    <img :src="currentAvatarUrl" alt="Profil" class="avatar" />
                </div>
                <h3 class="user-name">{{ userDisplayName || 'Değerli Öğretmenimiz' }}</h3>
                <p class="user-email">{{ userEmail }}</p>
                <p v-if="userBranch" class="user-branch-info">{{ userBranch }} Öğretmeni</p>
            </div>

            <nav class="sidebar-nav">
                <button @click="activeTab = 'calendar'" :class="{ active: activeTab === 'calendar' }">
                    <span class="icon">📅</span> Programım
                </button>
                <button @click="activeTab = 'test-upload'" :class="{ active: activeTab === 'test-upload' }">
                    <span class="icon">📤</span> Test Yönetimi
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
                    <div class="score-value">{{ teacherScore }} <span>Puan</span></div>
                </div>
                <div class="quick-stats">
                    <div class="q-item">
                        <span class="q-val">{{ myTests.length }}</span>
                        <span class="q-lab">Yüklenen Test</span>
                    </div>
                </div>
            </header>

            <section class="tab-content">

                <div v-if="activeTab === 'calendar'" class="animate-fade">
                    <h2 class="section-title">Haftalık Programım</h2>
                    <p class="sub-text">Müsait olduğunuz saatleri yeşil olarak işaretleyiniz. Öğrenciler bu saatlerden
                        randevu alabilir.</p>

                    <div class="calendar-wrapper">
                        <div class="calendar-header">
                            <div class="cal-time-col">Saat</div>
                            <div v-for="day in daysOfWeek" :key="day" class="cal-day-col">{{ day }}</div>
                        </div>
                        <div class="calendar-body">
                            <div v-for="time in timeSlots" :key="time" class="cal-row">
                                <div class="cal-time-cell">{{ time }}</div>
                                <div v-for="(day, dIndex) in daysOfWeek" :key="dIndex" class="cal-cell"
                                    :class="{ 'available': isAvailable(day, time), 'booked': isBooked(day, time) }"
                                    @click="toggleAvailability(day, time)">
                                    <span v-if="isBooked(day, time)" class="booked-info">{{ getBookingInfo(day, time)
                                        }}</span>
                                    <span v-else-if="isAvailable(day, time)">Müsait</span>
                                    <span v-else class="plus-icon">+</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="activeTab === 'test-upload'" class="animate-fade">

                    <div class="section-block">
                        <h2 class="section-title">Yeni Test Yükle</h2>
                        <div class="upload-container">
                            <div class="upload-form">
                                <div class="form-group">
                                    <label>Test Başlığı / Konu</label>
                                    <input v-model="testForm.title" type="text"
                                        placeholder="Örn: 2. Dereceden Denklemler" />
                                </div>

                                <div class="form-row">
                                    <div class="form-group half">
                                        <label>Sınıf Seviyesi</label>
                                        <select v-model="testForm.grade">
                                            <option value="" disabled>Seçiniz</option>
                                            <option v-for="g in availableGrades" :key="g" :value="g">
                                                {{ g === 'Mezun' ? 'Mezun' : g + '. Sınıf' }}
                                            </option>
                                        </select>
                                    </div>
                                    <div class="form-group half">
                                        <label>Ders</label>
                                        <input type="text" :value="userBranch" disabled class="disabled-input" />
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label>PDF Dosyası</label>
                                    <div class="file-drop-area" @click="$refs.pdfInput.click()"
                                        :class="{ 'has-file': testForm.file }">
                                        <div v-if="!testForm.file">
                                            <span class="icon-upload">📄</span>
                                            <p>PDF Yüklemek İçin Tıklayın</p>
                                        </div>
                                        <div v-else class="file-selected">
                                            <span class="icon-check">✅</span>
                                            <p>{{ testForm.file.name }}</p>
                                            <small>Değiştirmek için tıklayın</small>
                                        </div>
                                        <input type="file" ref="pdfInput" accept="application/pdf"
                                            @change="handlePdfUpload" hidden />
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label>Soru Sayısı</label>
                                    <input type="number" v-model="testForm.questionCount" min="1" max="100"
                                        placeholder="Örn: 20" @input="generateAnswerKeyInputs" />
                                </div>
                            </div>

                            <div class="answer-key-panel" v-if="testForm.questionCount > 0">
                                <h3>Cevap Anahtarı</h3>
                                <div class="answers-grid">
                                    <div v-for="(q, index) in testForm.answers" :key="index" class="answer-row">
                                        <span class="q-num">{{ index + 1 }}</span>
                                        <div class="options">
                                            <button v-for="opt in ['A', 'B', 'C', 'D', 'E']" :key="opt"
                                                @click="setAnswer(index, opt)" :class="{ active: q === opt }">
                                                {{ opt }}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="action-footer">
                            <button class="btn-primary-large" @click="submitTest" :disabled="!isFormValid">Testi
                                Yayınla</button>
                        </div>
                    </div>

                    <div class="section-block mt-40">
                        <h2 class="section-title">Test Kütüphanem</h2>
                        <div v-if="myTests.length === 0" class="empty-state">
                            <p>Henüz yüklediğiniz bir test bulunmuyor.</p>
                        </div>
                        <div v-else class="test-grid">
                            <div v-for="test in myTests" :key="test.id" class="test-card">
                                <div class="test-header">
                                    <span class="badge-subject">{{ test.subject }}</span>
                                    <span class="badge-grade">{{ test.grade === 'Mezun' ? 'Mezun' : test.grade +
                                        '.Sınıf' }}</span>
                                </div>
                                <h3>{{ test.title }}</h3>
                                <div class="test-meta">
                                    <span>📅 {{ new Date(test.createdAt).toLocaleDateString('tr-TR') }}</span>
                                    <span>❓ {{ test.questionCount }} Soru</span>
                                </div>
                                <button class="btn-update-test" @click="openUpdateModal(test)">Düzenle</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="activeTab === 'history'" class="animate-fade">
                    <h2 class="section-title">Geçmiş Ders Kayıtları</h2>
                    <div class="history-list">
                        <div v-if="pastLessons.length === 0">
                            <p class="empty-state">Henüz tamamlanmış bir özel dersiniz bulunmuyor.</p>
                        </div>
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
                                    <h4>{{ chat.otherUserName || 'Öğrenci' }}</h4>
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
                            <h3>Mesaj Kutusu Boş</h3>
                            <p>Öğrencilerinizle iletişime geçmek için bir sohbet seçin.</p>
                        </div>
                    </div>
                </div>

            </section>
        </main>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth'
import { getFirestore, doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, onSnapshot, orderBy, serverTimestamp, deleteField } from 'firebase/firestore'

const router = useRouter()
const { $auth } = useNuxtApp()
let db;

const isLoading = ref(true)
const isTeacher = ref(false)
const activeTab = ref('calendar')
const userDisplayName = ref('')
const userEmail = ref('')
const userBranch = ref('')
const userSchoolLevel = ref('') // 'ilkokul', 'ortaokul', 'lise'
const teacherScore = ref(0)
const pastLessons = ref([])
const myTests = ref([])

// Chat State
const myChats = ref([])
const activeChat = ref(null)
const activeMessages = ref([])
const newMessage = ref('')
let typingTimeout = null

// Takvim Verileri
const daysOfWeek = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]
const timeSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"]
const myAvailability = reactive({})
const myBookings = reactive({})

// Test Form - Subject artık userBranch'den otomatik gelecek
const testForm = reactive({ title: '', grade: '', subject: '', questionCount: 0, file: null, answers: [] })

// COMPUTED: Öğretmen seviyesine göre sınıf listesi
const availableGrades = computed(() => {
    // Eğer seviye bilgisi yoksa veya tanımlı değilse, hepsini göster (fallback)
    // Ya da branşa göre tahmin de yapılabilir ancak veritabanından 'schoolLevel' gelmesi en sağlıklısıdır.
    const level = userSchoolLevel.value;

    if (level === 'ilkokul') {
        return [1, 2, 3, 4];
    } else if (level === 'ortaokul') {
        return [5, 6, 7, 8];
    } else if (level === 'lise') {
        return [9, 10, 11, 12, 'Mezun'];
    } else {
        // Seviye bilgisi yoksa varsayılan tüm sınıflar (Fallback)
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, "Mezun"];
    }
});

// isFormValid: Ders seçimi artık kullanıcıdan gelmiyor, userBranch dolu olmalı
const isFormValid = computed(() => testForm.title && testForm.grade && userBranch.value && testForm.file && testForm.questionCount > 0 && testForm.answers.length === testForm.questionCount && !testForm.answers.includes(undefined))

// UPDATE MODAL STATE
const isUpdateModalOpen = ref(false)
const editTestForm = reactive({ id: null, title: '', grade: '', subject: '' })

// --- TAKVİM İŞLEMLERİ ---
const isAvailable = (day, time) => myAvailability[`${day}-${time}`] === true
const isBooked = (day, time) => !!myBookings[`${day}-${time}`]
const getBookingInfo = (day, time) => {
    const booking = myBookings[`${day}-${time}`];
    return booking ? booking.student : 'Dolu';
}

const toggleAvailability = async (day, time) => {
    if (isBooked(day, time)) {
        alert("Bu saatte dersiniz var, iptal edemezsiniz.");
        return;
    }
    const key = `${day}-${time}`

    if (myAvailability[key]) delete myAvailability[key]
    else myAvailability[key] = true

    if ($auth.currentUser) {
        const userRef = doc(db, "users", $auth.currentUser.uid);
        if (myAvailability[key]) {
            await updateDoc(userRef, { [`availability.${key}`]: true }).catch(e => console.error(e));
        } else {
            await updateDoc(userRef, { [`availability.${key}`]: deleteField() }).catch(e => console.error(e));
        }
    }
}

const fetchTeacherBookings = async () => {
    if (!db) db = getFirestore();
    const q = query(collection(db, "bookings"), where("teacherId", "==", $auth.currentUser.uid));
    const snap = await getDocs(q);
    snap.forEach(doc => {
        const data = doc.data();
        const key = `${data.day}-${data.time}`;
        myBookings[key] = { student: data.studentName || 'Öğrenci', id: doc.id };
    });
}

// --- TEST İŞLEMLERİ ---
const fetchMyTests = async (uid) => {
    if (!db) db = getFirestore();
    try {
        const q = query(collection(db, "tests"), where("uploaderId", "==", uid));
        const querySnapshot = await getDocs(q);
        const tests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        myTests.value = tests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) { console.error("Testler çekilemedi:", error); }
}

const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") testForm.file = file;
    else alert("Lütfen geçerli bir PDF dosyası seçin.");
}

const generateAnswerKeyInputs = () => {
    const count = parseInt(testForm.questionCount);
    if (!count || count < 0) { testForm.answers = []; return; }
    const newAnswers = new Array(count).fill(null);
    for (let i = 0; i < Math.min(count, testForm.answers.length); i++) newAnswers[i] = testForm.answers[i];
    testForm.answers = newAnswers;
}
const setAnswer = (index, option) => { testForm.answers[index] = option; }

const submitTest = async () => {
    if (!db) db = getFirestore();
    
    // Güvenlik: Subject'i her zaman kullanıcının branşından al
    const finalSubject = userBranch.value;

    try {
        const fakePdfUrl = "https://example.com/uploads/sample_test.pdf";
        await addDoc(collection(db, "tests"), {
            uploaderId: $auth.currentUser.uid,
            uploaderName: userDisplayName.value,
            title: testForm.title,
            grade: testForm.grade,
            subject: finalSubject, // Kullanıcının branşı
            questionCount: testForm.questionCount,
            answerKey: testForm.answers,
            pdfUrl: fakePdfUrl,
            createdAt: new Date().toISOString()
        });
        alert("Test başarıyla yüklendi!");
        await fetchMyTests($auth.currentUser.uid);
        Object.assign(testForm, { title: '', questionCount: 0, file: null, answers: [] })
    } catch (error) { alert("Hata: " + error.message); }
}

const openUpdateModal = (test) => {
    editTestForm.id = test.id
    editTestForm.title = test.title
    editTestForm.grade = test.grade
    editTestForm.subject = test.subject // Gösterim amaçlı, düzenlenemez
    isUpdateModalOpen.value = true
}

const saveTestUpdate = async () => {
    if (!db) db = getFirestore()
    try {
        const testRef = doc(db, "tests", editTestForm.id)
        await updateDoc(testRef, {
            title: editTestForm.title,
            grade: editTestForm.grade,
            // Subject güncellenmez, sabittir.
        })
        alert("Test güncellendi.")
        isUpdateModalOpen.value = false
        await fetchMyTests($auth.currentUser.uid)
    } catch (e) { alert("Güncelleme hatası: " + e.message) }
}

// --- MESAJLAŞMA (CHAT) ---
const fetchChats = () => {
    if (!db) db = getFirestore();
    const q = query(collection(db, "chats"), where("participants", "array-contains", $auth.currentUser.uid));

    onSnapshot(q, (snapshot) => {
        myChats.value = snapshot.docs.map(doc => {
            const data = doc.data();
            const otherId = data.participants.find(p => p !== $auth.currentUser.uid);
            const otherName = otherId === data.studentId ? data.studentName : data.teacherName;
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
    await updateDoc(chatRef, { [`lastRead.${$auth.currentUser.uid}`]: serverTimestamp() });
};

const isMessageRead = (msg) => {
    if (!activeChat.value || !activeChat.value.lastRead || !msg.createdAt) return false;
    const otherUserId = activeChat.value.otherUserId;
    const readTime = activeChat.value.lastRead[otherUserId];
    if (!readTime) return false;
    return readTime.seconds >= msg.createdAt.seconds;
};

const sendMessage = async () => {
    if (!newMessage.value.trim() || !activeChat.value) return;
    const text = newMessage.value;
    newMessage.value = '';

    const chatRef = doc(db, "chats", activeChat.value.id);
    await addDoc(collection(chatRef, "messages"), { text, senderId: $auth.currentUser.uid, createdAt: serverTimestamp() });
    await updateDoc(chatRef, { lastMessage: text, updatedAt: serverTimestamp() });

    if (typingTimeout) clearTimeout(typingTimeout);
    await updateDoc(chatRef, { [`typing.${$auth.currentUser.uid}`]: false });
};

// --- PROFİL & AUTH ---
const isProfileModalOpen = ref(false)
const fileInput = ref(null)
const profileState = ref({ avatarType: 'initials', selectedPreset: '', uploadedImage: null })
const tempProfile = ref({ avatarType: 'initials', selectedPreset: '', uploadedImage: null }) // Name ve Branch çıkarıldı
const presetAvatars = ["https://api.dicebear.com/7.x/avataaars/svg?seed=Felix", "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka", "https://api.dicebear.com/7.x/bottts/svg?seed=Bubba", "https://api.dicebear.com/7.x/micah/svg?seed=Callie", "https://api.dicebear.com/7.x/notionists/svg?seed=Cookie"]

const currentAvatarUrl = computed(() => {
    if (profileState.value.avatarType === 'upload' && profileState.value.uploadedImage) return profileState.value.uploadedImage
    if (profileState.value.avatarType === 'preset' && profileState.value.selectedPreset) return profileState.value.selectedPreset
    return `https://ui-avatars.com/api/?name=${userDisplayName.value || 'T'}&background=0055ff&color=fff`
})

const openProfileModal = () => {
    tempProfile.value = {
        // İsim ve branch tempProfile'a atanmıyor çünkü düzenlenemezler
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

    // Sadece Avatar Güncelleniyor
    profileState.value = {
        avatarType: tempProfile.value.avatarType,
        selectedPreset: tempProfile.value.selectedPreset,
        uploadedImage: tempProfile.value.uploadedImage
    }

    if ($auth.currentUser) {
        try {
            // İsim güncellemesi (updateProfile) kaldırıldı
            const userRef = doc(db, "users", $auth.currentUser.uid);
            await updateDoc(userRef, {
                // DisplayName ve Branch update kaldırıldı
                avatar: {
                    type: tempProfile.value.avatarType,
                    preset: tempProfile.value.selectedPreset,
                    uploadedImage: tempProfile.value.uploadedImage
                }
            })
        } catch (e) { console.error("Profil güncellenemedi", e) }
    }
    isProfileModalOpen.value = false
}

const handleLogout = async () => {
    localStorage.removeItem('userRole');
    await signOut($auth);
    router.push('/');
}

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
                if (data.role !== 'teacher') { router.push(data.role === 'student' ? '/dashboard' : '/'); return; }
                isTeacher.value = true;
                
                // Verileri Çek
                userBranch.value = data.branch || '';
                userSchoolLevel.value = data.schoolLevel || ''; // 'ilkokul', 'ortaokul' veya 'lise' beklenir
                teacherScore.value = data.score || 0;
                
                if (data.avatar) {
                    profileState.value = {
                        avatarType: data.avatar.type || 'initials',
                        selectedPreset: data.avatar.preset || '',
                        uploadedImage: data.avatar.uploadedImage || null
                    }
                }
                if (data.availability) Object.assign(myAvailability, data.availability);
                await fetchMyTests(user.uid);
                fetchChats();
                fetchTeacherBookings();
            }
        } else { router.push('/kayit-giris') }
        isLoading.value = false
    })
})
</script>

<style scoped>
/* TEMEL DÜZEN */
.dashboard-container {
    display: flex;
    min-height: 100vh;
    background-color: #0a0a0a;
    color: white;
    font-family: 'Montserrat', sans-serif;
    padding-top: 0;
}

/* YENİ EKLENEN STİLLER (READ-ONLY ALANLAR İÇİN) */
.read-only-group {
    margin-bottom: 20px;
}
.read-only-text {
    background: #111;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #333;
    color: #aaa;
    margin-top: 5px;
    font-size: 0.95rem;
}
.read-only-text.highlight {
    color: #0055ff;
    font-weight: bold;
    border-color: #0055ff;
    background: rgba(0, 85, 255, 0.05);
}
.read-only-group small {
    display: block;
    color: #555;
    font-size: 0.75rem;
    margin-top: 5px;
}
.disabled-input {
    background: #111;
    color: #777;
    cursor: not-allowed;
    border-color: #222;
}

/* ANIMASYONLAR (DASHBOARD.VUE ILE EŞİTLENDİ) */
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

/* LOADING SCREEN */
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
    padding: 120px 20px 40px 20px;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    overflow-y: auto;
    z-index: 100;
}

.main-content {
    margin-left: 280px;
    flex-grow: 1;
    padding: 120px 40px 40px 40px;
    width: calc(100% - 280px);
}

.profile-section {
    text-align: center;
    margin-bottom: 40px;
}

.avatar {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    border: 3px solid #0055ff;
    object-fit: cover;
    margin-bottom: 10px;
}

.avatar-wrapper {
    position: relative;
    display: inline-block;
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
}

.edit-profile-btn:hover {
    background: #0055ff;
}

.user-name {
    font-size: 1.1rem;
    margin-bottom: 5px;
    color: #fff;
    font-weight: 600;
}

.user-email {
    font-size: 0.8rem;
    color: #666;
}

.user-branch-info {
    color: #0055ff;
    font-weight: bold;
    font-size: 0.85rem;
    margin-top: 5px;
}

.sidebar-nav button {
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
    margin-bottom: 8px;
}

.sidebar-nav button:hover,
.sidebar-nav button.active {
    background: #0055ff;
    color: white;
}

.logout-btn {
    margin-top: auto;
    padding: 12px;
    background: #1a1a1a;
    border: 1px solid #333;
    color: #ff4444;
    border-radius: 12px;
    cursor: pointer;
    transition: 0.2s;
}

.logout-btn:hover {
    background: #330000;
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
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
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

/* EMPTY STATE */
.empty-state {
    text-align: center;
    padding: 100px 0;
    color: #555;
    border: 2px dashed #222;
    border-radius: 16px;
    width: 100%;
}

/* CALENDAR */
.calendar-wrapper {
    background: #161616;
    border-radius: 16px;
    border: 1px solid #333;
    overflow: hidden;
    margin-top: 20px;
}

.calendar-header {
    display: grid;
    grid-template-columns: 80px repeat(7, 1fr);
    background: #222;
    border-bottom: 1px solid #333;
}

.cal-time-col,
.cal-day-col {
    padding: 15px 5px;
    text-align: center;
    font-weight: 600;
    color: #ccc;
    font-size: 0.9rem;
}

.cal-time-col {
    border-right: 1px solid #333;
}

.calendar-body {
    display: flex;
    flex-direction: column;
}

.cal-row {
    display: grid;
    grid-template-columns: 80px repeat(7, 1fr);
    border-bottom: 1px solid #222;
}

.cal-row:last-child {
    border-bottom: none;
}

.cal-time-cell {
    padding: 15px 5px;
    text-align: center;
    color: #666;
    font-size: 0.85rem;
    border-right: 1px solid #333;
    display: flex;
    align-items: center;
    justify-content: center;
}

.cal-cell {
    padding: 10px;
    border-right: 1px solid #222;
    cursor: pointer;
    transition: 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    min-height: 50px;
}

.cal-cell:hover {
    background: #1f1f1f;
}

.cal-cell.available {
    background: rgba(0, 85, 255, 0.2);
    color: #0055ff;
    font-weight: bold;
    box-shadow: inset 0 0 0 1px #0055ff;
}

.cal-cell.booked {
    background: #0055ff;
    color: white;
    cursor: not-allowed;
}

.booked-info {
    font-size: 0.75rem;
    text-align: center;
    line-height: 1.2;
}

.plus-icon {
    opacity: 0;
    color: #555;
    font-size: 1.2rem;
}

.cal-cell:hover .plus-icon {
    opacity: 1;
}

/* FORM */
.section-block {
    background: #161616;
    padding: 30px;
    border-radius: 16px;
    border: 1px solid #333;
}

.upload-container {
    display: flex;
    gap: 40px;
}

.upload-form {
    flex: 1;
}

.answer-key-panel {
    width: 320px;
    background: #111;
    padding: 20px;
    border-radius: 12px;
    max-height: 500px;
    overflow-y: auto;
    border: 1px solid #333;
}

.file-drop-area {
    border: 2px dashed #333;
    padding: 40px;
    text-align: center;
    border-radius: 12px;
    cursor: pointer;
    transition: 0.3s;
    background: #0f0f0f;
}

.file-drop-area:hover {
    border-color: #0055ff;
    background: rgba(0, 85, 255, 0.05);
}

.file-drop-area.has-file {
    border-style: solid;
    border-color: #00c853;
}

.icon-upload {
    font-size: 2rem;
    display: block;
    margin-bottom: 10px;
    opacity: 0.7;
}

.file-selected {
    color: #00c853;
}

input,
select {
    width: 100%;
    padding: 14px;
    background: #0a0a0a;
    border: 1px solid #333;
    color: white;
    border-radius: 8px;
    font-size: 0.95rem;
    margin-bottom: 5px;
}

input:focus,
select:focus {
    outline: none;
    border-color: #0055ff;
}

.btn-primary-large {
    background: #0055ff;
    color: white;
    border: none;
    padding: 16px 40px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    width: 100%;
    margin-top: 20px;
    transition: 0.3s;
}

.btn-primary-large:hover {
    background: #0044cc;
    transform: translateY(-2px);
}

.btn-primary-large:disabled {
    background: #333;
    color: #666;
    transform: none;
    cursor: not-allowed;
}

/* MESSAGES */
.messages-container {
    display: flex;
    height: 600px;
    background: #161616;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid #333;
}

.chat-sidebar {
    width: 260px;
    background: #121212;
    border-right: 1px solid #222;
}

.chat-list {
    flex: 1;
    overflow-y: auto;
}

.chat-window {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0e0e0e;
}

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

@keyframes pulse {
    0% {
        opacity: 0.5;
    }

    50% {
        opacity: 1;
    }

    100% {
        opacity: 0.5;
    }
}

/* TEST CARD */
.test-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
    margin-top: 20px;
}

.test-card {
    background: #1a1a1a;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #333;
    transition: 0.3s;
    display: flex;
    flex-direction: column;
}

.test-card:hover {
    transform: translateY(-5px);
    border-color: #0055ff;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.test-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
}

.badge-subject {
    background: #0055ff;
    font-size: 0.7rem;
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: bold;
}

.btn-update-test {
    margin-top: auto;
    padding: 10px;
    background: #222;
    color: #ccc;
    border: 1px solid #444;
    border-radius: 8px;
    cursor: pointer;
}

.btn-update-test:hover {
    background: white;
    color: black;
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
    z-index: 5000;
}

.modal-content {
    background: #1a1a1a;
    padding: 30px;
    border-radius: 16px;
    width: 90%;
    max-width: 450px;
    border: 1px solid #333;
    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
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
    margin-top: 20px;
}

.btn-save {
    background: #0055ff;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
}

/* RESPONSIVE */
@media (max-width: 1024px) {
    .sidebar {
        width: 0;
        padding: 0;
        overflow: hidden;
    }

    .main-content {
        margin-left: 0;
        width: 100%;
        padding: 100px 20px;
    }

    .upload-container {
        flex-direction: column;
    }

    .answer-key-panel {
        width: 100%;
    }

    .cal-day-col,
    .cal-cell {
        font-size: 0.7rem;
        padding: 5px;
    }
}
</style>