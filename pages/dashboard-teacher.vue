<template>
    <div v-if="isLoading" class="loading-screen">
        <div class="spinner"></div>
        <p>Yetki kontrolü yapılıyor...</p>
        <small style="color: #666; margin-top: 5px;">Veriler yükleniyor...</small>
    </div>

    <div v-else-if="isTeacher" class="dashboard-container">

        <button class="mobile-toggle-btn" @click="isSidebarOpen = !isSidebarOpen">
            ☰
        </button>

        <div v-if="isSidebarOpen" class="sidebar-overlay" @click="isSidebarOpen = false"></div>

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
                    <button class="edit-profile-btn" @click="openProfileModal" title="Profili Düzenle">✏️</button>
                    <img :src="currentAvatarUrl" alt="Profil" class="avatar" />
                </div>
                <h3 class="user-name">{{ userDisplayName || 'Değerli Öğretmenimiz' }}</h3>
                <p class="user-email">{{ userEmail }}</p>
                <p v-if="userBranch" class="user-branch-info">{{ userBranch }} Öğretmeni</p>
            </div>

            <nav class="sidebar-nav">
                <button @click="{ activeTab = 'profile-settings'; isSidebarOpen = false }"
                    :class="{ active: activeTab === 'profile-settings' }">
                    <span class="icon">🎯</span> Yayın & Profil
                    <span v-if="isPublished" class="live-dot">●</span>
                </button>
                <button @click="{ activeTab = 'calendar'; isSidebarOpen = false }"
                    :class="{ active: activeTab === 'calendar' }">
                    <span class="icon">📅</span> Programım
                </button>
                <button @click="{ activeTab = 'bookings'; isSidebarOpen = false }"
                    :class="{ active: activeTab === 'bookings' }">
                    <span class="icon">🗓️</span> Randevularım
                </button>
                <button @click="{ activeTab = 'monthly-calendar'; isSidebarOpen = false }"
                    :class="{ active: activeTab === 'monthly-calendar' }">
                    <span class="icon">📅</span> Takvimim
                </button>
                <button @click="{ activeTab = 'test-upload'; isSidebarOpen = false }"
                    :class="{ active: activeTab === 'test-upload' }">
                    <span class="icon">📤</span> Test Yönetimi
                </button>
                <button @click="{ activeTab = 'history'; isSidebarOpen = false }"
                    :class="{ active: activeTab === 'history' }">
                    <span class="icon">📚</span> Geçmiş Derslerim
                </button>
                <button @click="{ activeTab = 'messages'; isSidebarOpen = false }"
                    :class="{ active: activeTab === 'messages' }">
                    <span class="icon">💬</span> Mesajlar
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
                                    <span v-if="isBooked(day, time)" class="booked-info">{{ getBookingInfo(day, time) }}</span>
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
                                    <span class="badge-grade">{{ test.grade === 'Mezun' ? 'Mezun' : test.grade + '.Sınıf' }}</span>
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

                <!-- YAYIN & PROFİL SEKMESİ -->
                <div v-if="activeTab === 'profile-settings'" class="animate-fade">
                    <h2 class="section-title">Yayın & Profil</h2>

                    <div v-if="myTests.length < MIN_TESTS_TO_PUBLISH" class="publish-warning-card">
                        <span class="pw-icon">⚠️</span>
                        <div>
                            <h3>Yayına alabilmek için {{ MIN_TESTS_TO_PUBLISH }} test gerekiyor</h3>
                            <p>Şu an <strong>{{ myTests.length }}</strong> test var. <strong>{{ MIN_TESTS_TO_PUBLISH - myTests.length }}</strong> tane daha eklemen gerekiyor.</p>
                            <div class="test-progress-bar">
                                <div class="test-progress-fill" :style="{ width: (myTests.length / MIN_TESTS_TO_PUBLISH * 100) + '%' }"></div>
                            </div>
                            <small>{{ myTests.length }}/{{ MIN_TESTS_TO_PUBLISH }}</small>
                        </div>
                    </div>

                    <div class="publish-card" :class="{ published: isPublished }">
                        <div class="publish-left">
                            <div class="publish-status-dot" :class="{ active: isPublished }"></div>
                            <div>
                                <h3>{{ isPublished ? '🟢 Yayındasın!' : '⚫ Yayında Değilsin' }}</h3>
                                <p>{{ isPublished ? 'Öğrenciler seni görebilir ve ders talep edebilir.' : 'Gizlisin. Yayına alınca öğrenciler seni bulabilir.' }}</p>
                            </div>
                        </div>
                        <button class="btn-toggle-publish" :class="{ active: isPublished }" @click="togglePublish">
                            {{ isPublished ? 'Yayından Kaldır' : 'Yayına Al' }}
                        </button>
                    </div>

                    <div class="profile-edit-card">
                        <h3>📝 Profil Bilgileri</h3>
                        <p class="profile-edit-hint">Öğrenci kartında görünecek bilgiler</p>
                        <div class="form-group" style="margin-top:20px">
                            <label>Ders Ücreti (Puan)</label>
                            <div class="price-input-wrapper">
                                <span class="price-icon">💎</span>
                                <input type="number" v-model="lessonPriceInput" min="0" placeholder="0 = Ücretsiz" class="price-input" />
                                <span class="price-suffix">puan / ders</span>
                            </div>
                            <small>0 girerseniz ücretsiz görünür.</small>
                        </div>
                        <div class="form-group" style="margin-top:20px">
                            <label>Biyografi</label>
                            <textarea v-model="bioInput" rows="4" maxlength="300" placeholder="Kendinizi tanıtın..." class="bio-textarea"></textarea>
                            <small>{{ bioInput.length }}/300 karakter</small>
                        </div>
                        <button class="btn-save-profile-public" @click="savePublicProfile" :disabled="isSavingProfile">
                            {{ isSavingProfile ? 'Kaydediliyor...' : '💾 Kaydet' }}
                        </button>
                    </div>

                    <div class="profile-preview-card" v-if="isPublished">
                        <h3>👁️ Öğrenci Gözünden Görünüm</h3>
                        <div class="teacher-preview">
                            <div class="tp-avatar"><img :src="currentAvatarUrl" /></div>
                            <div class="tp-info">
                                <h4>{{ userDisplayName }}</h4>
                                <span class="badge">{{ userBranch }}</span>
                                <p v-if="bioInput" class="tp-bio">{{ bioInput }}</p>
                                <div class="tp-meta">
                                    <span class="tp-price" v-if="lessonPriceInput > 0">💎 {{ lessonPriceInput }} Puan/Ders</span>
                                    <span class="tp-price-free" v-else>🎁 Ücretsiz</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- RANDEVULAR SEKMESİ -->
                <div v-if="activeTab === 'bookings'" class="animate-fade">
                    <h2 class="section-title">Randevularım</h2>
                    <div v-if="myBookingsList.length === 0" class="empty-state">
                        <p>Henüz randevunuz bulunmuyor.</p>
                    </div>
                    <div v-else class="bookings-list">
                        <div v-for="booking in myBookingsList" :key="booking.id" class="booking-item"
                            :class="{ cancelled: booking.status?.includes('cancelled'), completed: booking.status === 'completed' }">
                            <div class="booking-left">
                                <div class="booking-day-badge">{{ booking.day }}</div>
                                <div>
                                    <h4>{{ booking.studentName || 'Öğrenci' }}</h4>
                                    <p>🕒 {{ booking.time }}</p>
                                    <p v-if="booking.lessonPrice > 0" class="booking-price">💎 {{ booking.lessonPrice }} puan</p>
                                </div>
                            </div>
                            <div class="booking-right">
                                <span class="booking-status"
                                    :class="booking.status === 'completed' ? 'status-completed' : booking.status?.includes('cancelled') ? 'status-cancelled' : 'status-confirmed'">
                                    {{ booking.status === 'completed' ? '✅ Tamamlandı' : booking.status?.includes('cancelled') ? '❌ İptal' : '✅ Onaylı' }}
                                </span>
                                <template v-if="!booking.status?.includes('cancelled') && booking.status !== 'completed'">
                                    <button class="btn-enter-lesson" @click="enterLesson(booking)">
                                        🎥 Derse Gir
                                    </button>
                                    <button class="btn-complete-lesson" @click="completeLesson(booking)">
                                        {{ booking.lessonPrice > 0 ? `✅ Tamamla (+${booking.lessonPrice}p)` : '✅ Tamamla' }}
                                    </button>
                                    <button class="btn-cancel-lesson" @click="cancelBookingByTeacher(booking)">İptal Et</button>
                                </template>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="activeTab === 'monthly-calendar'" class="animate-fade">
                    <h2 class="section-title">Takvimim</h2>
                    <div class="calendar-container">
                        <div class="calendar-header-control">
                            <button @click="changeMonth(-1)">❮</button>
                            <h3>{{ currentMonthName }} {{ currentYear }}</h3>
                            <button @click="changeMonth(1)">❯</button>
                        </div>
                        <div class="calendar-grid-header">
                            <div v-for="day in ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']" :key="day">{{ day }}</div>
                        </div>
                        <div class="calendar-grid">
                            <div v-for="blank in firstDayOffset" :key="'blank-' + blank" class="calendar-day empty"></div>
                            <div v-for="date in daysInMonth" :key="date" class="calendar-day">
                                <span class="day-number" :class="{ 'today': isToday(date) }">{{ date }}</span>
                                <div class="day-events">
                                    <div v-for="booking in getTeacherBookingsForDate(date)" :key="booking.id"
                                        class="event-pill" :class="{ 'pill-cancelled': booking.status?.includes('cancelled') }">
                                        <span class="pill-text">{{ booking.time }} {{ booking.studentName }}</span>
                                        <button v-if="!booking.status?.includes('cancelled')"
                                            class="pill-enter-btn"
                                            @click.stop="enterLesson(booking)"
                                            title="Derse Gir">🎥</button>
                                        <span v-else class="pill-cancelled-label">İptal</span>
                                    </div>
                                </div>
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
definePageMeta({ ssr: false })

