<template>
    <div v-if="isLoading" class="loading-screen">
        <div class="spinner"></div>
        <p>Yetki kontrolü yapılıyor...</p>
    </div>

    <div v-else-if="isTeacher" class="dashboard-container">

        <div v-if="isProfileModalOpen" class="modal-overlay">
            <div class="modal-content">
                <h3>Öğretmen Profili</h3>

                <div class="modal-body">
                    <label>Adınız Soyadınız:</label>
                    <input type="text" v-model="tempProfile.name" placeholder="Örn: Ahmet Hoca" />

                    <label>Branşınız:</label>
                    <select v-model="tempProfile.branch" class="modal-select">
                        <option value="" disabled>Seçiniz</option>
                        <option v-for="b in branches" :key="b" :value="b">{{ b }}</option>
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
                    <div class="teacher-points-badge">
                        <span class="tp-label">TOPLAM PUAN</span>
                        <span class="tp-value">{{ teacherScore }}</span>
                    </div>
                </div>
                <h3 class="user-name">{{ userDisplayName || 'Değerli Öğretmenimiz' }}</h3>
                <p class="user-email">{{ userEmail }}</p>
                <p v-if="userBranch" class="user-branch-info">{{ userBranch }} Öğretmeni</p>
            </div>

            <nav class="sidebar-nav">
                <button @click="activeTab = 'test-upload'" :class="{ active: activeTab === 'test-upload' }">
                    <span class="icon">📤</span> Test Yükle
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
                <div class="welcome-text">
                    <h1>Hoş Geldiniz, {{ userDisplayName }}</h1>
                    <p>Öğrencilerin hayatına dokunmaya devam edin.</p>
                </div>
                <div class="quick-stats">
                    <div class="q-item">
                        <span class="q-val">{{ uploadedTestsCount }}</span>
                        <span class="q-lab">Yüklenen Test</span>
                    </div>
                    <div class="q-item">
                        <span class="q-val">{{ completedLessons }}</span>
                        <span class="q-lab">Verilen Ders</span>
                    </div>
                </div>
            </header>

            <section class="tab-content">

                <div v-if="activeTab === 'test-upload'" class="animate-fade">
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
                                        <option v-for="g in grades" :key="g" :value="g">{{ g === 'Mezun' ? 'Mezun' : g +
                                            '. Sınıf' }}</option>
                                    </select>
                                </div>
                                <div class="form-group half">
                                    <label>Ders</label>
                                    <select v-model="testForm.subject">
                                        <option value="" disabled>Seçiniz</option>
                                        <option v-for="b in branches" :key="b" :value="b">{{ b }}</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>PDF Dosyası Yükle</label>
                                <div class="file-drop-area" @click="$refs.pdfInput.click()">
                                    <span v-if="!testForm.file">📄 PDF Seçmek İçin Tıklayın</span>
                                    <span v-else class="file-selected">✅ {{ testForm.file.name }}</span>
                                    <input type="file" ref="pdfInput" accept="application/pdf" @change="handlePdfUpload"
                                        hidden />
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
                            <p class="info-text">Öğrencilerin doğru/yanlışlarını hesaplamak için doğru şıkları
                                işaretleyiniz.</p>

                            <div class="answers-grid">
                                <div v-for="(q, index) in testForm.answers" :key="index" class="answer-row">
                                    <span class="q-num">{{ index + 1 }}.</span>
                                    <div class="options">
                                        <button v-for="opt in ['A','B','C','D','E']" :key="opt"
                                            @click="setAnswer(index, opt)" :class="{ active: q === opt }">
                                            {{ opt }}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="action-footer">
                        <button class="btn-primary-large" @click="submitTest" :disabled="!isFormValid">Testi Sisteme
                            Yükle</button>
                    </div>
                </div>

                <div v-if="activeTab === 'history'" class="animate-fade">
                    <h2 class="section-title">Geçmiş Derslerim</h2>
                    <div class="history-list">
                        <div v-if="pastLessons.length > 0" class="lesson-items">
                        </div>
                        <div v-else class="empty-state">
                            <span class="icon-empty">📅</span>
                            <p>Henüz tamamlanmış bir dersiniz bulunmuyor.</p>
                        </div>
                    </div>
                </div>

                <div v-if="activeTab === 'messages'" class="animate-fade messages-container">
                    <div class="chat-sidebar">
                        <div class="chat-header">Öğrenciler</div>
                        <div class="chat-list empty-chat-list">
                            <small>Aktif sohbet yok</small>
                        </div>
                    </div>
                    <div class="chat-window">
                        <div class="empty-chat-state">
                            <span class="icon-msg">💬</span>
                            <h3>Mesaj Seçin</h3>
                            <p>Öğrencilerinizle olan iletişiminiz buradan sağlanır.</p>
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
    import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc } from 'firebase/firestore'

    const router = useRouter()
    const { $auth } = useNuxtApp()
    let db;

    // State
    const isLoading = ref(true)
    const isTeacher = ref(false) // Rol kontrolü için
    const activeTab = ref('test-upload')
    const userDisplayName = ref('')
    const userEmail = ref('')
    const userBranch = ref('')
    const teacherScore = ref(0) 
    const uploadedTestsCount = ref(0)
    const completedLessons = ref(0)
    const pastLessons = ref([])

    // Form Verileri (Test Yükleme)
    const testForm = reactive({
        title: '',
        grade: '',
        subject: '',
        questionCount: 0,
        file: null,
        answers: [] 
    })

    // Sabitler
    const branches = ["Matematik", "Fizik", "Kimya", "Biyoloji", "Türkçe", "Edebiyat", "Tarih", "Coğrafya", "Felsefe", "İngilizce", "Almanca"]
    const grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, "Mezun"]

    // Profil Modal
    const isProfileModalOpen = ref(false)
    const fileInput = ref(null)
    const profileState = ref({ avatarType: 'initials', selectedPreset: '', uploadedImage: null })
    const tempProfile = ref({ name: '', branch: '', avatarType: 'initials', selectedPreset: '', uploadedImage: null })
    const presetAvatars = [
        "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
        "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
        "https://api.dicebear.com/7.x/bottts/svg?seed=Bubba"
    ]

    // Computed
    const currentAvatarUrl = computed(() => {
        if (profileState.value.avatarType === 'upload' && profileState.value.uploadedImage) return profileState.value.uploadedImage
        if (profileState.value.avatarType === 'preset' && profileState.value.selectedPreset) return profileState.value.selectedPreset
        return `https://ui-avatars.com/api/?name=${userDisplayName.value || 'T'}&background=0055ff&color=fff`
    })

    const isFormValid = computed(() => {
        return testForm.title && testForm.grade && testForm.subject && testForm.file && testForm.questionCount > 0 && testForm.answers.length === testForm.questionCount && !testForm.answers.includes(undefined)
    })

    // --- TEST YÜKLEME MANTIĞI ---

    const handlePdfUpload = (e) => {
        const file = e.target.files[0];
        if (file && file.type === "application/pdf") {
            testForm.file = file;
        } else {
            alert("Lütfen geçerli bir PDF dosyası seçin.");
        }
    }

    const generateAnswerKeyInputs = () => {
        const count = parseInt(testForm.questionCount);
        if (!count || count < 0) {
            testForm.answers = [];
            return;
        }
        const newAnswers = new Array(count).fill(null);
        for (let i = 0; i < Math.min(count, testForm.answers.length); i++) {
            newAnswers[i] = testForm.answers[i];
        }
        testForm.answers = newAnswers;
    }

    const setAnswer = (index, option) => {
        testForm.answers[index] = option;
    }

    const submitTest = async () => {
        if (!db) db = getFirestore();

        try {
            const fakePdfUrl = "https://example.com/uploads/sample_test.pdf";
            await addDoc(collection(db, "tests"), {
                uploaderId: $auth.currentUser.uid,
                uploaderName: userDisplayName.value,
                title: testForm.title,
                grade: testForm.grade,
                subject: testForm.subject,
                questionCount: testForm.questionCount,
                answerKey: testForm.answers,
                pdfUrl: fakePdfUrl,
                createdAt: new Date().toISOString()
            });

            alert("Test başarıyla yüklendi! Öğrenciler ilgili ders sekmesinde görebilecek.");

            testForm.title = '';
            testForm.questionCount = 0;
            testForm.file = null;
            testForm.answers = [];
            uploadedTestsCount.value++;

        } catch (error) {
            console.error("Test yükleme hatası:", error);
            alert("Bir hata oluştu: " + error.message);
        }
    }

    // --- PROFİL & AUTH ---

    const openProfileModal = () => {
        tempProfile.value = {
            name: userDisplayName.value,
            branch: userBranch.value,
            avatarType: profileState.value.avatarType,
            selectedPreset: profileState.value.selectedPreset,
            uploadedImage: profileState.value.uploadedImage
        }
        isProfileModalOpen.value = true
    }

    const saveProfile = async () => {
        if (!db) db = getFirestore();
        userDisplayName.value = tempProfile.value.name
        userBranch.value = tempProfile.value.branch
        profileState.value = {
            avatarType: tempProfile.value.avatarType,
            selectedPreset: tempProfile.value.selectedPreset,
            uploadedImage: tempProfile.value.uploadedImage
        }

        if ($auth.currentUser) {
            await updateProfile($auth.currentUser, { displayName: tempProfile.value.name });
            const userRef = doc(db, "users", $auth.currentUser.uid);
            await updateDoc(userRef, {
                displayName: tempProfile.value.name,
                branch: tempProfile.value.branch,
                avatar: profileState.value
            });
        }
        isProfileModalOpen.value = false
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

    const handleLogout = async () => {
        // Çıkış yaparken localStorage'daki rol bilgisini de temizleyelim (Opsiyonel ama iyi pratik)
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

                // Kullanıcının rolünü Firestore'dan çek ve kontrol et
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    
                    // ROL KONTROLÜ
                    if (data.role !== 'teacher') {
                        // Eğer öğretmen değilse, kendi paneline yönlendir
                        if (data.role === 'student') {
                            router.push('/dashboard');
                        } else {
                            router.push('/');
                        }
                        return; // Kodun devamını çalıştırma
                    }

                    // Rol doğruysa devam et
                    isTeacher.value = true;
                    // Rol bilgisini localStorage'a kaydet (Header için kullanılacak)
                    localStorage.setItem('userRole', 'teacher');
                    
                    userBranch.value = data.branch || '';
                    teacherScore.value = data.score || 0;
                    if (data.avatar) profileState.value = data.avatar;
                }
            } else {
                router.push('/kayit-giris')
            }
            isLoading.value = false
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
        overflow-y: auto;
        z-index: 90;
    }

    .main-content {
        margin-left: 280px;
        flex-grow: 1;
        padding: 40px;
        width: calc(100% - 280px);
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
    }

    /* PUAN ROZETİ */
    .teacher-points-badge {
        position: absolute;
        bottom: -10px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(45deg, #0055ff, #0033aa);
        padding: 4px 12px;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 80px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 4px 10px rgba(0, 85, 255, 0.3);
    }

    .tp-label {
        font-size: 0.6rem;
        color: rgba(255, 255, 255, 0.8);
        letter-spacing: 0.5px;
    }

    .tp-value {
        font-size: 1rem;
        font-weight: 800;
        color: white;
    }

    .user-name {
        font-size: 1.2rem;
        margin-bottom: 5px;
        color: #fff;
    }

    .user-email {
        font-size: 0.85rem;
        color: #666;
    }

    .user-branch-info {
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
    }

    .welcome-text h1 {
        font-size: 1.8rem;
        margin: 0 0 5px 0;
    }

    .welcome-text p {
        color: #888;
        margin: 0;
    }

    .quick-stats {
        display: flex;
        gap: 20px;
    }

    .q-item {
        text-align: center;
        background: #000;
        padding: 10px 20px;
        border-radius: 8px;
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

    /* TEST YÜKLEME ALANI */
    .section-title {
        font-size: 1.8rem;
        margin-bottom: 30px;
        font-family: 'serif';
    }

    .upload-container {
        display: flex;
        gap: 30px;
        align-items: flex-start;
    }

    .upload-form {
        flex: 1;
    }

    .answer-key-panel {
        width: 300px;
        background: #161616;
        padding: 20px;
        border-radius: 12px;
        border: 1px solid #333;
        max-height: 600px;
        overflow-y: auto;
    }

    .form-group {
        margin-bottom: 20px;
    }

    .form-row {
        display: flex;
        gap: 20px;
    }

    .half {
        flex: 1;
    }

    label {
        display: block;
        margin-bottom: 8px;
        color: #ccc;
        font-size: 0.9rem;
    }

    input[type="text"],
    input[type="number"],
    select {
        width: 100%;
        padding: 12px;
        background: #0a0a0a;
        border: 1px solid #333;
        color: white;
        border-radius: 8px;
        font-size: 1rem;
    }

    input:focus,
    select:focus {
        border-color: #0055ff;
        outline: none;
    }

    .file-drop-area {
        border: 2px dashed #333;
        padding: 30px;
        text-align: center;
        border-radius: 8px;
        cursor: pointer;
        transition: 0.3s;
        color: #888;
    }

    .file-drop-area:hover {
        border-color: #0055ff;
        color: white;
        background: rgba(0, 85, 255, 0.05);
    }

    .file-selected {
        color: #00ff88;
        font-weight: bold;
    }

    /* CEVAP ANAHTARI */
    .answer-key-panel h3 {
        margin-top: 0;
        font-size: 1.2rem;
    }

    .info-text {
        font-size: 0.8rem;
        color: #666;
        margin-bottom: 15px;
    }

    .answers-grid {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .answer-row {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .q-num {
        width: 30px;
        font-size: 0.9rem;
        color: #888;
        text-align: right;
    }

    .options {
        display: flex;
        gap: 5px;
    }

    .options button {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 1px solid #333;
        background: #0a0a0a;
        color: #888;
        cursor: pointer;
        font-size: 0.8rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .options button:hover {
        border-color: #666;
    }

    .options button.active {
        background: #0055ff;
        color: white;
        border-color: #0055ff;
    }

    .action-footer {
        margin-top: 30px;
        text-align: right;
    }

    .btn-primary-large {
        background: #0055ff;
        color: white;
        border: none;
        padding: 15px 40px;
        border-radius: 8px;
        font-weight: bold;
        font-size: 1.1rem;
        cursor: pointer;
    }

    .btn-primary-large:disabled {
        background: #333;
        color: #666;
        cursor: not-allowed;
    }

    /* DİĞER TABLAR (BOŞ) */
    .empty-state {
        text-align: center;
        padding: 80px;
        color: #555;
        border: 2px dashed #222;
        border-radius: 12px;
    }

    .icon-empty {
        font-size: 3rem;
        display: block;
        margin-bottom: 15px;
    }

    /* MESAJLAR */
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
    }

    .chat-window {
        flex-grow: 1;
        display: flex;
        justify-content: center;
        align-items: center;
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

    .modal-body input,
    .modal-body select {
        margin-bottom: 15px;
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
        background: #222;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    .avatar-option img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .avatar-option.selected {
        border-color: #0055ff;
        background: rgba(0, 85, 255, 0.1);
    }

    .modal-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
    }

    .btn-save {
        background: #0055ff;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
    }

    .btn-cancel {
        background: transparent;
        color: #888;
        border: none;
        padding: 10px 20px;
        cursor: pointer;
    }

    @media (max-width: 1024px) {
        .upload-container {
            flex-direction: column;
        }

        .answer-key-panel {
            width: 100%;
            max-height: 300px;
        }

        .sidebar {
            width: 80px;
        }

        .main-content {
            margin-left: 80px;
            width: calc(100% - 80px);
        }

        .user-name,
        .user-email,
        .user-branch-info,
        .sidebar-nav button span:not(.icon),
        .teacher-points-badge {
            display: none;
        }
    }
</style>