<template>
    <div v-if="isLoading" class="loading-screen">
        <div class="spinner"></div>
        <p>Veriler yükleniyor...</p>
    </div>

    <div v-else-if="isStudent" class="dashboard-container">

        <button class="mobile-toggle-btn" @click="isSidebarOpen = !isSidebarOpen">
            ☰
        </button>

        <div v-if="isSidebarOpen" class="sidebar-overlay" @click="isSidebarOpen = false"></div>

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
                    <p>Öğretmen: <span class="highlight-text">{{ selectedTeacherForBooking?.displayName || selectedTeacherForBooking?.email }}</span></p>
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

            <!-- ===== GÜVENLİK: SEKME DEĞİŞİM UYARISI ===== -->
            <div v-if="tabWarningActive" class="tab-warning-overlay">
                <div class="tab-warning-box">
                    <div class="tab-warning-icon">⚠️</div>
                    <h2>Sekme Dışına Çıktın!</h2>
                    <p>Testin geçerli sayılabilmesi için bu sekmede kalman gerekiyor.</p>
                    <div class="countdown-ring">
                        <svg viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="50" class="ring-bg" />
                            <circle cx="60" cy="60" r="50" class="ring-progress"
                                :style="{ strokeDashoffset: ringOffset }" />
                        </svg>
                        <span class="countdown-number">{{ tabTimeLeft }}</span>
                    </div>
                    <p class="tab-warning-sub">Geri dön, test devam edecek.</p>
                    <p v-if="tabTimeLeft <= 3" class="tab-warning-danger">⛔ Test otomatik sonlandırılacak!</p>
                </div>
            </div>

            <!-- ===== GÜVENLİK: KAMERA İZİN EKRANI ===== -->
            <div v-if="cameraPermissionState === 'asking'" class="camera-permission-overlay">
                <div class="camera-permission-box">
                    <div class="cam-icon">📷</div>
                    <h2>Kamera Erişimi Gerekiyor</h2>
                    <p>Eduty, testin adil biçimde tamamlandığını doğrulamak için kameranı kullanır. Görüntüler
                        kaydedilmez; yalnızca anlık AI analizi yapılır.</p>
                    <ul class="cam-list">
                        <li>✅ Görüntü sunucuya gönderilmez</li>
                        <li>✅ Yalnızca yerel AI analizi</li>
                        <li>✅ Test süresince aktif kalır</li>
                    </ul>
                    <div class="cam-actions">
                        <button class="btn-cam-allow" @click="requestCameraAccess">Kameraya İzin Ver</button>
                        <button class="btn-cam-deny" @click="denyCameraAccess">İzin Vermeden Devam Et</button>
                    </div>
                    <p class="cam-note">Not: Kamera izni verilmezse testten puan kazanamazsın.</p>
                </div>
            </div>

            <!-- ===== GÜVENLİK: AI TARAMA UYARISI ===== -->
            <div v-if="aiSuspicionWarning" class="ai-suspicion-overlay">
                <div class="ai-suspicion-box">
                    <div class="ai-icon">🤖</div>
                    <h2>Şüpheli Aktivite Algılandı</h2>
                    <p>Kamera analizimiz ekranında <strong>yapay zeka aracı kullanıldığını</strong> tespit etti. Bu
                        testten puan kazanman engellenebilir.</p>
                    <button class="btn-ai-ok" @click="aiSuspicionWarning = false">Anladım, Devam Et</button>
                </div>
            </div>

            <div class="test-runner-header">
                <div class="tr-info">
                    <h3>{{ currentTest?.title }}</h3>
                    <span class="tr-badge">{{ currentTest?.subject }}</span>
                </div>
                <!-- Güvenlik Göstergeleri -->
                <div class="security-indicators">
                    <div class="sec-badge" :class="cameraSecClass" :title="cameraSecTitle">
                        <span>{{ cameraSecIcon }}</span>
                        <small>{{ cameraSecLabel }}</small>
                    </div>
                    <div class="sec-badge" :class="tabSecClass">
                        <span>🔒</span>
                        <small>{{ tabTimeLeft }}sn</small>
                    </div>
                </div>
                <div class="tr-tools">
                    <button @click="setTool('pen')" :class="{ active: drawingTool === 'pen' }" title="Kalem">✏️</button>
                    <button @click="setTool('eraser')" :class="{ active: drawingTool === 'eraser' }"
                        title="Silgi">🧹</button>
                    <button @click="clearCanvas" title="Temizle">🗑️</button>
                    <button class="btn-close-test" @click="confirmExitTest">Çıkış Yap</button>
                </div>
            </div>

            <!-- Kamera önizleme (küçük, köşede) -->
            <div v-if="cameraPermissionState === 'granted'" class="camera-preview-corner">
                <video ref="cameraVideo" autoplay muted playsinline class="cam-video"></video>
                <canvas ref="cameraCanvas" style="display:none"></canvas>
                <div class="cam-live-badge">🔴 CANLI</div>
            </div>

            <div class="test-runner-body">
                <div class="pdf-container" ref="pdfContainer">
                    <iframe :src="currentTest?.pdfUrl || '/sample.pdf'" class="pdf-frame"></iframe>
                    <canvas ref="drawCanvas" class="drawing-canvas" @mousedown="startDrawing" @mousemove="draw"
                        @mouseup="stopDrawing" @mouseleave="stopDrawing"></canvas>
                </div>
                <div class="optical-form">

                    <!-- ÇÖZÜM SIRASINDA -->
                    <template v-if="!isShowingResult">
                        <h4>Cevap Formu</h4>
                        <div class="questions-list">
                            <div v-for="n in parseInt(currentTest?.questionCount || 0)" :key="n" class="opt-row">
                                <span class="q-no">{{ n }}.</span>
                                <div class="opt-options">
                                    <button v-for="opt in ['A', 'B', 'C', 'D', 'E']" :key="opt"
                                        :class="{ 'opt-selected': userAnswers[n - 1] === opt }"
                                        @click="userAnswers[n - 1] = opt">
                                        {{ opt }}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button class="btn-finish-test" @click="finishTest">TESTİ BİTİR</button>
                    </template>

                    <!-- SONUÇ EKRANI -->
                    <template v-else>
                        <div class="result-header">
                            <h4>Test Sonucu</h4>
                            <div class="result-score-row">
                                <div class="rs-item">
                                    <span class="rs-val" :class="testResult.successPercent >= 70 ? 'rs-good' : testResult.successPercent >= 40 ? 'rs-mid' : 'rs-bad'">
                                        %{{ testResult.successPercent }}
                                    </span>
                                    <span class="rs-lab">Başarı</span>
                                </div>
                                <div class="rs-item">
                                    <span class="rs-val rs-good">{{ testResult.correctCount }}</span>
                                    <span class="rs-lab">Doğru</span>
                                </div>
                                <div class="rs-item">
                                    <span class="rs-val rs-bad">{{ testResult.wrongCount }}</span>
                                    <span class="rs-lab">Yanlış</span>
                                </div>
                                <div class="rs-item">
                                    <span class="rs-val rs-empty">{{ testResult.emptyCount }}</span>
                                    <span class="rs-lab">Boş</span>
                                </div>
                            </div>
                            <div class="result-points" v-if="!currentTest?.practiceOnly">
                                <span v-if="testResult.alreadyCompleted" class="no-pts">⚠️ Bu testi daha önce çözdün — tekrar puan verilmez</span>
                                <span v-else-if="testResult.finalPoints > 0">+{{ testResult.finalPoints }} puan kazandın 🎉</span>
                                <span v-else class="no-pts">⚠️ Kamera izni olmadığı için puan yok</span>
                            </div>
                            <div class="result-points practice-note" v-else>
                                📝 Pratik mod — puan kazanılmadı
                            </div>
                        </div>

                        <div class="questions-list result-list">
                            <div v-for="(row, idx) in testResult.questionReview" :key="idx"
                                class="opt-row result-row"
                                :class="'row-' + row.status">
                                <span class="q-no">{{ row.no }}.</span>
                                <div class="opt-options">
                                    <button v-for="opt in ['A', 'B', 'C', 'D', 'E']" :key="opt"
                                        :class="getResultClass(row, opt)"
                                        disabled>
                                        {{ opt }}
                                    </button>
                                </div>
                                <span class="row-icon">
                                    {{ row.status === 'correct' ? '✓' : row.status === 'wrong' ? '✗' : '–' }}
                                </span>
                            </div>
                        </div>

                        <div class="result-legend">
                            <span class="leg-item"><span class="leg-dot correct"></span>Doğru</span>
                            <span class="leg-item"><span class="leg-dot wrong"></span>Yanlış / Cevabın</span>
                            <span class="leg-item"><span class="leg-dot correct-answer"></span>Doğru Cevap</span>
                            <span class="leg-item"><span class="leg-dot empty"></span>Boş/Doğru</span>
                        </div>

                        <button class="btn-close-result" @click="closeTestResult">Testi Kapat</button>
                    </template>

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
                    <div class="rank-badge" :class="studentRank.class">{{ studentRank.title }}</div>
                </div>
                <h3 class="user-name">{{ userDisplayName || 'Öğrenci' }}</h3>
                <p class="user-email">{{ userEmail }}</p>
                <p v-if="userGrade" class="user-grade-info">{{ userGrade === 'Mezun' || userGrade === 13 ? 'Mezun' : userGrade + '. Sınıf' }}</p>
            </div>

            <nav class="sidebar-nav">
                <button @click="{ activeTab = 'stats'; isSidebarOpen = false }"
                    :class="{ active: activeTab === 'stats' }">
                    <span class="icon">📊</span> İstatistiklerim
                </button>
                <button @click="{ activeTab = 'test-solve'; isSidebarOpen = false }"
                    :class="{ active: activeTab === 'test-solve' }">
                    <span class="icon">📝</span> Test Çöz
                </button>
                <button @click="{ activeTab = 'calendar'; isSidebarOpen = false }"
                    :class="{ active: activeTab === 'calendar' }">
                    <span class="icon">📅</span> Takvimim
                </button>
                <button @click="{ activeTab = 'find-teacher'; isSidebarOpen = false }"
                    :class="{ active: activeTab === 'find-teacher' }">
                    <span class="icon">🔍</span> Öğretmen Ara
                </button>
                <button @click="{ activeTab = 'favorites'; isSidebarOpen = false }"
                    :class="{ active: activeTab === 'favorites' }">
                    <span class="icon">⭐</span> Favori Öğretmenlerim
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
                    <div class="score-value">
                        {{ studentScore }} <span>/ 5.000 Puan</span>
                    </div>
                    <div class="score-progress-bar">
                        <div class="score-progress-fill" :style="{ width: Math.min((studentScore / 5000) * 100, 100) + '%' }"></div>
                    </div>
                    <div class="score-stats-row">
                        <div class="score-stat-item">
                            <span class="ssi-val">{{ completedLessons }}</span>
                            <span class="ssi-lab">Bitirilen Test</span>
                        </div>
                        <div class="score-stat-divider"></div>
                        <div class="score-stat-item">
                            <span class="ssi-val">
                                {{ dailyTestCount }}<span class="ssi-max">/3</span>
                            </span>
                            <span class="ssi-lab">Bugünkü Test</span>
                        </div>
                        <div class="score-stat-divider"></div>
                        <div class="score-stat-item">
                            <span class="ssi-val daily-pts-val">{{ dailyTestPoints }}<span class="ssi-max">/150</span></span>
                            <span class="ssi-lab">Günlük Puan</span>
                        </div>
                    </div>
                </div>
                <div class="rank-display">
                    <div class="rank-badge-large" :class="studentRank.class">{{ studentRank.title }}</div>
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
                            <div v-for="blank in firstDayOffset" :key="'blank-' + blank" class="calendar-day empty">
                            </div>
                            <div v-for="date in daysInMonth" :key="date" class="calendar-day">
                                <span class="day-number" :class="{ 'today': isToday(date) }">{{ date }}</span>
                                <div class="day-events">
                                    <div v-for="booking in getBookingsForDate(date)" :key="booking.id"
                                        class="event-pill" :class="{ 'pill-cancelled': booking.status?.includes('cancelled') }">
                                        <span class="pill-text">{{ booking.time }} {{ booking.teacherName }}</span>
                                        <template v-if="!booking.status?.includes('cancelled')">
                                            <button class="pill-enter-btn"
                                                @click.stop="enterLessonStudent(booking)"
                                                title="Derse Gir">🎥</button>
                                            <button class="pill-cancel-btn"
                                                @click.stop="cancelBookingByStudent(booking)"
                                                title="Dersi İptal Et">✕</button>
                                        </template>
                                        <span v-else class="pill-cancelled-label">İptal</span>
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
                            <button class="btn-heart"
                                :class="{ active: isFavorite(teacher.id) }"
                                @click.stop="toggleFavorite(teacher)"
                                :title="isFavorite(teacher.id) ? 'Favorilerden Çıkar' : 'Favorilere Ekle'">
                                {{ isFavorite(teacher.id) ? '❤️' : '🤍' }}
                            </button>
                            <div class="teacher-img">
                                <img :src="teacher.avatar?.uploadedImage || teacher.avatar?.selectedPreset || 'https://ui-avatars.com/api/?name=' + (teacher.displayName || 'T')"
                                    style="width:100%; height:100%; border-radius:50%; object-fit:cover;" />
                            </div>
                            <div class="teacher-info">
                                <h3>{{ teacher.displayName || teacher.email || 'İsimsiz Öğretmen' }}</h3>
                                <span class="badge">{{ teacher.branch || 'Branş Belirtilmedi' }}</span>
                                <p v-if="teacher.bio" class="t-bio">{{ teacher.bio }}</p>
                                <div class="teacher-meta-row">
                                    <span class="t-time">🕒 {{ hasAvailability(teacher) ? 'Müsait' : 'Müsait Değil' }}</span>
                                    <span v-if="teacher.lessonPrice > 0" class="t-price">💎 {{ teacher.lessonPrice }} puan/ders</span>
                                    <span v-else class="t-price-free">🎁 Ücretsiz</span>
                                </div>
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
                            <button class="btn-heart active" @click.stop="toggleFavorite(teacher)" title="Favorilerden Çıkar">❤️</button>
                            <div class="teacher-img">
                                <img :src="teacher.avatar?.uploadedImage || teacher.avatar?.selectedPreset || 'https://ui-avatars.com/api/?name=' + (teacher.displayName || 'T')"
                                    style="width:100%; height:100%; border-radius:50%; object-fit:cover;" />
                            </div>
                            <div class="teacher-info">
                                <h3>{{ teacher.displayName || teacher.email }}</h3>
                                <span class="badge">{{ teacher.branch }}</span>
                                <span v-if="!teacher.isPublished" class="badge-offline">🔒 Yayında Değil</span>
                                <div class="teacher-meta-row">
                                    <span v-if="teacher.lessonPrice > 0" class="t-price">💎 {{ teacher.lessonPrice }} puan/ders</span>
                                    <span v-else class="t-price-free">🎁 Ücretsiz</span>
                                </div>
                                <button class="btn-request" :class="{ 'btn-request-disabled': !teacher.isPublished }" @click="openBookingModal(teacher)">
                                    {{ teacher.isPublished ? 'Ders Talep Et' : '🔒 Yayında Değil' }}
                                </button>
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
const isSidebarOpen = ref(false) // Mobil menü durumu
const activeTab = ref('stats')
const userDisplayName = ref('')
const userEmail = ref('')
const userGrade = ref(null)
const studentScore = ref(0)
const completedLessons = ref(0)
const completedTestCount = ref(0)
const successRate = computed(() => {
    const tests = Object.values(completedTestIds.value)
    if (tests.length === 0) return 0
    const total = tests.reduce((acc, t) => acc + (t.successPercent || 0), 0)
    return Math.round(total / tests.length)
})