import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth'
import { getFirestore, doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, onSnapshot, orderBy, serverTimestamp, deleteField } from 'firebase/firestore'

const router = useRouter(); const { $auth } = useNuxtApp(); let db;
const isSidebarOpen = ref(false); const isLoading = ref(true); const isTeacher = ref(false); const activeTab = ref('calendar'); const userDisplayName = ref(''); const userEmail = ref(''); const userBranch = ref(''); const userSchoolLevel = ref(''); const teacherScore = ref(0); const pastLessons = ref([]); const myTests = ref([]);
const myChats = ref([]); const activeChat = ref(null); const activeMessages = ref([]); const newMessage = ref(''); let typingTimeout = null;
const daysOfWeek = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]; const timeSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"]; const myAvailability = reactive({}); const myBookings = reactive({});
const testForm = reactive({ title: '', grade: '', subject: '', questionCount: 0, file: null, answers: [] });
const availableGrades = computed(() => { const level = userSchoolLevel.value; if (level === 'ilkokul') return [1, 2, 3, 4]; else if (level === 'ortaokul') return [5, 6, 7, 8]; else if (level === 'lise') return [9, 10, 11, 12, 'Mezun']; else return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, "Mezun"]; });
const isFormValid = computed(() => testForm.title && testForm.grade && userBranch.value && testForm.file && testForm.questionCount > 0 && testForm.answers.length === testForm.questionCount && !testForm.answers.includes(undefined));
const isUpdateModalOpen = ref(false); const editTestForm = reactive({ id: null, title: '', grade: '', subject: '' });
const isPublished = ref(false)
const lessonPriceInput = ref(0)
const bioInput = ref('')
const isSavingProfile = ref(false)
const myBookingsList = ref([])

