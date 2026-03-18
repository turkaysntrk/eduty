<template>
    <div class="meets-page">

        <!-- ===== YÜKLENİYOR ===== -->
        <div v-if="isLoading" class="meets-loading">
            <div class="loading-logo">
                <img src="/img/eduty_logo.png" alt="Eduty" class="loading-logo-img" />
                <span class="loading-logo-text">EDUTY <span class="meets-word">MEETS</span></span>
            </div>
            <div class="loading-spinner"></div>
            <p>Ders odası hazırlanıyor...</p>
        </div>

        <!-- ===== ERİŞİM REDDEDİLDİ ===== -->
        <div v-else-if="accessDenied" class="meets-loading">
            <div class="loading-logo">
                <img src="/img/eduty_logo.png" alt="Eduty" class="loading-logo-img" />
                <span class="loading-logo-text">EDUTY <span class="meets-word">MEETS</span></span>
            </div>
            <div class="access-denied-box">
                <div class="ad-icon">⏰</div>
                <h2>Henüz Ders Zamanı Değil</h2>
                <p>Bu derse şu an giremezsiniz.</p>
                <p class="ad-time" v-if="accessDeniedMsg">
                    Ders zamanı: <strong>{{ accessDeniedMsg }}</strong>
                </p>
                <small>Derse ders saatinden 15 dakika önce girebilirsiniz.</small>
                <button @click="$router.back()" class="btn-go-back">← Geri Dön</button>
            </div>
        </div>

        <!-- ===== ANA EKRAN ===== -->
        <div v-else class="meets-container">

            <!-- ÜST BAR -->
            <div class="meets-topbar">
                <div class="topbar-left">
                    <img src="/img/eduty_logo.png" alt="Eduty" class="topbar-logo" />
                    <div class="topbar-brand">
                        <span class="brand-eduty">EDUTY</span>
                        <span class="brand-meets">MEETS</span>
                    </div>
                    <div class="topbar-divider"></div>
                    <div class="topbar-room-info">
                        <span class="room-label">Ders Odası</span>
                        <span class="room-name">{{ roomTitle }}</span>
                    </div>
                </div>
                <div class="topbar-center">
                    <div class="topbar-timer" :class="{ 'timer-warning': elapsedMinutes >= 45 }">
                        <span class="timer-icon">⏱</span>
                        <span class="timer-val">{{ formattedTime }}</span>
                    </div>
                </div>
                <div class="topbar-right">
                    <div class="topbar-participants">
                        <span class="part-icon">👥</span>
                        <span class="part-count">{{ participantCount }}</span>
                    </div>
                    <button class="btn-end-lesson" @click="confirmEndLesson">
                        🔴 Dersi Bitir
                    </button>
                </div>
            </div>

            <!-- ANA İÇERİK -->
            <div class="meets-body">

                <!-- VİDEO ALANI (Jitsi) -->
                <div class="video-area">
                    <div id="jitsi-container" class="jitsi-frame"></div>

                    <!-- Jitsi yüklenirken overlay -->
                    <div v-if="!jitsiReady" class="jitsi-loading">
                        <div class="jl-spinner"></div>
                        <p>Bağlantı kuruluyor...</p>
                        <small>Kamera ve mikrofon izni istenebilir</small>
                    </div>
                </div>

                <!-- SAĞ PANEL -->
                <div class="side-panel" :class="{ 'panel-collapsed': isPanelCollapsed }">

                    <div class="panel-tabs">
                        <button @click="sideTab = 'chat'" :class="{ active: sideTab === 'chat' }">
                            💬 <span>Sohbet</span>
                            <span v-if="unreadMessages > 0" class="unread-badge">{{ unreadMessages }}</span>
                        </button>
                        <button @click="sideTab = 'notes'" :class="{ active: sideTab === 'notes' }">
                            📝 <span>Notlar</span>
                        </button>
                        <button @click="sideTab = 'info'" :class="{ active: sideTab === 'info' }">
                            ℹ️ <span>Bilgi</span>
                        </button>
                    </div>

                    <!-- Sohbet -->
                    <div v-if="sideTab === 'chat'" class="panel-content chat-panel">
                        <div class="chat-messages" ref="chatContainer">
                            <div v-for="msg in chatMessages" :key="msg.id"
                                class="chat-msg" :class="{ 'my-msg': msg.senderId === currentUid }">
                                <div class="msg-sender">{{ msg.senderName }}</div>
                                <div class="msg-text">{{ msg.text }}</div>
                                <div class="msg-time">{{ formatMsgTime(msg.createdAt) }}</div>
                            </div>
                            <div v-if="chatMessages.length === 0" class="empty-chat">
                                <span>💬</span>
                                <p>Henüz mesaj yok</p>
                            </div>
                        </div>
                        <div class="chat-input-row">
                            <input
                                v-model="chatInput"
                                @keyup.enter="sendChatMessage"
                                placeholder="Mesaj yaz..."
                                class="chat-input"
                            />
                            <button @click="sendChatMessage" class="btn-send">➤</button>
                        </div>
                    </div>

                    <!-- Notlar -->
                    <div v-if="sideTab === 'notes'" class="panel-content notes-panel">
                        <div class="notes-header">
                            <span>Kişisel Notların</span>
                            <button @click="saveNotes" class="btn-save-notes" :class="{ saved: notesSaved }">
                                {{ notesSaved ? '✅ Kaydedildi' : '💾 Kaydet' }}
                            </button>
                        </div>
                        <textarea
                            v-model="myNotes"
                            placeholder="Bu ders için notlar al..."
                            class="notes-textarea"
                            @input="notesSaved = false"
                        ></textarea>
                    </div>

                    <!-- Bilgi -->
                    <div v-if="sideTab === 'info'" class="panel-content info-panel">
                        <div class="info-item">
                            <span class="info-label">Öğretmen</span>
                            <span class="info-val">{{ bookingInfo.teacherName || '—' }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Öğrenci</span>
                            <span class="info-val">{{ bookingInfo.studentName || '—' }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Saat</span>
                            <span class="info-val">{{ bookingInfo.time || '—' }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Gün</span>
                            <span class="info-val">{{ bookingInfo.day || '—' }}</span>
                        </div>
                        <div class="info-item" v-if="bookingInfo.lessonPrice > 0">
                            <span class="info-label">Ücret</span>
                            <span class="info-val price-val">💎 {{ bookingInfo.lessonPrice }} Puan</span>
                        </div>
                        <div class="info-item" v-else>
                            <span class="info-label">Ücret</span>
                            <span class="info-val free-val">🎁 Ücretsiz</span>
                        </div>
                        <div class="room-id-box">
                            <span class="room-id-label">Oda ID</span>
                            <span class="room-id-val">{{ roomId }}</span>
                            <button @click="copyRoomId" class="btn-copy">{{ copied ? '✅' : '📋' }}</button>
                        </div>
                    </div>

                    <!-- Panel kapatma butonu -->
                    <button class="panel-toggle-btn" @click="isPanelCollapsed = !isPanelCollapsed">
                        {{ isPanelCollapsed ? '◀' : '▶' }}
                    </button>
                </div>
            </div>

            <!-- ALT KONTROL ÇUBUĞU -->
            <div class="meets-controls">
                <div class="controls-left">
                    <span class="ctrl-label">{{ currentUserName }}</span>
                </div>
                <div class="controls-center">
                    <!-- Jitsi kendi kontrol butonlarını yönetiyor, biz sadece bitir butonunu gösteriyoruz -->
                    <button class="ctrl-btn ctrl-end" @click="confirmEndLesson">
                        <span>📵</span>
                        <small>Bitir</small>
                    </button>
                </div>
                <div class="controls-right">
                    <span class="ctrl-status" :class="jitsiReady ? 'status-live' : 'status-connecting'">
                        {{ jitsiReady ? '🟢 Canlı' : '🟡 Bağlanıyor' }}
                    </span>
                </div>
            </div>
        </div>

        <!-- ===== BİTİRME ONAY MODALI ===== -->
        <div v-if="isEndModalOpen" class="modal-overlay">
            <div class="end-modal">
                <div class="end-modal-icon">📵</div>
                <h3>Dersi Bitir</h3>
                <p>Dersi bitirmek istediğine emin misin?</p>
                <div class="end-modal-actions">
                    <button @click="isEndModalOpen = false" class="btn-stay">Devam Et</button>
                    <button @click="endLesson" class="btn-confirm-end">Evet, Bitir</button>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
definePageMeta({ ssr: false, layout: false })

import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { onAuthStateChanged } from 'firebase/auth'
import {
    getFirestore, doc, getDoc, setDoc, addDoc, collection,
    onSnapshot, orderBy, query, serverTimestamp, updateDoc
} from 'firebase/firestore'

const route = useRoute()
const router = useRouter()
const { $auth } = useNuxtApp()
let db

const roomId = computed(() => route.params.room)
const roomTitle = computed(() => {
    if (bookingInfo.value.studentName && bookingInfo.value.teacherName) {
        return `${bookingInfo.value.teacherName} & ${bookingInfo.value.studentName}`
    }
    return roomId.value
})

// State
const isLoading = ref(true)
const accessDenied = ref(false)
const accessDeniedMsg = ref('')
const jitsiReady = ref(false)
const isPanelCollapsed = ref(false)
const sideTab = ref('chat')
const currentUid = ref('')
const currentUserName = ref('')
const participantCount = ref(1)
const isEndModalOpen = ref(false)
const bookingInfo = ref({})

// Sohbet
const chatMessages = ref([])
const chatInput = ref('')
const unreadMessages = ref(0)
const chatContainer = ref(null)

// Notlar
const myNotes = ref('')
const notesSaved = ref(false)

// Kopyalama
const copied = ref(false)

// Süre sayacı
const elapsedSeconds = ref(0)
let timerInterval = null
let jitsiApi = null

const formattedTime = computed(() => {
    const m = Math.floor(elapsedSeconds.value / 60).toString().padStart(2, '0')
    const s = (elapsedSeconds.value % 60).toString().padStart(2, '0')
    return `${m}:${s}`
})

const elapsedMinutes = computed(() => Math.floor(elapsedSeconds.value / 60))

// ── Jitsi başlat ──
const initJitsi = async () => {
    await nextTick()

    const domain = 'meet.jit.si'
    const options = {
        roomName: `eduty-${roomId.value}`,
        parentNode: document.getElementById('jitsi-container'),
        width: '100%',
        height: '100%',
        configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            disableDeepLinking: true,
            prejoinPageEnabled: false,
            enableWelcomePage: false,
            enableNoisyMicDetection: false,
            // Güvenilir STUN/TURN sunucuları — bağlantı sorununu çözer
            p2p: {
                enabled: true,
                stunServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                ]
            },
            toolbarButtons: [
                'microphone',
                'camera',
                'desktop',           // ekran paylaşımı
                'fullscreen',
                'fodeviceselection',
                'settings',
                'videoquality',
                'tileview',
            ],
            // Kamera/mikrofon izinlerini zorla sor
            disableInitialGUM: false,
        },
        interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            BRAND_WATERMARK_LINK: '',
            SHOW_POWERED_BY: false,
            TOOLBAR_ALWAYS_VISIBLE: true,
            HIDE_INVITE_MORE_HEADER: true,
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            DEFAULT_BACKGROUND: '#0a0a0a',
            APP_NAME: 'Eduty Meets',
            MOBILE_APP_PROMO: false,
        },
        userInfo: {
            displayName: currentUserName.value,
        }
    }

    // JitsiMeetExternalAPI global olarak yükleniyor
    jitsiApi = new window.JitsiMeetExternalAPI(domain, options)

    jitsiApi.addEventListener('videoConferenceJoined', () => {
        jitsiReady.value = true
        startTimer()
        // Kendimiz dahil gerçek katılımcı sayısını al
        updateParticipantCount()
    })

    jitsiApi.addEventListener('participantJoined', () => {
        updateParticipantCount()
    })

    jitsiApi.addEventListener('participantLeft', () => {
        updateParticipantCount()
    })

    jitsiApi.addEventListener('videoConferenceLeft', () => {
        endLesson()
    })
}