const availableTests = ref([])
const realTeachers = ref([])
const myFavorites = ref([])
const filters = ref({ subject: '', time: '' })
const myBookings = ref([])

// Test Grouping State
const selectedTestSubject = ref(null)

// Booking State
const isBookingModalOpen = ref(false)
const selectedTeacherForBooking = ref(null)
const bookingSlot = ref(null)
const availableSlots = ref([])

// Test Runner State
const isTakingTest = ref(false)
const currentTest = ref(null)
const userAnswers = ref([])
const drawingTool = ref('pen')
const drawCanvas = ref(null)
const isDrawing = ref(false)
let ctx = null

// Çözülmüş testler — { testId: { done:1, successPercent, earnedPoints } }
const completedTestIds = ref({})

// Günlük test sayaçları
const dailyTestCount = ref(0)
const dailyTestPoints = ref(0)

// Test sonuç state
const testResult = ref(null)     // null | { successPercent, earnedPoints, finalPoints, ... }
const isShowingResult = ref(false)
// testResult.questionReview: [ { no, userAnswer, correctAnswer, status: 'correct'|'wrong'|'empty' } ]

// ===== GÜVENLİK SİSTEMİ STATE =====
// Sekme değişim koruması
const TAB_TIME_LIMIT = 10  // toplam izin verilen dışarıda kalma süresi (saniye)
const tabTimeLeft = ref(TAB_TIME_LIMIT)
const tabWarningActive = ref(false)
const testDisqualified = ref(false)
let tabCountdownInterval = null
let tabOutStart = null