// ── Aylık Takvim State ──
const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())
const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]
const currentMonthName = computed(() => monthNames[currentMonth.value])
const daysInMonth = computed(() => new Date(currentYear.value, currentMonth.value + 1, 0).getDate())
const firstDayOffset = computed(() => { let d = new Date(currentYear.value, currentMonth.value, 1).getDay(); return d === 0 ? 6 : d - 1 })
const changeMonth = (delta) => { currentMonth.value += delta; if (currentMonth.value > 11) { currentMonth.value = 0; currentYear.value++ } if (currentMonth.value < 0) { currentMonth.value = 11; currentYear.value-- } }
const isToday = (date) => { const today = new Date(); return date === today.getDate() && currentMonth.value === today.getMonth() && currentYear.value === today.getFullYear() }
const getTeacherBookingsForDate = (date) => {
    const d = new Date(currentYear.value, currentMonth.value, date)
    const dayIndex = d.getDay()
    const dayMap = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"]
    const dayName = dayMap[dayIndex]
    return myBookingsList.value.filter(b => {
        if (b.bookingDate) {
            const bookDate = new Date(b.bookingDate)
            return bookDate.getFullYear() === d.getFullYear() &&
                   bookDate.getMonth() === d.getMonth() &&
                   bookDate.getDate() === d.getDate()
        }
        if (b.day !== dayName) return false
        if (!b.createdAt) return true
        const created = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt.seconds ? b.createdAt.seconds * 1000 : b.createdAt)
        const getMonday = (dt) => { const day = dt.getDay(); const diff = (day === 0 ? -6 : 1 - day); return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + diff) }
        return getMonday(created).getTime() === getMonday(d).getTime()
    })
}
const MIN_TESTS_TO_PUBLISH = 5
const isAvailable = (day, time) => myAvailability[`${day}-${time}`] === true;
const isBooked = (day, time) => !!myBookings[`${day}-${time}`];
const getBookingInfo = (day, time) => { const booking = myBookings[`${day}-${time}`]; return booking ? booking.student : 'Dolu'; }
const toggleAvailability = async (day, time) => { if (isBooked(day, time)) { alert("Bu saatte dersiniz var, iptal edemezsiniz."); return; } const key = `${day}-${time}`; if (myAvailability[key]) delete myAvailability[key]; else myAvailability[key] = true; if ($auth.currentUser) { const userRef = doc(db, "users", $auth.currentUser.uid); if (myAvailability[key]) await updateDoc(userRef, { [`availability.${key}`]: true }).catch(e => console.error(e)); else await updateDoc(userRef, { [`availability.${key}`]: deleteField() }).catch(e => console.error(e)); } }
const fetchTeacherBookings = async () => {
    if (!db) db = getFirestore()
    const q = query(collection(db, "bookings"), where("teacherId", "==", $auth.currentUser.uid))
    const snap = await getDocs(q)
    myBookingsList.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    snap.forEach(docItem => {
        const data = docItem.data()
        if (!data.status?.includes('cancelled')) {
            const key = `${data.day}-${data.time}`
            myBookings[key] = { student: data.studentName || 'Öğrenci', id: docItem.id, bookingId: docItem.id, lessonPrice: data.lessonPrice || 0, studentId: data.studentId }
        }
    })
}