// ── Gerçek katılımcı sayısını güncelle (kendisi dahil) ──
const updateParticipantCount = () => {
    if (!jitsiApi) return
    try {
        // getParticipantsInfo kendisi dahil tüm katılımcıları döner
        const participants = jitsiApi.getParticipantsInfo()
        participantCount.value = participants.length
    } catch(e) {
        // Fallback: manuel say
        participantCount.value = Math.max(1, participantCount.value)
    }
}

// ── Süre sayacı ──
const startTimer = () => {
    timerInterval = setInterval(() => {
        elapsedSeconds.value++
    }, 1000)
}

// ── Sohbet ──
const loadChat = () => {
    if (!db) db = getFirestore()
    const q = query(
        collection(db, 'meetRooms', roomId.value, 'messages'),
        orderBy('createdAt', 'asc')
    )
    onSnapshot(q, (snap) => {
        chatMessages.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        if (sideTab.value !== 'chat') {
            unreadMessages.value = snap.docChanges().filter(c => c.type === 'added').length
        } else {
            unreadMessages.value = 0
        }
        nextTick(() => {
            if (chatContainer.value) {
                chatContainer.value.scrollTop = chatContainer.value.scrollHeight
            }
        })
    })
}

const sendChatMessage = async () => {
    if (!chatInput.value.trim() || !db) return
    const text = chatInput.value.trim()
    chatInput.value = ''
    await addDoc(collection(db, 'meetRooms', roomId.value, 'messages'), {
        text,
        senderId: currentUid.value,
        senderName: currentUserName.value,
        createdAt: serverTimestamp()
    })
}