// Kamera / AI tarama
const cameraPermissionState = ref('idle') // 'idle' | 'asking' | 'granted' | 'denied'
const cameraVideo = ref(null)
const cameraCanvas = ref(null)
const aiSuspicionWarning = ref(false)
const aiSuspicionCount = ref(0)
let cameraStream = null
let aiScanInterval = null

// Computed güvenlik göstergeleri
const ringCircumference = 2 * Math.PI * 50  // r=50
const ringOffset = computed(() => {
    const fraction = tabTimeLeft.value / TAB_TIME_LIMIT
    return ringCircumference * (1 - fraction)
})
const cameraSecClass = computed(() => {
    if (cameraPermissionState.value === 'granted') return 'sec-ok'
    if (cameraPermissionState.value === 'denied') return 'sec-warn'
    return 'sec-idle'
})
const cameraSecIcon = computed(() => {
    if (cameraPermissionState.value === 'granted') return '📷'
    if (cameraPermissionState.value === 'denied') return '🚫'
    return '📷'
})
const cameraSecTitle = computed(() => {
    if (cameraPermissionState.value === 'granted') return 'Kamera aktif - AI tarama çalışıyor'
    if (cameraPermissionState.value === 'denied') return 'Kamera izni verilmedi - puan kazanılamaz'
    return 'Kamera bekleniyor'
})
const cameraSecLabel = computed(() => {
    if (cameraPermissionState.value === 'granted') return 'Aktif'
    if (cameraPermissionState.value === 'denied') return 'Kapalı'
    return '...'
})
const tabSecClass = computed(() => {
    if (tabTimeLeft.value > 5) return 'sec-ok'
    if (tabTimeLeft.value > 2) return 'sec-warn'
    return 'sec-danger'
})

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

const fetchTests = async () => {
    if (!db) db = getFirestore()
    try {
        const snap = await getDocs(collection(db, 'tests'))
        availableTests.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        console.log('[fetchTests] Yüklenen test sayısı:', availableTests.value.length)
    } catch(e) {
        console.error('[fetchTests] HATA:', e.code, e.message)
        // permission-denied ise Firebase Rules'ta tests koleksiyonu için okuma izni yok
    }
}
const fetchTeachers = async () => { if (!db) db = getFirestore(); try { const q = query(collection(db, "users"), where("role", "==", "teacher")); const snapshot = await getDocs(q); realTeachers.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(t => !t.displayName || !t.displayName.toLowerCase().includes('piç')); } catch (e) { console.error(e) } }
const filteredTeachers = computed(() => { return realTeachers.value.filter(t => { if (t.isPublished !== true) return false; const matchSubject = filters.value.subject === '' || t.branch === filters.value.subject; return matchSubject }) })
const hasAvailability = (teacher) => { return teacher.availability && Object.keys(teacher.availability).length > 0; }
const openBookingModal = (teacher) => {
    if (teacher.isPublished !== true) {
        alert('⚠️ Bu öğretmen şu an yayında değil. Ders talebi gönderilemez.')
        return
    }
    selectedTeacherForBooking.value = teacher
    bookingSlot.value = null
    const slots = []
    if (teacher.availability) {
        Object.keys(teacher.availability).forEach(key => {
            const [day, time] = key.split('-')
            slots.push({ id: key, day, time })
        })
    }
    availableSlots.value = slots
    isBookingModalOpen.value = true
}

const bookLessonById = (teacherId) => {
    const teacher = findTeacherById(teacherId)
    if (!teacher) return
    if (teacher.isPublished !== true) {
        alert('⚠️ Bu öğretmen şu an yayında değil. Ders talebi gönderilemez.')
        return
    }
    openBookingModal(teacher)
}
const confirmBooking = async () => {
    if (!db) db = getFirestore()
    if (!selectedTeacherForBooking.value || !bookingSlot.value) return
    try {
        // Seçilen gün adını bugünden itibaren en yakın tarihe çevir
        const dayMap = { "Pzt": 1, "Sal": 2, "Çar": 3, "Per": 4, "Cum": 5, "Cmt": 6, "Paz": 0 }
        const targetDay = dayMap[bookingSlot.value.day]
        const today = new Date()
        const todayDay = today.getDay()
        let diff = targetDay - todayDay
        if (diff < 0) diff += 7
        if (diff === 0) diff = 7 // Bu haftanın aynı günü geçtiyse gelecek haftaya al
        const bookingDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + diff)
        const bookingDateISO = bookingDate.toISOString().slice(0, 10)

        await addDoc(collection(db, "bookings"), {
            teacherId: selectedTeacherForBooking.value.id,
            teacherName: selectedTeacherForBooking.value.displayName || selectedTeacherForBooking.value.email,
            studentId: $auth.currentUser.uid,
            studentName: userDisplayName.value,
            day: bookingSlot.value.day,
            time: bookingSlot.value.time,
            bookingDate: bookingDateISO,
            createdAt: serverTimestamp(),
            status: 'confirmed'
        })
        const teacherRef = doc(db, "users", selectedTeacherForBooking.value.id)
        const slotKey = `${bookingSlot.value.day}-${bookingSlot.value.time}`
        await updateDoc(teacherRef, { [`availability.${slotKey}`]: deleteField() })
        alert(`Randevu oluşturuldu: ${bookingSlot.value.day} ${bookingDateISO} ${bookingSlot.value.time}`)
        isBookingModalOpen.value = false
        fetchBookings()
        fetchTeachers()
    } catch (error) {
        console.error(error)
        alert("Hata oluştu.")
    }
}
const fetchBookings = async () => { if (!db) db = getFirestore(); const q = query(collection(db, "bookings"), where("studentId", "==", $auth.currentUser.uid)); const snap = await getDocs(q); myBookings.value = snap.docs.map(d => ({ id: d.id, ...d.data() })); }
const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]; const currentMonthName = computed(() => monthNames[currentMonth.value]); const daysInMonth = computed(() => new Date(currentYear.value, currentMonth.value + 1, 0).getDate()); const firstDayOffset = computed(() => { let d = new Date(currentYear.value, currentMonth.value, 1).getDay(); return d === 0 ? 6 : d - 1 }); const changeMonth = (delta) => { currentMonth.value += delta; if (currentMonth.value > 11) { currentMonth.value = 0; currentYear.value++ } if (currentMonth.value < 0) { currentMonth.value = 11; currentYear.value-- } }; const isToday = (date) => { const today = new Date(); return date === today.getDate() && currentMonth.value === today.getMonth() && currentYear.value === today.getFullYear() }; const getBookingsForDate = (date) => {
    const d = new Date(currentYear.value, currentMonth.value, date)
    const dayIndex = d.getDay()
    const dayMap = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"]
    const dayName = dayMap[dayIndex]
    // Tarihe göre filtrele: bookingDate alanı varsa onu kullan, yoksa sadece aynı haftanın içindeyse göster
    return myBookings.value.filter(b => {
        if (b.status?.includes('cancelled')) return b.day === dayName && isBookingInThisWeek(b, d)
        // bookingDate (ISO string) varsa tam tarihe göre eşleştir
        if (b.bookingDate) {
            const bookDate = new Date(b.bookingDate)
            return bookDate.getFullYear() === d.getFullYear() &&
                   bookDate.getMonth() === d.getMonth() &&
                   bookDate.getDate() === d.getDate()
        }
        // Eski kayıtlar için: sadece gün adı + ilk oluşturulma haftasıyla eşleştir
        if (b.day !== dayName) return false
        if (!b.createdAt) return true
        const created = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt.seconds ? b.createdAt.seconds * 1000 : b.createdAt)
        // createdAt'ın haftasını hesapla
        const createdDay = new Date(created.getFullYear(), created.getMonth(), created.getDate())
        const targetDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
        // Aynı haftanın başından 7 gün içindeyse göster (o haftanın Pzt'si baz alınır)
        const getMonday = (dt) => { const day = dt.getDay(); const diff = (day === 0 ? -6 : 1 - day); return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + diff) }
        const createdMonday = getMonday(createdDay)
        const targetMonday = getMonday(targetDay)
        return createdMonday.getTime() === targetMonday.getTime()
    })
}