// Yayın toggle - 5 test zorunluluğu kontrolü
const togglePublish = async () => {
    if (!db) db = getFirestore()
    if (!isPublished.value && myTests.value.length < MIN_TESTS_TO_PUBLISH) {
        const remaining = MIN_TESTS_TO_PUBLISH - myTests.value.length
        alert(`⚠️ Yayına alabilmek için en az ${MIN_TESTS_TO_PUBLISH} test yüklemelisin.\nŞu an: ${myTests.value.length} test. ${remaining} tane daha ekle.`)
        return
    }
    const newState = !isPublished.value
    try {
        await updateDoc(doc(db, "users", $auth.currentUser.uid), { isPublished: newState })
        isPublished.value = newState
    } catch(e) { console.error(e) }
}

const savePublicProfile = async () => {
    if (!db) db = getFirestore()
    isSavingProfile.value = true
    try {
        await updateDoc(doc(db, "users", $auth.currentUser.uid), {
            lessonPrice: parseInt(lessonPriceInput.value) || 0,
            bio: bioInput.value.slice(0, 300)
        })
        alert('✅ Profil kaydedildi!')
    } catch(e) { alert('Kayıt hatası') }
    isSavingProfile.value = false
}

const enterLesson = (booking) => {
    // Saat kontrolü
    if (booking.bookingDate && booking.time) {
        const [hour, minute] = booking.time.split(':').map(Number)
        const lessonStart = new Date(booking.bookingDate)
        lessonStart.setHours(hour, minute, 0, 0)
        const lessonEnd = new Date(lessonStart.getTime() + 60 * 60 * 1000)
        const earliestEntry = new Date(lessonStart.getTime() - 15 * 60 * 1000)
        const now = new Date()
        if (now < earliestEntry) {
            const dateStr = lessonStart.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
            alert(`⏰ Ders henüz başlamadı.\n\nDers zamanı: ${dateStr} ${booking.time}\n\nDerse 15 dakika öncesinden girebilirsiniz.`)
            return
        }
        if (now > lessonEnd) {
            alert('⏰ Bu ders süresi dolmuş.')
            return
        }
    }
    router.push(`/meets/${booking.id}`)
}

const cancelBookingByTeacher = async (booking) => {
    if (!confirm(`${booking.studentName} ile ${booking.day} ${booking.time} randevusunu iptal et?`)) return
    if (!db) db = getFirestore()
    try {
        await updateDoc(doc(db, "bookings", booking.id), { status: "cancelled_by_teacher", cancelledAt: serverTimestamp() })
        const slotKey = `${booking.day}-${booking.time}`
        await updateDoc(doc(db, "users", $auth.currentUser.uid), { [`availability.${slotKey}`]: true })
        if (booking.lessonPrice > 0) {
            const studentSnap = await getDoc(doc(db, "users", booking.studentId))
            if (studentSnap.exists()) {
                await updateDoc(doc(db, "users", booking.studentId), { score: (studentSnap.data().score || 0) + booking.lessonPrice })
            }
        }
        delete myBookings[`${booking.day}-${booking.time}`]
        await fetchTeacherBookings()
        alert('Randevu iptal edildi.' + (booking.lessonPrice > 0 ? ` Öğrenciye ${booking.lessonPrice} puan iade edildi.` : ''))
    } catch(e) { console.error(e); alert("Hata oluştu.") }
}