const formatMsgTime = (ts) => {
    if (!ts) return ''
    const d = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000)
    return d.toLocaleTimeString('tr-TR').slice(0, 5)
}

// ── Notlar ──
const saveNotes = async () => {
    if (!db) return
    try {
        const noteRef = doc(db, 'meetRooms', roomId.value, 'notes', currentUid.value)
        await setDoc(noteRef, {
            text: myNotes.value,
            updatedAt: serverTimestamp(),
            userId: currentUid.value
        }, { merge: true })
        notesSaved.value = true
        setTimeout(() => notesSaved.value = false, 3000)
    } catch(e) {
        console.error('Not kaydedilemedi:', e)
        alert('Not kaydedilemedi: ' + e.message)
    }
}

// ── Notları yükle ──
const loadNotes = async () => {
    if (!db) return
    try {
        const noteRef = doc(db, 'meetRooms', roomId.value, 'notes', currentUid.value)
        const snap = await getDoc(noteRef)
        if (snap.exists()) {
            myNotes.value = snap.data().text || ''
        }
    } catch(e) {
        console.error('Not yüklenemedi:', e)
    }
}

// ── Oda ID kopyala ──
const copyRoomId = () => {
    navigator.clipboard.writeText(roomId.value)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
}

// ── Dersi bitir ──
const confirmEndLesson = () => {
    isEndModalOpen.value = true
}