const isBookingInThisWeek = (booking, date) => {
    if (!booking.createdAt) return true
    const created = booking.createdAt.toDate ? booking.createdAt.toDate() : new Date(booking.createdAt.seconds ? booking.createdAt.seconds * 1000 : booking.createdAt)
    const getMonday = (dt) => { const day = dt.getDay(); const diff = (day === 0 ? -6 : 1 - day); return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + diff) }
    return getMonday(created).getTime() === getMonday(date).getTime()
}
const startChat = async (teacher) => { if (!db) db = getFirestore(); const myUid = $auth.currentUser.uid; const teacherUid = teacher.id; const q = query(collection(db, "chats"), where("participants", "array-contains", myUid)); const snap = await getDocs(q); let existingChat = snap.docs.find(doc => { const data = doc.data(); return data.participants.includes(teacherUid); }); if (existingChat) { activeTab.value = 'messages'; const chatData = existingChat.data(); selectChat({ id: existingChat.id, ...chatData, otherUserName: teacher.displayName || teacher.email, otherUserId: teacherUid }); } else { const newChatRef = await addDoc(collection(db, "chats"), { participants: [myUid, teacherUid], studentId: myUid, teacherId: teacherUid, studentName: userDisplayName.value, teacherName: teacher.displayName || teacher.email, createdAt: serverTimestamp(), lastMessage: '', typing: {} }); activeTab.value = 'messages'; selectChat({ id: newChatRef.id, participants: [myUid, teacherUid], otherUserName: teacher.displayName || teacher.email, otherUserId: teacherUid }); } }
const fetchChats = () => { if (!db) db = getFirestore(); const q = query(collection(db, "chats"), where("participants", "array-contains", $auth.currentUser.uid)); onSnapshot(q, (snapshot) => { myChats.value = snapshot.docs.map(doc => { const data = doc.data(); const otherId = data.participants.find(p => p !== $auth.currentUser.uid); const otherName = otherId === data.teacherId ? data.teacherName : data.studentName; return { id: doc.id, ...data, otherUserName: otherName, otherUserId: otherId }; }); if (activeChat.value) { const updated = myChats.value.find(c => c.id === activeChat.value.id); if (updated) activeChat.value = { ...activeChat.value, ...updated }; } }); };
const selectChat = (chat) => { activeChat.value = chat; loadMessages(chat.id); markAsRead(chat.id); }; const loadMessages = (chatId) => { if (!db) db = getFirestore(); const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc")); onSnapshot(q, (snapshot) => { activeMessages.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); setTimeout(() => { const container = document.querySelector('.messages-area'); if (container) container.scrollTop = container.scrollHeight; }, 100); }); }; const sendMessage = async () => { if (!newMessage.value.trim() || !activeChat.value) return; const text = newMessage.value; newMessage.value = ''; const chatRef = doc(db, "chats", activeChat.value.id); await addDoc(collection(chatRef, "messages"), { text, senderId: $auth.currentUser.uid, createdAt: serverTimestamp() }); await updateDoc(chatRef, { lastMessage: text, updatedAt: serverTimestamp() }); if (typingTimeout) clearTimeout(typingTimeout); await updateDoc(chatRef, { [`typing.${$auth.currentUser.uid}`]: false }); }; const handleTyping = async () => { if (!activeChat.value) return; const chatRef = doc(db, "chats", activeChat.value.id); await updateDoc(chatRef, { [`typing.${$auth.currentUser.uid}`]: true }); if (typingTimeout) clearTimeout(typingTimeout); typingTimeout = setTimeout(async () => { await updateDoc(chatRef, { [`typing.${$auth.currentUser.uid}`]: false }); }, 2000); }; const markAsRead = async (chatId) => { if (!chatId) return; const chatRef = doc(db, "chats", chatId); await updateDoc(chatRef, { [`lastRead.${$auth.currentUser.uid}`]: serverTimestamp() }); }; const isMessageRead = (msg) => { if (!activeChat.value || !activeChat.value.lastRead || !msg.createdAt) return false; const otherUserId = activeChat.value.otherUserId; const readTime = activeChat.value.lastRead[otherUserId]; if (!readTime) return false; return readTime.seconds >= msg.createdAt.seconds; };
const selectSubject = (subject) => { selectedTestSubject.value = subject; }
const getTestCountForSubject = (subject) => { return availableTests.value.filter(t => t.subject === subject).length; }
const testsForSelectedSubject = computed(() => { if (!selectedTestSubject.value) return []; return availableTests.value.filter(t => t.subject === selectedTestSubject.value).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); });
const addToFavoritesById = async (teacherId) => {
    const teacher = findTeacherById(teacherId)
    if (!teacher) return
    if (myFavorites.value.find(f => f.id === teacher.id)) {
        alert('Bu öğretmen zaten favorilerinizde.')
        return
    }
    myFavorites.value.push(teacher)
    if (!db) db = getFirestore()
    try {
        await updateDoc(doc(db, 'users', $auth.currentUser.uid), {
            favoriteTeacherIds: myFavorites.value.map(f => f.id)
        })
    } catch(e) {
        console.error('Favori kaydedilemedi:', e)
    }
}
const fetchFavorites = async (savedFavIds) => {
    if (!savedFavIds || savedFavIds.length === 0) {
        myFavorites.value = []
        return
    }
    if (!db) db = getFirestore()
    try {
        // Önce realTeachers'dan eşleştir (hızlı yol)
        const fromCache = realTeachers.value.filter(t => savedFavIds.includes(t.id))
        if (fromCache.length === savedFavIds.length) {
            myFavorites.value = fromCache
            return
        }
        // Eksik olanları Firestore'dan tek tek çek
        const promises = savedFavIds.map(id => getDoc(doc(db, 'users', id)))
        const snaps = await Promise.all(promises)
        myFavorites.value = snaps
            .filter(s => s.exists())
            .map(s => ({ id: s.id, ...s.data() }))
    } catch(e) {
        console.error('Favoriler yüklenemedi:', e)
        // Fallback: realTeachers'dan eşleştir
        myFavorites.value = realTeachers.value.filter(t => savedFavIds.includes(t.id))
    }
}