const completeLesson = async (booking) => {
    if (!confirm(`${booking.studentName} ile dersi tamamlandı olarak işaretle? Ücret öğretmen puanına aktarılacak.`)) return
    if (!db) db = getFirestore()
    try {
        await updateDoc(doc(db, "bookings", booking.id), { status: "completed", completedAt: serverTimestamp() })
        if (booking.lessonPrice > 0) {
            const teacherSnap = await getDoc(doc(db, "users", $auth.currentUser.uid))
            const newScore = (teacherSnap.data().score || 0) + booking.lessonPrice
            await updateDoc(doc(db, "users", $auth.currentUser.uid), { score: newScore })
            teacherScore.value = newScore
            alert(`✅ Ders tamamlandı! +${booking.lessonPrice} puan kazandın.`)
        } else {
            alert('✅ Ders tamamlandı!')
        }
        await fetchTeacherBookings()
    } catch(e) { console.error(e); alert("Hata oluştu.") }
}
const fetchMyTests = async (uid) => { if (!db) db = getFirestore(); try { const q = query(collection(db, "tests"), where("uploaderId", "==", uid)); const querySnapshot = await getDocs(q); const tests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); myTests.value = tests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); } catch (error) { console.error("Testler çekilemedi:", error); } }
const handlePdfUpload = (e) => { const file = e.target.files[0]; if (file && file.type === "application/pdf") testForm.file = file; else alert("Lütfen geçerli bir PDF dosyası seçin."); }
const generateAnswerKeyInputs = () => { const count = parseInt(testForm.questionCount); if (!count || count < 0) { testForm.answers = []; return; } const newAnswers = new Array(count).fill(null); for (let i = 0; i < Math.min(count, testForm.answers.length); i++) newAnswers[i] = testForm.answers[i]; testForm.answers = newAnswers; }
const setAnswer = (index, option) => { testForm.answers[index] = option; }
const submitTest = async () => {
    if (!db) db = getFirestore()
    const finalSubject = userBranch.value
    try {
        const fakePdfUrl = "https://example.com/uploads/sample_test.pdf"
        await addDoc(collection(db, "tests"), {
            uploaderId: $auth.currentUser.uid,
            uploaderName: userDisplayName.value,
            title: testForm.title,
            grade: testForm.grade,
            subject: finalSubject,
            questionCount: testForm.questionCount,
            answerKey: testForm.answers,
            pdfUrl: fakePdfUrl,
            createdAt: new Date().toISOString()
        })
        await fetchMyTests($auth.currentUser.uid)
        const count = myTests.value.length
        const remaining = Math.max(0, MIN_TESTS_TO_PUBLISH - count)
        if (remaining > 0) {
            alert(`✅ Test yüklendi! (${count}/${MIN_TESTS_TO_PUBLISH})\nYayına alabilmek için ${remaining} test daha eklemelisin.`)
        } else {
            alert(`✅ Test yüklendi! Artık yayına alabilirsin. 🎉`)
        }
        Object.assign(testForm, { title: '', questionCount: 0, file: null, answers: [] })
    } catch (error) { alert("Hata: " + error.message) }
}
const openUpdateModal = (test) => { editTestForm.id = test.id; editTestForm.title = test.title; editTestForm.grade = test.grade; editTestForm.subject = test.subject; isUpdateModalOpen.value = true }
const saveTestUpdate = async () => { if (!db) db = getFirestore(); try { const testRef = doc(db, "tests", editTestForm.id); await updateDoc(testRef, { title: editTestForm.title, grade: editTestForm.grade, }); alert("Test güncellendi."); isUpdateModalOpen.value = false; await fetchMyTests($auth.currentUser.uid) } catch (e) { alert("Güncelleme hatası: " + e.message) } }
const fetchChats = () => { if (!db) db = getFirestore(); const q = query(collection(db, "chats"), where("participants", "array-contains", $auth.currentUser.uid)); onSnapshot(q, (snapshot) => { myChats.value = snapshot.docs.map(doc => { const data = doc.data(); const otherId = data.participants.find(p => p !== $auth.currentUser.uid); const otherName = otherId === data.studentId ? data.studentName : data.teacherName; return { id: doc.id, ...data, otherUserName: otherName, otherUserId: otherId }; }); if (activeChat.value) { const updated = myChats.value.find(c => c.id === activeChat.value.id); if (updated) activeChat.value = { ...activeChat.value, ...updated }; } }); };
const selectChat = (chat) => { activeChat.value = chat; loadMessages(chat.id); markAsRead(chat.id); };
const loadMessages = (chatId) => { if (!db) db = getFirestore(); const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc")); onSnapshot(q, (snapshot) => { activeMessages.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); setTimeout(() => { const container = document.querySelector('.messages-area'); if (container) container.scrollTop = container.scrollHeight; }, 100); }); };
const handleTyping = async () => { if (!activeChat.value) return; const chatRef = doc(db, "chats", activeChat.value.id); await updateDoc(chatRef, { [`typing.${$auth.currentUser.uid}`]: true }); if (typingTimeout) clearTimeout(typingTimeout); typingTimeout = setTimeout(async () => { await updateDoc(chatRef, { [`typing.${$auth.currentUser.uid}`]: false }); }, 2000); };
const markAsRead = async (chatId) => { if (!chatId) return; const chatRef = doc(db, "chats", chatId); await updateDoc(chatRef, { [`lastRead.${$auth.currentUser.uid}`]: serverTimestamp() }); };
const isMessageRead = (msg) => { if (!activeChat.value || !activeChat.value.lastRead || !msg.createdAt) return false; const otherUserId = activeChat.value.otherUserId; const readTime = activeChat.value.lastRead[otherUserId]; if (!readTime) return false; return readTime.seconds >= msg.createdAt.seconds; };
const sendMessage = async () => { if (!newMessage.value.trim() || !activeChat.value) return; const text = newMessage.value; newMessage.value = ''; const chatRef = doc(db, "chats", activeChat.value.id); await addDoc(collection(chatRef, "messages"), { text, senderId: $auth.currentUser.uid, createdAt: serverTimestamp() }); await updateDoc(chatRef, { lastMessage: text, updatedAt: serverTimestamp() }); if (typingTimeout) clearTimeout(typingTimeout); await updateDoc(chatRef, { [`typing.${$auth.currentUser.uid}`]: false }); };
const isProfileModalOpen = ref(false); const fileInput = ref(null); const profileState = ref({ avatarType: 'initials', selectedPreset: '', uploadedImage: null }); const tempProfile = ref({ avatarType: 'initials', selectedPreset: '', uploadedImage: null }); const presetAvatars = ["https://api.dicebear.com/7.x/avataaars/svg?seed=Felix", "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka", "https://api.dicebear.com/7.x/bottts/svg?seed=Bubba", "https://api.dicebear.com/7.x/micah/svg?seed=Callie", "https://api.dicebear.com/7.x/notionists/svg?seed=Cookie"];
const currentAvatarUrl = computed(() => { if (profileState.value.avatarType === 'upload' && profileState.value.uploadedImage) return profileState.value.uploadedImage; if (profileState.value.avatarType === 'preset' && profileState.value.selectedPreset) return profileState.value.selectedPreset; return `https://ui-avatars.com/api/?name=${userDisplayName.value || 'T'}&background=0055ff&color=fff` });
const openProfileModal = () => { tempProfile.value = { avatarType: profileState.value.avatarType, selectedPreset: profileState.value.selectedPreset, uploadedImage: profileState.value.uploadedImage }; isProfileModalOpen.value = true }; const triggerFileUpload = () => fileInput.value.click(); const handleFileUpload = (event) => { const file = event.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = (e) => { tempProfile.value.uploadedImage = e.target.result; tempProfile.value.avatarType = 'upload' }; reader.readAsDataURL(file) } }; const selectPresetAvatar = (url) => { tempProfile.value.selectedPreset = url; tempProfile.value.avatarType = 'preset' }; const saveProfile = async () => { if (!db) db = getFirestore(); profileState.value = { avatarType: tempProfile.value.avatarType, selectedPreset: tempProfile.value.selectedPreset, uploadedImage: tempProfile.value.uploadedImage }; if ($auth.currentUser) { try { const userRef = doc(db, "users", $auth.currentUser.uid); await updateDoc(userRef, { avatar: { type: tempProfile.value.avatarType, preset: tempProfile.value.selectedPreset, uploadedImage: tempProfile.value.uploadedImage } }) } catch (e) { console.error("Profil güncellenemedi", e) } } isProfileModalOpen.value = false }; const handleLogout = async () => { localStorage.removeItem('userRole'); await signOut($auth); router.push('/'); };
onMounted(() => { db = getFirestore(); onAuthStateChanged($auth, async (user) => { if (user) { userEmail.value = user.email; userDisplayName.value = user.displayName || ''; const docRef = doc(db, "users", user.uid); const docSnap = await getDoc(docRef); if (docSnap.exists()) { const data = docSnap.data(); if (data.role !== 'teacher') { router.push(data.role === 'student' ? '/dashboard' : '/'); return; } isTeacher.value = true; userBranch.value = data.branch || ''; userSchoolLevel.value = data.schoolLevel || ''; teacherScore.value = data.score || 0; if (data.avatar) { profileState.value = { avatarType: data.avatar.type || 'initials', selectedPreset: data.avatar.preset || '', uploadedImage: data.avatar.uploadedImage || null } } if (data.availability) Object.assign(myAvailability, data.availability)
                        isPublished.value = data.isPublished || false
                        lessonPriceInput.value = data.lessonPrice || 0
                        bioInput.value = data.bio || ''
                        await fetchMyTests(user.uid); fetchChats(); fetchTeacherBookings(); } } else { router.push('/kayit-giris') } isLoading.value = false }) })