const endLesson = () => {
    if (jitsiApi) {
        jitsiApi.dispose()
        jitsiApi = null
    }
    if (timerInterval) clearInterval(timerInterval)
    isEndModalOpen.value = false
    // Kullanıcının rolüne göre yönlendir
    const userData = localStorage.getItem('userRole')
    if (userData === 'teacher') {
        router.push('/dashboard-teacher')
    } else {
        router.push('/dashboard')
    }
}

// ── Ders saati kontrolü ──
const isLessonTimeValid = (booking) => {
    if (!booking || !booking.bookingDate || !booking.time) return true // eski kayıtlara izin ver
    try {
        // bookingDate: "2026-03-17", time: "14:00" gibi
        const [hour, minute] = booking.time.split(':').map(Number)
        const lessonStart = new Date(booking.bookingDate)
        lessonStart.setHours(hour, minute, 0, 0)
        const lessonEnd = new Date(lessonStart.getTime() + 60 * 60 * 1000) // 1 saat
        const now = new Date()
        // 15 dakika öncesinden girişe izin ver
        const earliestEntry = new Date(lessonStart.getTime() - 15 * 60 * 1000)
        return now >= earliestEntry && now <= lessonEnd
    } catch(e) {
        return true
    }
}

const formatLessonTime = (booking) => {
    if (!booking?.bookingDate || !booking?.time) return ''
    const [hour, minute] = booking.time.split(':').map(Number)
    const d = new Date(booking.bookingDate)
    d.setHours(hour, minute)
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) + ' ' + booking.time
}
const loadJitsiScript = () => {
    return new Promise((resolve) => {
        if (window.JitsiMeetExternalAPI) { resolve(); return }
        const script = document.createElement('script')
        script.src = 'https://meet.jit.si/external_api.js'
        script.onload = resolve
        document.head.appendChild(script)
    })
}