const isFavorite = (teacherId) => !!myFavorites.value.find(f => f.id === teacherId)
const toggleFavorite = async (teacher) => {
    if (!db) db = getFirestore()
    const idx = myFavorites.value.findIndex(f => f.id === teacher.id)
    if (idx === -1) {
        myFavorites.value.push(teacher)
    } else {
        myFavorites.value.splice(idx, 1)
    }
    // Firestore'a kaydet
    const favoriteIds = myFavorites.value.map(f => f.id)
    try {
        await updateDoc(doc(db, 'users', $auth.currentUser.uid), {
            favoriteTeacherIds: favoriteIds
        })
    } catch(e) {
        console.error('Favori kaydedilemedi:', e)
    }
}
const cancelBookingByStudent = async (booking) => {
    if (!confirm(`${booking.teacherName || 'Öğretmen'} ile ${booking.day} ${booking.time} randevunuzu iptal etmek istiyor musunuz?`)) return
    if (!db) db = getFirestore()
    let step = 'booking'
    try {
        // 1. Booking'i iptal et — en kritik adım
        step = 'booking'
        await updateDoc(doc(db, 'bookings', booking.id), {
            status: 'cancelled_by_student',
            cancelledAt: serverTimestamp()
        })
        // 2. Öğretmenin müsaitliğini geri aç — bu başarısız olsa da iptal tamamdır
        step = 'teacher'
        if (booking.teacherId) {
            try {
                await updateDoc(doc(db, 'users', booking.teacherId), {
                    [`availability.${booking.day}-${booking.time}`]: true
                })
            } catch (e2) {
                console.warn('Öğretmen müsaitliği güncellenemedi (önemli değil):', e2.message)
            }
        }
        // 3. Ücretli dersse puan iade et
        step = 'refund'
        const price = booking.lessonPrice || 0
        if (price > 0) {
            const snap = await getDoc(doc(db, 'users', $auth.currentUser.uid))
            const currentScore = snap.exists() ? (snap.data().score || 0) : studentScore.value
            await updateDoc(doc(db, 'users', $auth.currentUser.uid), { score: currentScore + price })
            studentScore.value = currentScore + price
        }
        // 4. Local state'i hemen güncelle — Firestore'dan tekrar çekmeden önce UI'da göster
        myBookings.value = myBookings.value.map(b =>
            b.id === booking.id ? { ...b, status: 'cancelled_by_student' } : b
        )
        await fetchBookings()
        alert('✅ Randevu iptal edildi.' + (price > 0 ? `
${price} puan iade edildi.` : ''))
    } catch(e) {
        console.error(`İptal hatası (adım: ${step}):`, e)
        // Booking güncellendi ama sonraki adım patlıyorsa kullanıcıya doğruyu söyle
        if (step !== 'booking') {
            await fetchBookings()  // Gerçek durumu çek
            alert('Randevu iptal edildi, ancak bazı güncellemeler gecikmeli olabilir.')
        } else {
            alert('İptal başarısız: ' + e.message)
        }
    }
}
const enterLessonStudent = (booking) => {
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
const openTestRunner = async (test) => {
    currentTest.value = test
    userAnswers.value = new Array(parseInt(test.questionCount)).fill(null)
    tabTimeLeft.value = TAB_TIME_LIMIT
    testDisqualified.value = false
    tabWarningActive.value = false
    aiSuspicionCount.value = 0
    isTakingTest.value = true
    await nextTick()
    // Canvas kurulumu
    const canvas = drawCanvas.value
    canvas.width = canvas.parentElement.clientWidth
    canvas.height = canvas.parentElement.clientHeight
    ctx = canvas.getContext('2d')
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0055ff'
    ctx.lineWidth = 2
    // Güvenlik sistemlerini başlat
    startTabWatcher()
    cameraPermissionState.value = 'asking'
}

// ===== SEKME DEĞİŞİM KORUMA SİSTEMİ =====
const startTabWatcher = () => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
}

const stopTabWatcher = () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    if (tabCountdownInterval) {
        clearInterval(tabCountdownInterval)
        tabCountdownInterval = null
    }
}

const handleVisibilityChange = () => {
    if (!isTakingTest.value) return
    if (document.hidden) {
        // Kullanıcı sekme dışına çıktı
        tabOutStart = Date.now()
        tabWarningActive.value = true
        if (!tabCountdownInterval) {
            tabCountdownInterval = setInterval(() => {
                tabTimeLeft.value -= 1
                if (tabTimeLeft.value <= 0) {
                    tabTimeLeft.value = 0
                    clearInterval(tabCountdownInterval)
                    tabCountdownInterval = null
                    autoFailTest()
                }
            }, 1000)
        }
    } else {
        // Kullanıcı sekmeye döndü — sayacı dondur ama sıfırlama
        if (tabCountdownInterval) {
            clearInterval(tabCountdownInterval)
            tabCountdownInterval = null
        }
        tabWarningActive.value = false
        // tabTimeLeft değeri korunur — bir sonraki çıkışta kaldığı yerden devam eder
    }
}

const autoFailTest = () => {
    testDisqualified.value = true
    stopTabWatcher()
    stopCameraStream()
    alert('⛔ Süre doldu! Sekme dışında çok fazla süre geçirdin. Test puansız kapandı.')
    isTakingTest.value = false
}

// ===== KAMERA / AI TARAMA SİSTEMİ =====
const requestCameraAccess = async () => {
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        cameraPermissionState.value = 'granted'
        await nextTick()
        if (cameraVideo.value) {
            cameraVideo.value.srcObject = cameraStream
        }
        startAiScan()
    } catch (e) {
        console.warn('Kamera erişimi reddedildi:', e)
        cameraPermissionState.value = 'denied'
    }
}

const denyCameraAccess = () => {
    cameraPermissionState.value = 'denied'
}

const stopCameraStream = () => {
    if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop())
        cameraStream = null
    }
    if (aiScanInterval) {
        clearInterval(aiScanInterval)
        aiScanInterval = null
    }
}

// Her 30 saniyede bir kameradan frame al ve basit analiz yap
// Gerçek projede bu frame bir backend AI endpoint'e gönderilmeli
const startAiScan = () => {
    aiScanInterval = setInterval(async () => {
        if (!cameraVideo.value || !cameraCanvas.value) return
        const video = cameraVideo.value
        const canvas = cameraCanvas.value
        canvas.width = video.videoWidth || 320
        canvas.height = video.videoHeight || 240
        const scanCtx = canvas.getContext('2d')
        scanCtx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = canvas.toDataURL('image/jpeg', 0.7)
        await analyzeFrameWithAI(imageData)
    }, 30000)
}

const analyzeFrameWithAI = async (imageData) => {
    try {
        // Gerçek uygulamada: kendi backend'ine gönder, o da Vision API ile analiz eder
        // Şimdilik simüle: ekranda AI aracı var mı kontrolü için placeholder
        // TODO: await fetch('/api/ai-scan', { method:'POST', body: JSON.stringify({ frame: imageData }) })
        // Sahte test için — gerçek entegrasyonda burası dolacak
        console.log('[AI Scan] Frame alındı, analiz bekleniyor...')
        // Örnek: eğer backend 'suspicious: true' dönerse:
        // aiSuspicionCount.value++
        // if (aiSuspicionCount.value >= 2) aiSuspicionWarning.value = true
    } catch (e) {
        console.warn('AI tarama hatası:', e)
    }
}

const startDrawing = (e) => { isDrawing.value = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); }
const draw = (e) => { if (!isDrawing.value) return; ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); }
const stopDrawing = () => { isDrawing.value = false; ctx.closePath(); }
const setTool = (t) => { drawingTool.value = t; ctx.globalCompositeOperation = t === 'eraser' ? 'destination-out' : 'source-over'; ctx.lineWidth = t === 'eraser' ? 20 : 2; }
const clearCanvas = () => ctx.clearRect(0, 0, drawCanvas.value.width, drawCanvas.value.height)

const confirmExitTest = () => {
    if (confirm("Testten çıkmak istediğine emin misin? İlerlemen kaybolacak.")) {
        stopTabWatcher()
        stopCameraStream()
        isTakingTest.value = false
    }
}

const getResultClass = (row, opt) => {
    if (row.status === 'correct' && row.userAnswer === opt) return 'opt-correct'
    if (row.status === 'wrong') {
        if (row.userAnswer === opt) return 'opt-wrong'          // öğrenci yanlış işaretledi
        if (row.correctAnswer === opt) return 'opt-correct-answer' // doğru olan şık
    }
    if (row.status === 'empty' && row.correctAnswer === opt) return 'opt-empty-correct' // boş sorunun doğrusu
    return 'opt-disabled'
}

const closeTestResult = () => {
    isShowingResult.value = false
    testResult.value = null
    isTakingTest.value = false
}