</script>

<style scoped>
/* GENEL LAYOUT */
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

/* SIDEBAR STYLES */
.sidebar {
    width: 280px;
    background-color: #121212;
    border-right: 1px solid #222;
    display: flex;
    flex-direction: column;
    padding: 40px 20px;
    height: 100vh;
    position: sticky;
    top: 0;
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
}

/* Sidebar Navigasyon */
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
    margin-bottom: 8px;
    text-decoration: none;
    font-family: inherit;
}

.sidebar-nav button:hover,
.sidebar-nav button.active {
    background: #0055ff;
    color: white;
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

/* Logout Button */
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
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

/* RESPONSIVE AYARLAR */
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

/* Diğer mevcut CSS stilleri */
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

.empty-state {
    text-align: center;
    padding: 100px 0;
    color: #555;
    border: 2px dashed #222;
    border-radius: 16px;
    width: 100%;
}

.calendar-wrapper {
    background: #161616;
    border-radius: 16px;
    border: 1px solid #333;
    overflow: hidden;
    margin-top: 20px;
}

.calendar-header {
    display: grid;
    grid-template-columns: 64px repeat(7, minmax(0, 1fr));
    background: #1a1a1a;
    border-bottom: 1px solid #2a2a2a;
}

.cal-time-col,
.cal-day-col {
    padding: 12px 4px;
    text-align: center;
    font-weight: 700;
    color: #888;
    font-size: 0.78rem;
    letter-spacing: 0.3px;
    text-transform: uppercase;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.cal-time-col {
    border-right: 1px solid #2a2a2a;
}

.calendar-body {
    display: flex;
    flex-direction: column;
}

.cal-row {
    display: grid;
    grid-template-columns: 64px repeat(7, minmax(0, 1fr));
    border-bottom: 1px solid #1a1a1a;
}

.cal-row:last-child {
    border-bottom: none;
}

.cal-row:hover {
    background: rgba(255,255,255,0.01);
}

.cal-time-cell {
    padding: 0 8px;
    text-align: center;
    color: #555;
    font-size: 0.75rem;
    font-weight: 600;
    border-right: 1px solid #2a2a2a;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 52px;
}

.cal-cell {
    padding: 6px 4px;
    border-right: 1px solid #1a1a1a;
    cursor: pointer;
    transition: background 0.15s;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 0.72rem;
    min-height: 52px;
    overflow: hidden;
    box-sizing: border-box;
}

.cal-cell:last-child {
    border-right: none;
}

.cal-cell:hover {
    background: rgba(255,255,255,0.04);
}

.cal-cell.available {
    background: rgba(16,185,129,0.12);
    color: #10b981;
    font-weight: 700;
}

.cal-cell.available:hover {
    background: rgba(16,185,129,0.06);
}

.cal-cell.booked {
    background: rgba(0,85,255,0.15);
    color: #6699ff;
    cursor: default;
}

.booked-info {
    font-size: 0.65rem;
    text-align: center;
    line-height: 1.3;
    word-break: break-word;
    max-width: 100%;
    overflow: hidden;
}

.plus-icon {
    color: #333;
    font-size: 1rem;
    transition: color 0.15s;
}

.cal-cell:hover .plus-icon {
    color: #10b981;
}

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
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
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

/* ── Yayın & Profil sekmesi ── */
.live-dot {
    color: #10b981; font-size: 0.6rem;
    margin-left: auto;
    animation: pulse-green 1.5s infinite;
}
@keyframes pulse-green { 0%,100%{opacity:1} 50%{opacity:0.3} }

.publish-warning-card {
    display: flex; gap: 15px; align-items: flex-start;
    background: rgba(245,158,11,0.08);
    border: 1px solid rgba(245,158,11,0.3);
    border-radius: 14px; padding: 20px 25px;
    margin-bottom: 20px;
}
.pw-icon { font-size: 1.5rem; flex-shrink: 0; }
.publish-warning-card h3 { color: #f59e0b; font-size: 1rem; margin-bottom: 6px; }
.publish-warning-card p { color: #aaa; font-size: 0.88rem; margin-bottom: 10px; }
.publish-warning-card small { color: #666; font-size: 0.8rem; }
.test-progress-bar {
    width: 100%; height: 6px; background: #222;
    border-radius: 3px; overflow: hidden; margin-bottom: 5px;
}
.test-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #f59e0b, #fbbf24);
    border-radius: 3px; transition: width 0.5s ease;
}

.publish-card {
    display: flex; justify-content: space-between; align-items: center;
    background: #111; border: 1px solid #333; border-radius: 16px;
    padding: 25px 30px; margin-bottom: 25px; gap: 20px; flex-wrap: wrap;
    transition: 0.3s;
}
.publish-card.published { border-color: #10b981; background: linear-gradient(135deg, #071a0e, #0d1f11); }
.publish-left { display: flex; align-items: center; gap: 15px; }
.publish-status-dot { width: 14px; height: 14px; border-radius: 50%; background: #444; flex-shrink: 0; }
.publish-status-dot.active { background: #10b981; box-shadow: 0 0 8px rgba(16,185,129,0.6); animation: pulse-green 1.5s infinite; }
.publish-left h3 { font-size: 1.1rem; color: white; margin-bottom: 5px; }
.publish-left p { font-size: 0.85rem; color: #888; }
.btn-toggle-publish {
    padding: 12px 25px; border-radius: 10px; border: 1px solid #555;
    background: transparent; color: #ccc; font-weight: 600;
    cursor: pointer; transition: 0.3s; white-space: nowrap;
}
.btn-toggle-publish.active { background: rgba(239,68,68,0.1); border-color: #ef4444; color: #ef4444; }
.btn-toggle-publish:not(.active):hover { background: rgba(16,185,129,0.15); border-color: #10b981; color: #10b981; }

.profile-edit-card { background: #111; border: 1px solid #222; border-radius: 16px; padding: 30px; margin-bottom: 25px; }
.profile-edit-card h3 { font-size: 1.1rem; margin-bottom: 5px; color: white; }
.profile-edit-hint { font-size: 0.82rem; color: #666; margin-bottom: 20px; }
.price-input-wrapper {
    display: flex; align-items: center; background: #0a0a0a;
    border: 1px solid #333; border-radius: 10px; overflow: hidden; margin-top: 8px;
}
.price-icon { padding: 10px 12px; font-size: 1.1rem; background: #161616; border-right: 1px solid #333; }
.price-input { flex:1; background: transparent; border: none; color: white; padding: 12px; font-size: 1rem; outline: none; }
.price-suffix { padding: 10px 15px; color: #666; font-size: 0.85rem; white-space: nowrap; }
.bio-textarea {
    width: 100%; background: #0a0a0a; border: 1px solid #333; color: white;
    padding: 12px; border-radius: 10px; font-size: 0.9rem; resize: vertical;
    margin-top: 8px; font-family: inherit; line-height: 1.6;
}
.bio-textarea:focus { outline: none; border-color: #0055ff; }
.profile-edit-card small { color: #555; font-size: 0.75rem; }
.btn-save-profile-public {
    margin-top: 20px; padding: 12px 30px; background: #0055ff;
    color: white; border: none; border-radius: 10px; font-weight: 600;
    cursor: pointer; transition: 0.2s; font-size: 1rem;
}
.btn-save-profile-public:hover:not(:disabled) { background: #0044cc; }
.btn-save-profile-public:disabled { opacity: 0.5; cursor: not-allowed; }

.profile-preview-card { background: #111; border: 1px dashed #333; border-radius: 16px; padding: 30px; }
.profile-preview-card h3 { font-size: 1rem; color: #888; margin-bottom: 20px; }
.teacher-preview { display: flex; gap: 20px; background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 20px; align-items: flex-start; }
.tp-avatar img { width: 65px; height: 65px; border-radius: 50%; object-fit: cover; border: 2px solid #0055ff; }
.tp-info h4 { color: white; margin-bottom: 5px; }
.tp-bio { font-size: 0.82rem; color: #888; margin: 8px 0; line-height: 1.5; }
.tp-meta { display: flex; gap: 12px; margin-top: 8px; }
.tp-price { color: #a78bfa; font-size: 0.82rem; font-weight: 600; }
.tp-price-free { color: #34d399; font-size: 0.82rem; font-weight: 600; }

/* ── Randevu listesi ── */
.bookings-list { display: flex; flex-direction: column; gap: 12px; }
.booking-item {
    display: flex; justify-content: space-between; align-items: center;
    background: #111; border: 1px solid #333; border-radius: 12px;
    padding: 20px; gap: 15px; flex-wrap: wrap; transition: 0.2s;
}
.booking-item:hover { border-color: #444; }
.booking-item.cancelled { opacity: 0.45; }
.booking-item.completed { border-color: rgba(16,185,129,0.3); background: rgba(16,185,129,0.04); }
.booking-left { display: flex; align-items: center; gap: 15px; }
.booking-day-badge { background: #0055ff; color: white; padding: 8px 12px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; min-width: 42px; text-align: center; }
.booking-left h4 { color: white; margin-bottom: 4px; }
.booking-left p { color: #888; font-size: 0.85rem; margin: 2px 0; }
.booking-price { color: #a78bfa !important; }
.booking-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.booking-status { font-size: 0.8rem; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
.status-confirmed { background: rgba(16,185,129,0.15); color: #10b981; }
.status-cancelled { background: rgba(239,68,68,0.15); color: #ef4444; }
.status-completed { background: rgba(16,185,129,0.15); color: #10b981; }
.btn-enter-lesson {
    background: rgba(0,85,255,0.15);
    border: 1px solid rgba(0,85,255,0.4);
    color: #4488ff;
    padding: 6px 14px; border-radius: 6px;
    cursor: pointer; font-size: 0.8rem;
    font-weight: 700; transition: 0.2s;
    margin-bottom: 5px; width: 100%;
}
.btn-enter-lesson:hover { background: #0055ff; color: white; border-color: #0055ff; }

.btn-complete-lesson {
    padding: 7px 14px; background: rgba(16,185,129,0.15);
    border: 1px solid #10b981; color: #10b981;
    border-radius: 8px; font-size: 0.82rem; cursor: pointer; transition: 0.2s;
}
.btn-complete-lesson:hover { background: rgba(16,185,129,0.3); }
.btn-cancel-lesson {
    padding: 7px 14px; background: transparent;
    border: 1px solid #ef4444; color: #ef4444;
    border-radius: 8px; font-size: 0.82rem; cursor: pointer; transition: 0.2s;
}
.btn-cancel-lesson:hover { background: rgba(239,68,68,0.15); }

/* ── Aylık Takvim ── */
.calendar-container { background: #161616; padding: 20px; border-radius: 12px; border: 1px solid #333; }
.calendar-header-control { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.calendar-header-control button { background: transparent; border: none; color: white; font-size: 1.5rem; cursor: pointer; }
.calendar-header-control h3 { margin: 0; color: white; }
.calendar-grid-header { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); text-align: center; font-weight: bold; margin-bottom: 4px; color: #888; font-size: 0.8rem; }
.calendar-grid-header > div { padding: 8px 2px; }
.calendar-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 3px; }
.calendar-day { min-height: 80px; background: #111; border: 1px solid #222; border-radius: 6px; padding: 5px; font-size: 0.78rem; position: relative; overflow: hidden; box-sizing: border-box; }
.calendar-day.empty { background: transparent; border: none; }
.day-number { display: block; text-align: right; margin-bottom: 5px; color: #666; }
.day-number.today { color: #0055ff; font-weight: bold; }
.day-events { display: flex; flex-direction: column; gap: 2px; }
.event-pill { background: #0055ff; color: white; font-size: 0.7rem; padding: 3px 5px; border-radius: 4px; display: flex; align-items: center; justify-content: space-between; gap: 4px; }
.pill-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.pill-enter-btn { background: transparent; border: none; color: rgba(255,255,255,0.85); font-size: 0.7rem; cursor: pointer; padding: 0; line-height: 1; flex-shrink: 0; transition: 0.15s; }
.pill-enter-btn:hover { transform: scale(1.3); }
.event-pill.pill-cancelled { background: #333; text-decoration: line-through; opacity: 0.6; }
.pill-cancelled-label { font-size: 0.58rem; color: #ef4444; flex-shrink: 0; }

</style>