onMounted(() => {
    db = getFirestore()
    onAuthStateChanged($auth, async (user) => {
        if (!user) { router.push('/'); return }

        currentUid.value = user.uid
        const snap = await getDoc(doc(db, 'users', user.uid))
        if (snap.exists()) {
            const data = snap.data()
            // Farklı alan isimlerini kontrol et
            currentUserName.value = 
                data.displayName || 
                data.name ||
                (data.firstName ? data.firstName + (data.lastName ? ' ' + data.lastName : '') : null) ||
                user.displayName ||
                user.email
            // Booking bilgisini çek
            const bookingId = roomId.value
            try {
                const bSnap = await getDoc(doc(db, 'bookings', bookingId))
                if (bSnap.exists()) {
                    bookingInfo.value = bSnap.data()
                    // Saat kontrolü
                    if (!isLessonTimeValid(bookingInfo.value)) {
                        const lessonTime = formatLessonTime(bookingInfo.value)
                        accessDenied.value = true
                        accessDeniedMsg.value = lessonTime
                        isLoading.value = false
                        return
                    }
                }
            } catch(e) {}
        }

        isLoading.value = false
        await loadJitsiScript()
        await initJitsi()
        loadChat()
        await loadNotes()
    })
})

onUnmounted(() => {
    if (jitsiApi) { jitsiApi.dispose(); jitsiApi = null }
    if (timerInterval) clearInterval(timerInterval)
})
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.meets-page {
    height: 100vh;
    background: #050505;
    color: white;
    font-family: 'Montserrat', sans-serif;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

/* ── Loading ── */
.meets-loading {
    height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 20px; background: #050505;
}
.loading-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.loading-logo-img { height: 45px; width: auto; }
.loading-logo-text { font-size: 1.8rem; font-weight: 800; color: white; letter-spacing: 2px; }
.meets-word { color: #0055ff; }
.loading-spinner {
    width: 36px; height: 36px;
    border: 3px solid #1a1a1a;
    border-top: 3px solid #0055ff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.meets-loading p { color: #666; font-size: 0.9rem; }

.access-denied-box {
    background: #111; border: 1px solid #222;
    border-radius: 20px; padding: 40px;
    text-align: center; max-width: 420px; width: 90%;
}
.ad-icon { font-size: 3.5rem; margin-bottom: 15px; }
.access-denied-box h2 { color: white; font-size: 1.4rem; margin-bottom: 10px; }
.access-denied-box p { color: #888; margin-bottom: 8px; font-size: 0.9rem; }
.ad-time { color: #ccc !important; }
.ad-time strong { color: #0055ff; }
.access-denied-box small { color: #555; font-size: 0.78rem; display: block; margin-bottom: 25px; }
.btn-go-back {
    background: #0055ff; color: white; border: none;
    padding: 12px 28px; border-radius: 10px;
    font-size: 0.9rem; font-weight: 700; cursor: pointer;
    transition: 0.2s;
}
.btn-go-back:hover { background: #0044cc; }

/* ── Container ── */
.meets-container {
    display: flex; flex-direction: column;
    height: 100vh; overflow: hidden;
}

/* ── Top Bar ── */
.meets-topbar {
    height: 56px;
    background: #0d0d0d;
    border-bottom: 1px solid #1a1a1a;
    display: flex; align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    flex-shrink: 0;
    z-index: 100;
}
.topbar-left { display: flex; align-items: center; gap: 12px; }
.topbar-logo { height: 28px; width: auto; }
.topbar-brand { display: flex; flex-direction: column; line-height: 1; }
.brand-eduty { font-size: 0.7rem; font-weight: 800; color: #0055ff; letter-spacing: 2px; }
.brand-meets { font-size: 0.65rem; font-weight: 600; color: #444; letter-spacing: 1px; }
.topbar-divider { width: 1px; height: 28px; background: #222; margin: 0 4px; }
.topbar-room-info { display: flex; flex-direction: column; }
.room-label { font-size: 0.6rem; color: #444; text-transform: uppercase; letter-spacing: 1px; }
.room-name { font-size: 0.82rem; color: #ccc; font-weight: 600; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.topbar-center { display: flex; align-items: center; }
.topbar-timer {
    display: flex; align-items: center; gap: 6px;
    background: #111; border: 1px solid #222;
    padding: 6px 14px; border-radius: 20px;
    font-size: 0.9rem; font-weight: 700;
}
.timer-icon { font-size: 0.85rem; }
.timer-warning { border-color: #f59e0b44; color: #f59e0b; }

.topbar-right { display: flex; align-items: center; gap: 12px; }
.topbar-participants {
    display: flex; align-items: center; gap: 6px;
    background: #111; border: 1px solid #222;
    padding: 6px 12px; border-radius: 20px;
    font-size: 0.82rem; color: #888;
}
.btn-end-lesson {
    background: #dc2626; color: white; border: none;
    padding: 8px 16px; border-radius: 8px;
    font-size: 0.82rem; font-weight: 700;
    cursor: pointer; transition: 0.2s;
    white-space: nowrap;
}
.btn-end-lesson:hover { background: #b91c1c; }

/* ── Body ── */
.meets-body {
    flex: 1;
    display: flex;
    overflow: hidden;
    min-height: 0;
}

/* ── Video Alanı ── */
.video-area {
    flex: 1;
    background: #000;
    position: relative;
    min-width: 0;
}
.jitsi-frame {
    width: 100%;
    height: 100%;
}
.jitsi-loading {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    background: #050505; gap: 15px; z-index: 10;
}
.jl-spinner {
    width: 48px; height: 48px;
    border: 4px solid #111;
    border-top: 4px solid #0055ff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}
.jitsi-loading p { color: #888; font-size: 0.95rem; }
.jitsi-loading small { color: #444; font-size: 0.78rem; }

/* ── Sağ Panel ── */
.side-panel {
    width: 300px;
    background: #0d0d0d;
    border-left: 1px solid #1a1a1a;
    display: flex; flex-direction: column;
    flex-shrink: 0;
    position: relative;
    transition: width 0.3s ease;
}
.side-panel.panel-collapsed { width: 0; overflow: hidden; }

.panel-tabs {
    display: flex;
    border-bottom: 1px solid #1a1a1a;
    flex-shrink: 0;
}
.panel-tabs button {
    flex: 1; background: transparent; border: none;
    color: #555; padding: 12px 6px; cursor: pointer;
    font-size: 0.78rem; font-family: inherit;
    display: flex; align-items: center; justify-content: center;
    gap: 4px; transition: 0.2s; position: relative;
    border-bottom: 2px solid transparent;
}
.panel-tabs button:hover { color: #888; }
.panel-tabs button.active { color: #0055ff; border-bottom-color: #0055ff; }
.unread-badge {
    background: #ef4444; color: white;
    font-size: 0.6rem; font-weight: 800;
    width: 16px; height: 16px;
    border-radius: 50%; display: flex;
    align-items: center; justify-content: center;
}

.panel-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

/* Chat */
.chat-panel { padding: 0; }
.chat-messages {
    flex: 1; overflow-y: auto; padding: 15px;
    display: flex; flex-direction: column; gap: 10px;
    scrollbar-width: thin; scrollbar-color: #222 #0d0d0d;
}
.empty-chat { display: flex; flex-direction: column; align-items: center; color: #333; gap: 8px; margin-top: 30px; font-size: 0.85rem; }
.empty-chat span { font-size: 2rem; }
.chat-msg { max-width: 85%; }
.chat-msg.my-msg { align-self: flex-end; }
.msg-sender { font-size: 0.65rem; color: #555; margin-bottom: 3px; }
.chat-msg.my-msg .msg-sender { text-align: right; }
.msg-text {
    background: #1a1a1a; padding: 8px 12px;
    border-radius: 12px; font-size: 0.82rem; color: #ddd; line-height: 1.5;
}
.chat-msg.my-msg .msg-text { background: #0055ff; color: white; }
.msg-time { font-size: 0.6rem; color: #444; margin-top: 3px; }
.chat-msg.my-msg .msg-time { text-align: right; }
.chat-input-row {
    display: flex; gap: 8px; padding: 12px;
    border-top: 1px solid #1a1a1a; flex-shrink: 0;
}
.chat-input {
    flex: 1; background: #111; border: 1px solid #222;
    color: white; padding: 8px 12px; border-radius: 20px;
    font-size: 0.82rem; font-family: inherit;
}
.chat-input:focus { outline: none; border-color: #0055ff; }
.btn-send {
    background: #0055ff; color: white; border: none;
    width: 34px; height: 34px; border-radius: 50%;
    cursor: pointer; font-size: 0.85rem; transition: 0.2s;
    display: flex; align-items: center; justify-content: center;
}
.btn-send:hover { background: #0044cc; }

/* Notlar */
.notes-panel { padding: 12px; gap: 10px; }
.notes-header { display: flex; justify-content: space-between; align-items: center; }
.notes-header span { font-size: 0.78rem; color: #666; }
.btn-save-notes {
    background: #111; border: 1px solid #333; color: #888;
    padding: 5px 12px; border-radius: 6px; cursor: pointer;
    font-size: 0.75rem; transition: 0.2s;
}
.btn-save-notes:hover { border-color: #0055ff; color: #0055ff; }
.btn-save-notes.saved { border-color: #10b981; color: #10b981; }
.notes-textarea {
    flex: 1; background: #111; border: 1px solid #1a1a1a;
    color: #ccc; padding: 12px; border-radius: 8px;
    font-size: 0.82rem; font-family: inherit;
    resize: none; line-height: 1.6;
}
.notes-textarea:focus { outline: none; border-color: #333; }

/* Bilgi */
.info-panel { padding: 15px; gap: 0; overflow-y: auto; }
.info-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #111; }
.info-label { font-size: 0.75rem; color: #555; }
.info-val { font-size: 0.82rem; color: #ccc; font-weight: 600; }
.price-val { color: #a78bfa; }
.free-val { color: #34d399; }
.room-id-box {
    margin-top: 15px; background: #111; border: 1px solid #1a1a1a;
    border-radius: 8px; padding: 10px 12px;
    display: flex; align-items: center; gap: 8px;
}
.room-id-label { font-size: 0.7rem; color: #555; flex-shrink: 0; }
.room-id-val { flex: 1; font-size: 0.75rem; color: #888; word-break: break-all; }
.btn-copy {
    background: transparent; border: none; cursor: pointer;
    font-size: 0.9rem; padding: 2px;
}

/* Panel toggle */
.panel-toggle-btn {
    position: absolute; left: -16px; top: 50%;
    transform: translateY(-50%);
    width: 16px; height: 48px;
    background: #1a1a1a; border: 1px solid #222;
    border-right: none; color: #555;
    cursor: pointer; font-size: 0.65rem;
    display: flex; align-items: center; justify-content: center;
    border-radius: 4px 0 0 4px; transition: 0.2s;
}
.panel-toggle-btn:hover { background: #222; color: white; }

/* ── Alt Kontroller ── */
.meets-controls {
    height: 52px;
    background: #0d0d0d;
    border-top: 1px solid #1a1a1a;
    display: flex; align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    flex-shrink: 0;
}
.controls-left .ctrl-label { font-size: 0.8rem; color: #555; }
.controls-center { display: flex; gap: 10px; align-items: center; }
.ctrl-btn {
    display: flex; flex-direction: column; align-items: center;
    gap: 2px; background: #1a1a1a; border: 1px solid #333;
    color: #888; padding: 6px 16px; border-radius: 8px;
    cursor: pointer; transition: 0.2s; font-family: inherit;
}
.ctrl-btn span { font-size: 1.1rem; }
.ctrl-btn small { font-size: 0.6rem; }
.ctrl-btn:hover { background: #222; color: white; border-color: #555; }
.ctrl-end { border-color: #dc262644; color: #dc2626; }
.ctrl-end:hover { background: #dc2626; color: white; border-color: #dc2626; }

.ctrl-status { font-size: 0.78rem; font-weight: 600; }
.status-live { color: #10b981; }
.status-connecting { color: #f59e0b; }

/* ── Bitiş Modali ── */
.modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.9);
    display: flex; align-items: center; justify-content: center;
    z-index: 9999; backdrop-filter: blur(4px);
}
.end-modal {
    background: #111; border: 1px solid #333;
    border-radius: 20px; padding: 40px;
    text-align: center; max-width: 360px; width: 90%;
}
.end-modal-icon { font-size: 3rem; margin-bottom: 15px; }
.end-modal h3 { color: white; font-size: 1.4rem; margin-bottom: 10px; }
.end-modal p { color: #888; margin-bottom: 25px; }
.end-modal-actions { display: flex; gap: 12px; justify-content: center; }
.btn-stay {
    background: #1a1a1a; color: #888; border: 1px solid #333;
    padding: 12px 24px; border-radius: 10px; cursor: pointer;
    font-weight: 600; transition: 0.2s;
}
.btn-stay:hover { color: white; border-color: #555; }
.btn-confirm-end {
    background: #dc2626; color: white; border: none;
    padding: 12px 24px; border-radius: 10px; cursor: pointer;
    font-weight: 700; transition: 0.2s;
}
.btn-confirm-end:hover { background: #b91c1c; }

/* ── Responsive ── */
@media (max-width: 768px) {
    .side-panel { width: 0; }
    .room-name { max-width: 100px; }
    .topbar-room-info { display: none; }
    .brand-meets { display: none; }
}
</style>