const finishTest = async () => {
    if (testDisqualified.value) {
        alert('⛔ Bu test disklifiye edildi.')
        return
    }

    // Pratik modu — sadece sonucu göster, puan yazma
    if (currentTest.value?.practiceOnly) {
        const totalQ = parseInt(currentTest.value?.questionCount || 0)
        const answerKey = currentTest.value?.answerKey || []
        const review = buildReview(totalQ, answerKey)
        const cc = review.filter(r => r.status === 'correct').length
        const wc = review.filter(r => r.status === 'wrong').length
        const ec = review.filter(r => r.status === 'empty').length
        const pct = totalQ > 0 ? Math.round((cc / totalQ) * 100) : 0
        testResult.value = { successPercent: pct, correctCount: cc, wrongCount: wc, emptyCount: ec, finalPoints: 0, questionReview: review }
        stopTabWatcher()
        stopCameraStream()
        isShowingResult.value = true
        return
    }

    // ── Daha önce çözülmüş mü kontrol et ──
    const alreadyDone = completedTestIds.value[currentTest.value?.id]
    if (alreadyDone) {
        // Sadece sonucu göster, puan verme
        const totalQ = parseInt(currentTest.value?.questionCount || 0)
        const answerKey = currentTest.value?.answerKey || []
        const review = buildReview(totalQ, answerKey)
        const cc = review.filter(r => r.status === 'correct').length
        const wc = review.filter(r => r.status === 'wrong').length
        const ec = review.filter(r => r.status === 'empty').length
        const pct = totalQ > 0 ? Math.round((cc / totalQ) * 100) : 0
        testResult.value = {
            successPercent: pct, correctCount: cc, wrongCount: wc, emptyCount: ec,
            finalPoints: 0, cameraOk: false, questionReview: review,
            alreadyCompleted: true
        }
        stopTabWatcher()
        stopCameraStream()
        isShowingResult.value = true
        return
    }

    const totalQuestions = parseInt(currentTest.value?.questionCount || 0)
    const answered = userAnswers.value.filter(a => a !== null).length
    if (answered < totalQuestions) {
        const proceed = confirm(`${totalQuestions - answered} soru boş bırakıldı. Yine de bitirmek istiyor musun?`)
        if (!proceed) return
    }

    // Cevap anahtarıyla karşılaştır
    const answerKey = currentTest.value?.answerKey || []
    const review = buildReview(totalQuestions, answerKey)
    const correctCount = review.filter(r => r.status === 'correct').length
    const wrongCount   = review.filter(r => r.status === 'wrong').length
    const emptyCount   = review.filter(r => r.status === 'empty').length
    const successPercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0
    const earnedPoints = Math.round(50 * (successPercent / 100))

    const cameraOk = cameraPermissionState.value === 'granted'
    const finalPoints = cameraOk ? earnedPoints : 0

    stopTabWatcher()
    stopCameraStream()

    // Firestore'a kaydet — done:1
    if (db && $auth.currentUser) {
        try {
            const MAX_STUDENT_SCORE = 5000
            const userRef = doc(db, 'users', $auth.currentUser.uid)
            const snap = await getDoc(userRef)
            const current = snap.data() || {}
            const currentScore = current.score || 0
            // 5000 puan limitini aş, fazlasını ekleme
            const scoreAfter = Math.min(currentScore + finalPoints, MAX_STUDENT_SCORE)
            const actualEarned = scoreAfter - currentScore  // gerçekten eklenen
            const newScore = scoreAfter
            const newCount = (current.completedTestCount || 0) + 1
            // Günlük sayaçlar
            const todayStr = new Date().toISOString().slice(0, 10)
            const isSameDay = current.dailyTestDate === todayStr
            const newDailyCount = isSameDay ? (current.dailyTestCount || 0) + 1 : 1
            const newDailyPoints = isSameDay ? (current.dailyTestPoints || 0) + actualEarned : actualEarned
            await updateDoc(userRef, {
                score: newScore,
                completedTestCount: newCount,
                dailyTestDate: todayStr,
                dailyTestCount: newDailyCount,
                dailyTestPoints: newDailyPoints,
                [`completedTests.${currentTest.value.id}`]: {
                    done: 1,
                    completedAt: new Date().toISOString(),
                    successPercent,
                    earnedPoints: actualEarned,
                    cameraUsed: cameraOk
                }
            })
            studentScore.value = newScore
            completedTestCount.value = newCount
            completedLessons.value = newCount
            dailyTestCount.value = newDailyCount
            dailyTestPoints.value = newDailyPoints
            completedTestIds.value[currentTest.value.id] = { done: 1, successPercent, earnedPoints: actualEarned }
            // Limite ulaştıysa bildir
            if (currentScore < MAX_STUDENT_SCORE && newScore >= MAX_STUDENT_SCORE) {
                setTimeout(() => alert('🎯 Tebrikler! Maksimum 5.000 puana ulaştın. Artık test çözmeye devam edebilirsin ama puan kazanamazsın.'), 500)
            }
        } catch (e) {
            console.error('Puan kaydedilemedi:', e)
        }
    }

    // Sonuç ekranını göster — testten çıkma, sonuçları gör
    testResult.value = {
        successPercent,
        correctCount,
        wrongCount,
        emptyCount,
        finalPoints,
        cameraOk,
        questionReview: review
    }
    isShowingResult.value = true
}

// Soru bazlı sonuç listesi oluştur
const buildReview = (totalQuestions, answerKey) => {
    return Array.from({ length: totalQuestions }, (_, i) => {
        const no = i + 1
        const userAnswer   = userAnswers.value[i] || null
        const correctAnswer = answerKey[i] || null
        let status = 'empty'
        if (userAnswer) {
            if (!correctAnswer || userAnswer === correctAnswer) {
                status = 'correct'
            } else {
                status = 'wrong'
            }
        }
        return { no, userAnswer, correctAnswer, status }
    })
}
const isProfileModalOpen = ref(false); const fileInput = ref(null); const profileState = ref({ avatarType: 'initials', selectedPreset: '', uploadedImage: null }); const tempProfile = ref({ name: '', grade: null, avatarType: 'initials', selectedPreset: '', uploadedImage: null }); const presetAvatars = ["https://api.dicebear.com/7.x/avataaars/svg?seed=Felix", "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka", "https://api.dicebear.com/7.x/bottts/svg?seed=Bubba", "https://api.dicebear.com/7.x/micah/svg?seed=Callie", "https://api.dicebear.com/7.x/notionists/svg?seed=Cookie"]; const currentAvatarUrl = computed(() => { if (profileState.value.avatarType === 'upload' && profileState.value.uploadedImage) return profileState.value.uploadedImage; if (profileState.value.avatarType === 'preset' && profileState.value.selectedPreset) return profileState.value.selectedPreset; return `https://ui-avatars.com/api/?name=${userDisplayName.value || 'O'}&background=0055ff&color=fff` }); const openProfileModal = () => { tempProfile.value = { name: userDisplayName.value, grade: userGrade.value, avatarType: profileState.value.avatarType, selectedPreset: profileState.value.selectedPreset, uploadedImage: profileState.value.uploadedImage }; isProfileModalOpen.value = true }; const triggerFileUpload = () => fileInput.value.click(); const handleFileUpload = (event) => { const file = event.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = (e) => { tempProfile.value.uploadedImage = e.target.result; tempProfile.value.avatarType = 'upload' }; reader.readAsDataURL(file) } }; const selectPresetAvatar = (url) => { tempProfile.value.selectedPreset = url; tempProfile.value.avatarType = 'preset' }; const saveProfile = async () => { if (!db) db = getFirestore(); userDisplayName.value = tempProfile.value.name; userGrade.value = tempProfile.value.grade; profileState.value = { avatarType: tempProfile.value.avatarType, selectedPreset: tempProfile.value.selectedPreset, uploadedImage: tempProfile.value.uploadedImage }; if ($auth.currentUser) { try { await updateProfile($auth.currentUser, { displayName: tempProfile.value.name }); const userRef = doc(db, "users", $auth.currentUser.uid); await updateDoc(userRef, { displayName: tempProfile.value.name, grade: tempProfile.value.grade, avatar: { type: tempProfile.value.avatarType, preset: tempProfile.value.selectedPreset, uploadedImage: tempProfile.value.uploadedImage } }) } catch (e) { console.error("Profil güncellenemedi", e) } } isProfileModalOpen.value = false }; const handleLogout = async () => { await signOut($auth); router.push('/'); }; const studentRank = computed(() => { const s = studentScore.value; if (s < 100) return { title: 'Acemi', class: 'rank-1' }; if (s < 500) return { title: 'Hırslı', class: 'rank-2' }; if (s < 1000) return { title: 'Kalfa', class: 'rank-3' }; if (s < 2000) return { title: 'Usta', class: 'rank-4' }; if (s < 5000) return { title: 'Doçent', class: 'rank-5' }; return { title: 'Profesör', class: 'rank-6' } });
onMounted(() => {
    db = getFirestore()
    onAuthStateChanged($auth, async (user) => {
        if (user) {
            userEmail.value = user.email
            userDisplayName.value = user.displayName || ''
            const docRef = doc(db, 'users', user.uid)
            const docSnap = await getDoc(docRef)
            if (docSnap.exists()) {
                const data = docSnap.data()
                if (data.role !== 'student') {
                    router.push(data.role === 'teacher' ? '/dashboard-teacher' : '/')
                    return
                }
                isStudent.value = true
                if (data.grade) userGrade.value = data.grade
                if (data.displayName) userDisplayName.value = data.displayName
                studentScore.value = data.score || 0
                completedTestCount.value = data.completedTestCount || 0
                completedLessons.value = data.completedTestCount || 0
                // Günlük sayaçlar
                const today = new Date().toISOString().slice(0, 10)
                if (data.dailyTestDate === today) {
                    dailyTestCount.value = data.dailyTestCount || 0
                    dailyTestPoints.value = data.dailyTestPoints || 0
                } else {
                    dailyTestCount.value = 0
                    dailyTestPoints.value = 0
                }
                // Tamamlanan testler
                if (data.completedTests) {
                    completedTestIds.value = Object.fromEntries(
                        Object.entries(data.completedTests).map(([k, v]) => [k, {
                            done: v.done ?? 1,
                            successPercent: v.successPercent || 0,
                            earnedPoints: v.earnedPoints || 0
                        }])
                    )
                }
                // Avatar
                if (data.avatar) profileState.value = {
                    avatarType: data.avatar.type || 'initials',
                    selectedPreset: data.avatar.preset || '',
                    uploadedImage: data.avatar.uploadedImage || null
                }
                try {
                    await fetchTests()
                    await fetchTeachers()
                    // Favorileri öğretmenler yüklendikten SONRA eşleştir
                    const savedFavIds = data.favoriteTeacherIds || []
                    await fetchFavorites(savedFavIds)
                    await fetchBookings()
                    fetchChats()
                } catch (e) {
                    console.error('Veri yükleme hatası:', e)
                }
            }
            isLoading.value = false
        } else {
            router.push('/')
        }
    })
})
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
    /* Padding kaldırıldı, mobil uyumu için */
}

/* SIDEBAR LOGO */
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

/* MOBİL BUTON VE OVERLAY */
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

/* SIDEBAR STİLLERİ */
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
    /* Scrollbar düzenlemesi */
    scrollbar-width: thin;
    scrollbar-color: #333 #121212;
}

/* Sidebar Navigation */
.sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex-grow: 1;
    margin-bottom: 20px;
}

.sidebar-nav button,
.nav-link-home {
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
    text-decoration: none;
    font-family: inherit;
}

.sidebar-nav button:hover,
.sidebar-nav button.active {
    background: rgba(0, 85, 255, 0.1);
    color: #0055ff;
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

.main-content {
    flex-grow: 1;
    padding: 20px 40px 40px 40px;
    width: calc(100% - 280px);
    position: relative;
    z-index: 1;
}

/* --- Responsive Sidebar (Hamburger Menü) --- */
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
        /* Overlay'in üstünde */
        transform: translateX(-100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 5px 0 15px rgba(0, 0, 0, 0.5);
        height: 100%;
        overflow-y: auto;
        /* İçerik taşarsa scroll olsun */
        background: #121212;
        /* Arkaplan rengini garantiye al */
    }

    .sidebar.open {
        transform: translateX(0);
    }

    .sidebar-overlay {
        display: block;
    }

    .main-content {
        margin-left: 0;
        width: 100%;
        padding: 70px 20px 20px 20px;
        /* Header için üst boşluk */
    }

    /* Mobilde chat sidebar */
    .chat-sidebar {
        width: 70px;
    }

    .chat-header {
        display: none;
    }
}

/* Loading Screen */
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

/* Profil Bölümü */
.profile-section {
    text-align: center;
    margin-bottom: 30px;
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

/* Logout */
.logout-btn {
    margin-top: auto;
    padding: 12px;
    background: #1a1a1a;
    border: 1px solid #333;
    color: #ff4444;
    border-radius: 8px;
    cursor: pointer;
    transition: 0.3s;
    width: 100%;
    text-align: center;
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
}

.score-card {
    display: flex;
    flex-direction: column;
    flex: 1;
}

.score-stats-row {
    display: flex;
    align-items: center;
    gap: 0;
    margin-top: 16px;
    background: rgba(0,0,0,0.3);
    border: 1px solid #222;
    border-radius: 12px;
    overflow: hidden;
    width: fit-content;
}

.score-stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 20px;
    min-width: 90px;
}

.score-stat-divider {
    width: 1px;
    height: 38px;
    background: #333;
    flex-shrink: 0;
}

.ssi-val {
    font-size: 1.3rem;
    font-weight: 800;
    color: #0055ff;
    line-height: 1;
    margin-bottom: 3px;
}

.ssi-max {
    font-size: 0.75rem;
    color: #444;
    font-weight: 400;
}

.ssi-lab {
    font-size: 0.7rem;
    color: #555;
    letter-spacing: 0.5px;
    white-space: nowrap;
}

.daily-pts-val { color: #10b981 !important; }

.rank-display {
    display: flex;
    align-items: center;
}

.rank-badge-large {
    padding: 10px 20px;
    border-radius: 12px;
    font-weight: 800;
    font-size: 0.95rem;
    letter-spacing: 0.5px;
    border: 1px solid currentColor;
}
.rank-1 { color: #888; border-color: #444; background: rgba(100,100,100,0.1); }
.rank-2 { color: #f59e0b; border-color: rgba(245,158,11,0.4); background: rgba(245,158,11,0.08); }
.rank-3 { color: #6366f1; border-color: rgba(99,102,241,0.4); background: rgba(99,102,241,0.08); }
.rank-4 { color: #0ea5e9; border-color: rgba(14,165,233,0.4); background: rgba(14,165,233,0.08); }
.rank-5 { color: #10b981; border-color: rgba(16,185,129,0.4); background: rgba(16,185,129,0.08); }
.rank-6 { color: #f97316; border-color: rgba(249,115,22,0.4); background: rgba(249,115,22,0.08); }

.score-progress-bar {
    width: 100%;
    max-width: 280px;
    height: 6px;
    background: #1a1a1a;
    border-radius: 3px;
    margin-top: 8px;
    overflow: hidden;
}
.score-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #0055ff, #0088ff);
    border-radius: 3px;
    transition: width 0.5s ease;
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

/* q-item artık score-card içinde .ssi-* ile değiştirildi */
.q-val { display: block; font-size: 1.5rem; font-weight: 700; color: #0055ff; }
.q-lab { font-size: 0.8rem; color: #666; }

/* Diğer Bileşenler */
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

/* Filtre ve Öğretmenler */
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
    position: relative;
    transition: border-color 0.3s, box-shadow 0.3s, transform 0.3s;
    overflow: visible;
}
.teacher-card:hover {
    border-color: #0055ff;
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0,85,255,0.12);
}

/* Kalp butonu — sağ üst köşe */
.btn-heart {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(0,0,0,0.5);
    border: 1px solid #333;
    border-radius: 50%;
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    cursor: pointer;
    transition: 0.2s;
    z-index: 2;
    backdrop-filter: blur(4px);
}
.btn-heart:hover { transform: scale(1.2); border-color: #ef4444; background: rgba(239,68,68,0.15); }
.btn-heart.active { border-color: #ef4444; background: rgba(239,68,68,0.15); }

/* Öğretmen biyografi */
.t-bio {
    font-size: 0.8rem;
    color: #888;
    line-height: 1.5;
    margin: 6px 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-align: left;
}

.teacher-meta-row {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
    margin: 6px 0;
}

.t-price { font-size: 0.8rem; color: #a78bfa; font-weight: 600; }
.t-price-free { font-size: 0.8rem; color: #34d399; font-weight: 600; }

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

.teacher-info {
    position: relative;
    z-index: 5;
    width: 100%;
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
    position: relative;
    z-index: 10;
    pointer-events: all;
}

.badge-offline {
    background: #333;
    color: #f59e0b;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    display: inline-block;
    margin-top: 4px;
}

.btn-request-disabled {
    border-color: #444 !important;
    color: #555 !important;
    cursor: not-allowed !important;
}

.btn-request-disabled:hover {
    background: transparent !important;
    color: #555 !important;
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
    position: relative;
    z-index: 10;
    pointer-events: all;
}

.btn-message:hover {
    background: #333;
    color: white;
}

/* Modals & Inputs */
.modal-select,
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

/* Stats */
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

/* Modals Overlay & Content */
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

/* Chat */
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

/* Booking Modal */
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

/* Çözüm sırasında seçili = MAVİ */
.opt-options button.opt-selected {
    background: #0055ff;
    color: white;
    border-color: #0055ff;
}

/* Sonuç: doğru cevapladı = YEŞİL */
.opt-options button.opt-correct {
    background: #10b981;
    color: white;
    border-color: #10b981;
}

/* Sonuç: yanlış işaretledi = KIRMIZI */
.opt-options button.opt-wrong {
    background: #ef4444;
    color: white;
    border-color: #ef4444;
}

/* Sonuç: doğru şıkkı göster (yanlış veya boş sorularda) = YEŞİL OUTLINE */
.opt-options button.opt-correct-answer {
    background: transparent;
    color: #10b981;
    border-color: #10b981;
    border-width: 2px;
    font-weight: 700;
}

/* Sonuç: boş bırakılan sorunun doğrusu = SARI */
.opt-options button.opt-empty-correct {
    background: transparent;
    color: #f59e0b;
    border-color: #f59e0b;
    border-width: 2px;
    font-weight: 700;
}

/* Sonuç modunda diğer şıklar = soluk */
.opt-options button.opt-disabled {
    background: #111;
    color: #333;
    border-color: #222;
    cursor: default;
}

.opt-options button:disabled {
    cursor: default;
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

/* Dersler */
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

/* Takvim */
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
    grid-template-columns: repeat(7, minmax(0, 1fr));
    text-align: center;
    font-weight: bold;
    margin-bottom: 4px;
    color: #888;
    font-size: 0.8rem;
}

.calendar-grid-header > div {
    padding: 8px 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 3px;
}

.calendar-day {
    min-height: 80px;
    background: #111;
    border: 1px solid #222;
    border-radius: 6px;
    padding: 5px;
    font-size: 0.78rem;
    position: relative;
    overflow: hidden;
    box-sizing: border-box;
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
    padding: 3px 5px 3px 5px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    position: relative;
}
.pill-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.pill-cancel-btn {
    background: transparent; border: none;
    color: rgba(255,255,255,0.7);
    font-size: 0.6rem; cursor: pointer;
    padding: 0; line-height: 1; flex-shrink: 0; transition: 0.15s;
}
.pill-enter-btn {
    background: transparent; border: none;
    color: rgba(255,255,255,0.85);
    font-size: 0.7rem; cursor: pointer;
    padding: 0; line-height: 1; flex-shrink: 0; transition: 0.15s;
}
.pill-enter-btn:hover { transform: scale(1.3); }
.pill-cancel-btn:hover { color: #fca5a5; transform: scale(1.3); }
.event-pill.pill-cancelled {
    background: #333;
    text-decoration: line-through;
    opacity: 0.6;
}
.pill-cancelled-label { font-size: 0.58rem; color: #ef4444; flex-shrink: 0; }

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

/* ===== GÜVENLİK SİSTEMİ STİLLERİ ===== */

/* Sekme değişim uyarı overlay */
.tab-warning-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.92);
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
}

.tab-warning-box {
    background: #1a1a1a;
    border: 2px solid #f59e0b;
    border-radius: 20px;
    padding: 50px 40px;
    text-align: center;
    max-width: 400px;
    width: 90%;
}

.tab-warning-icon {
    font-size: 3rem;
    margin-bottom: 15px;
}

.tab-warning-box h2 {
    font-size: 1.8rem;
    color: #f59e0b;
    margin-bottom: 10px;
}

.tab-warning-box>p {
    color: #ccc;
    font-size: 0.95rem;
    margin-bottom: 30px;
}

.countdown-ring {
    position: relative;
    width: 120px;
    height: 120px;
    margin: 0 auto 20px;
}

.countdown-ring svg {
    transform: rotate(-90deg);
    width: 120px;
    height: 120px;
}

.ring-bg {
    fill: none;
    stroke: #333;
    stroke-width: 8;
}

.ring-progress {
    fill: none;
    stroke: #f59e0b;
    stroke-width: 8;
    stroke-dasharray: 314.16;
    stroke-linecap: round;
    transition: stroke-dashoffset 1s linear;
}

.countdown-number {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 2.5rem;
    font-weight: 800;
    color: #f59e0b;
}

.tab-warning-sub {
    color: #888;
    font-size: 0.85rem;
    margin: 0;
}

.tab-warning-danger {
    color: #ef4444;
    font-weight: bold;
    margin-top: 10px;
    animation: pulse 0.5s infinite alternate;
}

@keyframes pulse {
    from {
        opacity: 1;
    }

    to {
        opacity: 0.4;
    }
}

/* Kamera izin ekranı */
.camera-permission-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.95);
    z-index: 99998;
    display: flex;
    align-items: center;
    justify-content: center;
}

.camera-permission-box {
    background: #161616;
    border: 1px solid #333;
    border-radius: 20px;
    padding: 50px 40px;
    text-align: center;
    max-width: 460px;
    width: 90%;
}

.cam-icon {
    font-size: 4rem;
    margin-bottom: 20px;
}

.camera-permission-box h2 {
    font-size: 1.6rem;
    color: white;
    margin-bottom: 12px;
}

.camera-permission-box>p {
    color: #aaa;
    line-height: 1.7;
    margin-bottom: 25px;
}

.cam-list {
    list-style: none;
    padding: 0;
    margin: 0 0 30px 0;
    text-align: left;
    background: #111;
    border-radius: 10px;
    padding: 15px 20px;
}

.cam-list li {
    color: #ccc;
    padding: 5px 0;
    font-size: 0.9rem;
}

.cam-actions {
    display: flex;
    gap: 15px;
    justify-content: center;
    flex-wrap: wrap;
}

.btn-cam-allow {
    background: #0055ff;
    color: white;
    border: none;
    padding: 14px 30px;
    border-radius: 10px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: 0.2s;
}

.btn-cam-allow:hover {
    background: #0044cc;
}

.btn-cam-deny {
    background: transparent;
    color: #888;
    border: 1px solid #444;
    padding: 14px 30px;
    border-radius: 10px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: 0.2s;
}

.btn-cam-deny:hover {
    color: white;
    border-color: #888;
}

.cam-note {
    color: #f59e0b;
    font-size: 0.8rem;
    margin-top: 20px;
}

/* AI Şüphe uyarısı */
.ai-suspicion-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    z-index: 99997;
    display: flex;
    align-items: center;
    justify-content: center;
}

.ai-suspicion-box {
    background: #1a0000;
    border: 2px solid #ef4444;
    border-radius: 20px;
    padding: 40px;
    text-align: center;
    max-width: 400px;
    width: 90%;
}

.ai-icon {
    font-size: 3rem;
    margin-bottom: 15px;
}

.ai-suspicion-box h2 {
    color: #ef4444;
    margin-bottom: 12px;
}

.ai-suspicion-box p {
    color: #ccc;
    line-height: 1.7;
    margin-bottom: 25px;
}

.btn-ai-ok {
    background: #ef4444;
    color: white;
    border: none;
    padding: 12px 30px;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
}

/* Güvenlik göstergeleri (header'da) */
.security-indicators {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-right: 10px;
}

.sec-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 8px;
    padding: 5px 10px;
    font-size: 0.7rem;
    min-width: 48px;
    transition: 0.3s;
}

.sec-badge span {
    font-size: 1rem;
}

.sec-badge small {
    color: #888;
}

.sec-ok {
    border-color: #10b981;
}

.sec-ok small {
    color: #10b981;
}

.sec-warn {
    border-color: #f59e0b;
}

.sec-warn small {
    color: #f59e0b;
}

.sec-danger {
    border-color: #ef4444;
    animation: pulse 0.5s infinite alternate;
}

.sec-danger small {
    color: #ef4444;
}

.sec-idle {
    border-color: #444;
}

/* Kamera köşe önizlemesi */
.camera-preview-corner {
    position: fixed;
    bottom: 20px;
    left: 20px;
    width: 160px;
    height: 120px;
    background: #000;
    border: 2px solid #10b981;
    border-radius: 10px;
    overflow: hidden;
    z-index: 10000;
}

.cam-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.cam-live-badge {
    position: absolute;
    top: 5px;
    left: 5px;
    background: rgba(0, 0, 0, 0.7);
    color: #ef4444;
    font-size: 0.65rem;
    font-weight: bold;
    padding: 2px 6px;
    border-radius: 4px;
}

</style>