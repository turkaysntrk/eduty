<template>
    <div v-if="isLoading" class="loading-screen">
        <div class="spinner"></div>
        <p>Admin paneli yükleniyor...</p>
    </div>

    <div v-else-if="isAdmin" class="dashboard-container">

        <button class="mobile-toggle-btn" @click="isSidebarOpen = !isSidebarOpen">☰</button>
        <div v-if="isSidebarOpen" class="sidebar-overlay" @click="isSidebarOpen = false"></div>

        <!-- ===== KULLANICI DÜZENLEME MODALI ===== -->
        <div v-if="isUserModalOpen" class="modal-overlay">
            <div class="modal-content">
                <h3>Kullanıcı Düzenle</h3>
                <div class="modal-body">
                    <label>Ad Soyad</label>
                    <input type="text" v-model="editingUser.displayName" />
                    <label>E-posta</label>
                    <input type="text" v-model="editingUser.email" disabled class="input-disabled" />
                    <label>Rol</label>
                    <select v-model="editingUser.role" class="modal-select">
                        <option value="student">Öğrenci</option>
                        <option value="teacher">Öğretmen</option>
                        <option value="donor">Bağışçı</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <div class="modal-actions">
                    <button @click="isUserModalOpen = false" class="btn-cancel">İptal</button>
                    <button @click="saveUserEdit" class="btn-save">Kaydet</button>
                </div>
            </div>
        </div>

        <!-- ===== SİLME ONAY MODALI ===== -->
        <div v-if="isDeleteModalOpen" class="modal-overlay">
            <div class="modal-content modal-danger">
                <h3>⚠️ Kullanıcıyı Sil</h3>
                <p style="color:#aaa; margin: 15px 0;">
                    <strong style="color:white;">{{ deletingUser?.displayName || deletingUser?.email }}</strong> adlı kullanıcıyı silmek istediğine emin misin? Bu işlem geri alınamaz.
                </p>
                <div class="modal-actions">
                    <button @click="isDeleteModalOpen = false" class="btn-cancel">Vazgeç</button>
                    <button @click="confirmDeleteUser" class="btn-delete">Evet, Sil</button>
                </div>
            </div>
        </div>

        <!-- ===== SIDEBAR ===== -->
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
                <div class="admin-avatar">👑</div>
                <h3 class="user-name">{{ userDisplayName || 'Admin' }}</h3>
                <p class="user-email">{{ userEmail }}</p>
                <span class="admin-badge">SİSTEM YÖNETİCİSİ</span>
            </div>

            <nav class="sidebar-nav">
                <button @click="setTab('overview')" :class="{ active: activeTab === 'overview' }">
                    <span class="icon">📊</span> Genel Bakış
                </button>
                <button @click="setTab('users')" :class="{ active: activeTab === 'users' }">
                    <span class="icon">👥</span> Kullanıcılar
                    <span class="nav-count">{{ totalUsers }}</span>
                </button>
                <button @click="setTab('teachers')" :class="{ active: activeTab === 'teachers' }">
                    <span class="icon">👨‍🏫</span> Öğretmenler
                    <span class="nav-count">{{ teacherCount }}</span>
                </button>
                <button @click="setTab('tests')" :class="{ active: activeTab === 'tests' }">
                    <span class="icon">📝</span> Testler
                    <span class="nav-count">{{ testCount }}</span>
                </button>
                <button @click="setTab('donations')" :class="{ active: activeTab === 'donations' }">
                    <span class="icon">💙</span> Bağışlar
                </button>
                <button @click="setTab('vault')" :class="{ active: activeTab === 'vault' }">
                    <span class="icon">🏦</span> Ana Kasa
                </button>
                <button @click="setTab('revenue')" :class="{ active: activeTab === 'revenue' }">
                    <span class="icon">💰</span> Gelir Raporu
                </button>
                <button @click="setTab('distributions')" :class="{ active: activeTab === 'distributions' }">
                    <span class="icon">🎯</span> Dağıtım Geçmişi
                </button>

                <div class="sidebar-divider"></div>

                <NuxtLink to="/" class="nav-link-home" @click="isSidebarOpen = false">
                    <span class="icon">🏠</span> Ana Sayfaya Dön
                </NuxtLink>
            </nav>

            <button @click="handleLogout" class="logout-btn">Çıkış Yap</button>
        </aside>

        <!-- ===== ANA İÇERİK ===== -->
        <main class="main-content">
            <header class="content-header">
                <div class="header-left">
                    <h1 class="page-title">⚙️ Admin Paneli</h1>
                    <p class="page-sub">Eduty platform yönetim merkezi</p>
                </div>
                <div class="header-stats">
                    <div class="hs-item">
                        <span class="hs-val">{{ totalUsers }}</span>
                        <span class="hs-lab">Toplam Kullanıcı</span>
                    </div>
                    <div class="hs-divider"></div>
                    <div class="hs-item">
                        <span class="hs-val">{{ totalDonations.toLocaleString('tr-TR') }}</span>
                        <span class="hs-lab">Toplam Bağış Puanı</span>
                    </div>
                    <div class="hs-divider"></div>
                    <div class="hs-item">
                        <span class="hs-val commission-val">{{ totalCommission.toLocaleString('tr-TR') }}</span>
                        <span class="hs-lab">Platform Geliri</span>
                    </div>
                </div>
            </header>

            <div class="tab-spacer"></div>

            <section class="tab-content">

                <!-- ===== GENEL BAKIŞ ===== -->
                <div v-if="activeTab === 'overview'" class="animate-fade">
                    <h2 class="section-title">Genel Bakış</h2>
                    <div class="overview-grid">
                        <div class="ov-card blue">
                            <div class="ov-icon">🎓</div>
                            <div class="ov-info">
                                <span class="ov-val">{{ studentCount }}</span>
                                <span class="ov-lab">Öğrenci</span>
                            </div>
                        </div>
                        <div class="ov-card green">
                            <div class="ov-icon">👨‍🏫</div>
                            <div class="ov-info">
                                <span class="ov-val">{{ teacherCount }}</span>
                                <span class="ov-lab">Öğretmen</span>
                            </div>
                        </div>
                        <div class="ov-card purple">
                            <div class="ov-icon">💙</div>
                            <div class="ov-info">
                                <span class="ov-val">{{ donorCount }}</span>
                                <span class="ov-lab">Bağışçı</span>
                            </div>
                        </div>
                        <div class="ov-card orange">
                            <div class="ov-icon">📝</div>
                            <div class="ov-info">
                                <span class="ov-val">{{ testCount }}</span>
                                <span class="ov-lab">Test</span>
                            </div>
                        </div>
                        <div class="ov-card teal">
                            <div class="ov-icon">📅</div>
                            <div class="ov-info">
                                <span class="ov-val">{{ bookingCount }}</span>
                                <span class="ov-lab">Randevu</span>
                            </div>
                        </div>
                        <div class="ov-card gold">
                            <div class="ov-icon">💰</div>
                            <div class="ov-info">
                                <span class="ov-val">{{ totalCommission.toLocaleString('tr-TR') }}</span>
                                <span class="ov-lab">Platform Geliri (Puan)</span>
                            </div>
                        </div>
                    </div>

                    <div class="recent-section">
                        <h3 class="recent-title">Son Kayıt Olan Kullanıcılar</h3>
                        <div class="recent-list">
                            <div v-for="u in recentUsers" :key="u.id" class="recent-item">
                                <div class="ri-avatar">{{ (u.displayName || u.email || '?').charAt(0).toUpperCase() }}</div>
                                <div class="ri-info">
                                    <span class="ri-name">{{ u.displayName || u.email }}</span>
                                    <span class="ri-date">{{ formatDate(u.createdAt) }}</span>
                                </div>
                                <span class="ri-role" :class="'role-' + u.role">{{ formatRole(u.role) }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ===== KULLANICILAR ===== -->
                <div v-if="activeTab === 'users'" class="animate-fade">
                    <div class="section-header-row">
                        <h2 class="section-title">Tüm Kullanıcılar</h2>
                        <div class="filter-row">
                            <input v-model="userSearch" placeholder="🔍 İsim veya e-posta ara..." class="search-input" />
                            <select v-model="userRoleFilter" class="filter-select">
                                <option value="">Tüm Roller</option>
                                <option value="student">Öğrenci</option>
                                <option value="teacher">Öğretmen</option>
                                <option value="donor">Bağışçı</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>

                    <div class="table-wrapper">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Kullanıcı</th>
                                    <th>E-posta</th>
                                    <th>Rol</th>
                                    <th>Puan</th>
                                    <th>Kayıt Tarihi</th>
                                    <th>İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="u in filteredUsers" :key="u.id">
                                    <td>
                                        <div class="td-user">
                                            <div class="td-avatar">{{ (u.displayName || u.email || '?').charAt(0).toUpperCase() }}</div>
                                            <span>{{ u.displayName || '—' }}</span>
                                        </div>
                                    </td>
                                    <td class="td-email">{{ u.email }}</td>
                                    <td><span class="role-badge" :class="'role-' + u.role">{{ formatRole(u.role) }}</span></td>
                                    <td class="td-score">{{ (u.score || 0).toLocaleString('tr-TR') }}</td>
                                    <td class="td-date">{{ formatDate(u.createdAt) }}</td>
                                    <td>
                                        <div class="td-actions">
                                            <button class="btn-edit" @click="openUserModal(u)" title="Düzenle">✏️</button>
                                            <button class="btn-del" @click="openDeleteModal(u)" title="Sil" :disabled="u.id === currentAdminUid">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                                <tr v-if="filteredUsers.length === 0">
                                    <td colspan="6" class="empty-row">Kullanıcı bulunamadı.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- ===== ÖĞRETMENLER ===== -->
                <div v-if="activeTab === 'teachers'" class="animate-fade">
                    <h2 class="section-title">Öğretmen Yönetimi</h2>
                    <div class="teachers-admin-grid">
                        <div v-for="t in allTeachers" :key="t.id" class="teacher-admin-card">
                            <div class="tac-header">
                                <div class="tac-avatar">
                                    <img :src="t.avatar?.uploadedImage || t.avatar?.selectedPreset || 'https://ui-avatars.com/api/?name=' + (t.displayName || 'T') + '&background=0055ff&color=fff'"
                                        style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />
                                </div>
                                <div class="tac-info">
                                    <h4>{{ t.displayName || t.email }}</h4>
                                    <span class="tac-branch">{{ t.branch || 'Branş yok' }}</span>
                                </div>
                            </div>
                            <div class="tac-meta">
                                <span>📍 {{ t.city || '—' }}</span>
                                <span>💎 {{ t.lessonPrice || 0 }} puan/ders</span>
                            </div>
                            <div class="tac-status-row">
                                <span class="tac-status" :class="t.isPublished ? 'status-on' : 'status-off'">
                                    {{ t.isPublished ? '🟢 Yayında' : '🔴 Yayında Değil' }}
                                </span>
                                <button class="btn-toggle-publish"
                                    :class="t.isPublished ? 'btn-unpublish' : 'btn-publish'"
                                    @click="toggleTeacherPublish(t)">
                                    {{ t.isPublished ? 'Yayından Kaldır' : 'Yayınla' }}
                                </button>
                            </div>
                        </div>
                        <div v-if="allTeachers.length === 0" class="empty-state">
                            Henüz kayıtlı öğretmen yok.
                        </div>
                    </div>
                </div>

                <!-- ===== TESTLER ===== -->
                <div v-if="activeTab === 'tests'" class="animate-fade">
                    <h2 class="section-title">Test Yönetimi</h2>
                    <div class="table-wrapper">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Test Adı</th>
                                    <th>Ders</th>
                                    <th>Sınıf</th>
                                    <th>Soru</th>
                                    <th>Öğretmen</th>
                                    <th>Tarih</th>
                                    <th>İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="test in allTests" :key="test.id">
                                    <td>{{ test.title }}</td>
                                    <td><span class="badge-subject">{{ test.subject }}</span></td>
                                    <td>{{ test.grade }}. Sınıf</td>
                                    <td>{{ test.questionCount }}</td>
                                    <td class="td-email">{{ test.uploaderName || '—' }}</td>
                                    <td class="td-date">{{ formatDate(test.createdAt) }}</td>
                                    <td>
                                        <button class="btn-del" @click="deleteTest(test)" title="Testi Sil">🗑️</button>
                                    </td>
                                </tr>
                                <tr v-if="allTests.length === 0">
                                    <td colspan="7" class="empty-row">Henüz test yüklenmemiş.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- ===== BAĞIŞLAR ===== -->
                <div v-if="activeTab === 'donations'" class="animate-fade">
                    <h2 class="section-title">Bağış Takibi</h2>
                    <div class="donation-summary">
                        <div class="ds-item">
                            <span class="ds-val">{{ totalDonations.toLocaleString('tr-TR') }}</span>
                            <span class="ds-lab">Toplam Bağış Puanı</span>
                        </div>
                        <div class="ds-item">
                            <span class="ds-val green-val">{{ distributedDonations.toLocaleString('tr-TR') }}</span>
                            <span class="ds-lab">Dağıtılan</span>
                        </div>
                        <div class="ds-item">
                            <span class="ds-val orange-val">{{ pendingDonations.toLocaleString('tr-TR') }}</span>
                            <span class="ds-lab">Bekleyen</span>
                        </div>
                    </div>
                    <div class="table-wrapper" style="margin-top:20px;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Bağışçı</th>
                                    <th>Paket</th>
                                    <th>Bağışlanan Puan</th>
                                    <th>Öğrencilere Giden</th>
                                    <th>Platform Payı</th>
                                    <th>Tarih</th>
                                    <th>Durum</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="d in allDonations" :key="d.id">
                                    <td>{{ d.donorName || '—' }}</td>
                                    <td>{{ d.packageName || '—' }}</td>
                                    <td class="td-score">{{ (d.totalPoints || d.points || 0).toLocaleString('tr-TR') }}</td>
                                    <td class="td-score" style="color:#10b981">{{ (d.points || 0).toLocaleString('tr-TR') }}</td>
                                    <td class="td-score commission-val">+{{ ((d.totalPoints || d.points || 0) - (d.points || 0)).toLocaleString('tr-TR') }}</td>
                                    <td class="td-date">{{ formatDate(d.createdAt) }}</td>
                                    <td>
                                        <span class="status-pill" :class="d.distributed ? 'pill-done' : 'pill-pending'">
                                            {{ d.distributed ? '✅ Dağıtıldı' : '⏳ Bekliyor' }}
                                        </span>
                                    </td>
                                </tr>
                                <tr v-if="allDonations.length === 0">
                                    <td colspan="5" class="empty-row">Henüz bağış yok.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- ===== ANA KASA ===== -->
                <div v-if="activeTab === 'vault'" class="animate-fade">
                    <h2 class="section-title">Ana Kasa</h2>

                    <!-- Bakiye kartı -->
                    <div class="vault-hero-card">
                        <div class="vh-left">
                            <div class="vh-icon">🏦</div>
                            <div>
                                <div class="vh-label">Mevcut Bakiye</div>
                                <div class="vh-balance" :class="{ 'vault-low': vaultData.totalBalance < 100 }">
                                    {{ (vaultData.totalBalance || 0).toLocaleString('tr-TR') }}
                                    <span>Puan</span>
                                </div>
                                <div class="vh-warn" v-if="vaultData.totalBalance < 100">
                                    ⚠️ Kasa kritik seviyede! Testler pasife geçti.
                                </div>
                            </div>
                        </div>
                        <div class="vh-stats">
                            <div class="vh-stat">
                                <span class="vh-val green-val">{{ (vaultData.totalIn || 0).toLocaleString('tr-TR') }}</span>
                                <span class="vh-lab">Toplam Giren</span>
                                <small>Bağışçılar + Öğretmen İadesi</small>
                            </div>
                            <div class="vh-divider"></div>
                            <div class="vh-stat">
                                <span class="vh-val" style="color:#ef4444">{{ (vaultData.totalOut || 0).toLocaleString('tr-TR') }}</span>
                                <span class="vh-lab">Toplam Çıkan</span>
                                <small>Öğrenci Test Ödülleri</small>
                            </div>
                            <div class="vh-divider"></div>
                            <div class="vh-stat">
                                <span class="vh-val" style="color:#f59e0b">{{ vaultCommission.toLocaleString('tr-TR') }}</span>
                                <span class="vh-lab">Platform Geliri</span>
                                <small>%8 Komisyon (birikimli)</small>
                            </div>
                        </div>
                    </div>

                    <!-- İşlem geçmişi -->
                    <h3 class="recent-title" style="margin-top:25px;">Son İşlemler</h3>
                    <div class="table-wrapper">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Tür</th>
                                    <th>Açıklama</th>
                                    <th>Miktar</th>
                                    <th>Kişi</th>
                                    <th>Tarih</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="tx in vaultTransactions" :key="tx.id">
                                    <td>
                                        <span class="status-pill" :class="tx.type === 'IN' ? 'pill-done' : 'pill-pending'">
                                            {{ tx.type === 'IN' ? '⬆️ Giriş' : '⬇️ Çıkış' }}
                                        </span>
                                    </td>
                                    <td class="td-email">{{ tx.reason || '—' }}</td>
                                    <td class="td-score" :style="tx.type === 'IN' ? 'color:#10b981' : 'color:#ef4444'">
                                        {{ tx.type === 'IN' ? '+' : '-' }}{{ (tx.amount || 0).toLocaleString('tr-TR') }}
                                    </td>
                                    <td class="td-email">{{ tx.fromName || tx.toName || '—' }}</td>
                                    <td class="td-date">{{ formatTimestamp(tx.createdAt) }}</td>
                                </tr>
                                <tr v-if="vaultTransactions.length === 0">
                                    <td colspan="5" class="empty-row">Henüz işlem yok.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- ===== GELİR RAPORU ===== -->
                <div v-if="activeTab === 'revenue'" class="animate-fade">
                    <h2 class="section-title">Platform Gelir Raporu</h2>
                    <div class="revenue-card">
                        <div class="rev-main">
                            <div class="rev-icon">💰</div>
                            <div class="rev-info">
                                <span class="rev-label">Toplam Platform Komisyonu</span>
                                <span class="rev-val">{{ totalCommission.toLocaleString('tr-TR') }} Puan</span>
                                <span class="rev-sub">Tüm dağıtımlardan %10 komisyon</span>
                            </div>
                        </div>
                    </div>

                    <h3 class="recent-title" style="margin-top:30px;">Komisyon Geçmişi</h3>
                    <div class="table-wrapper">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Toplam Bağış (Brüt)</th>
                                    <th>Öğrencilere Dağıtılan</th>
                                    <th>Platform Payı (%8)</th>
                                    <th>Tarih</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="d in distributionHistory" :key="d.id">
                                    <td class="td-score">{{ (d.grossPoints || d.totalPoints || 0).toLocaleString('tr-TR') }} puan</td>
                                    <td class="td-score" style="color:#10b981">{{ (d.totalPoints || 0).toLocaleString('tr-TR') }} puan</td>
                                    <td class="td-score commission-val">{{ (d.calcCommission || 0).toLocaleString('tr-TR') }} puan</td>
                                    <td class="td-date">{{ formatTimestamp(d.createdAt) }}</td>
                                </tr>
                                <tr v-if="distributionHistory.length === 0">
                                    <td colspan="4" class="empty-row">Henüz dağıtım yapılmamış.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- ===== DAĞITIM GEÇMİŞİ ===== -->
                <div v-if="activeTab === 'distributions'" class="animate-fade">
                    <h2 class="section-title">Dağıtım Geçmişi</h2>
                    <div v-for="d in distributionHistory" :key="d.id" class="dist-log-card">
                        <div class="dlc-header">
                            <span class="dlc-date">📅 {{ formatTimestamp(d.createdAt) }}</span>
                            <span class="dlc-total">✅ {{ (d.totalPoints || 0).toLocaleString('tr-TR') }} puan öğrencilere dağıtıldı</span>
                            <span class="dlc-commission">💰 {{ (d.calcCommission || 0).toLocaleString('tr-TR') }} platform payı</span>
                            <span class="dlc-gross" v-if="d.grossPoints">🔵 Toplam: {{ d.grossPoints.toLocaleString('tr-TR') }} puan</span>
                        </div>
                        <div class="dlc-breakdown">
                            <div v-for="row in (d.breakdown || [])" :key="row.uid" class="dlc-row">
                                <span class="dlc-name">{{ row.name }}</span>
                                <div class="dlc-bar-wrap">
                                    <div class="dlc-bar" :style="{ width: row.successRate + '%' }"></div>
                                </div>
                                <span class="dlc-rate">%{{ row.successRate }}</span>
                                <span class="dlc-pts">+{{ row.pointsReceived }} puan</span>
                            </div>
                        </div>
                    </div>
                    <div v-if="distributionHistory.length === 0" class="empty-state">
                        Henüz dağıtım yapılmamış.
                    </div>
                </div>

            </section>
        </main>
    </div>

    <div v-else class="access-denied">
        <div class="denied-box">
            <div class="denied-icon">🚫</div>
            <h2>Erişim Reddedildi</h2>
            <p>Bu sayfaya erişim yetkiniz bulunmuyor.</p>
            <NuxtLink to="/" class="btn-home">Ana Sayfaya Dön</NuxtLink>
        </div>
    </div>
</template>

<script setup>
definePageMeta({ ssr: false })

import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import {
    getFirestore, doc, getDoc, getDocs, updateDoc, deleteDoc,
    collection, query, orderBy, where, serverTimestamp
} from 'firebase/firestore'
import { getVaultStats, getVaultTransactions } from '~/utils/mainVault.js'

const router = useRouter()
const { $auth } = useNuxtApp()
let db

const isLoading = ref(true)
const isAdmin = ref(false)
const isSidebarOpen = ref(false)
const activeTab = ref('overview')
const userDisplayName = ref('')
const userEmail = ref('')
const currentAdminUid = ref('')

// Veri
const allUsers = ref([])
const allTeachers = ref([])
const allTests = ref([])
const allDonations = ref([])
const distributionHistory = ref([])

// Ana Kasa
const vaultData = ref({ totalBalance: 0, totalIn: 0, totalOut: 0 })
const vaultTransactions = ref([])
const vaultCommission = computed(() =>
    allDonations.value.reduce((a, d) => {
        const gross = d.totalPoints || d.points || 0
        const net = d.points || 0
        return a + (gross - net)
    }, 0)
)

// Filtreler
const userSearch = ref('')
const userRoleFilter = ref('')

// Modal
const isUserModalOpen = ref(false)
const editingUser = ref({})
const isDeleteModalOpen = ref(false)
const deletingUser = ref(null)

// ── Computed istatistikler ──
const totalUsers = computed(() => allUsers.value.length)
const studentCount = computed(() => allUsers.value.filter(u => u.role === 'student').length)
const teacherCount = computed(() => allUsers.value.filter(u => u.role === 'teacher').length)
const donorCount = computed(() => allUsers.value.filter(u => u.role === 'donor').length)
const testCount = computed(() => allTests.value.length)
const bookingCount = ref(0)
// totalPoints = bağışçının gördüğü puan, points = öğrencilere giden net puan
const totalDonations = computed(() => allDonations.value.reduce((a, d) => a + (d.totalPoints || d.points || 0), 0))
const distributedDonations = computed(() => allDonations.value.filter(d => d.distributed).reduce((a, d) => a + (d.totalPoints || d.points || 0), 0))
const pendingDonations = computed(() => allDonations.value.filter(d => !d.distributed).reduce((a, d) => a + (d.totalPoints || d.points || 0), 0))
// Komisyon = totalPoints - points farkının toplamı
const totalCommission = computed(() =>
    allDonations.value.reduce((a, d) => {
        const gross = d.totalPoints || d.points || 0
        const net = d.points || 0
        return a + (gross - net)
    }, 0)
)

const recentUsers = computed(() =>
    [...allUsers.value]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 8)
)

const filteredUsers = computed(() => {
    return allUsers.value.filter(u => {
        const matchSearch = !userSearch.value ||
            (u.displayName || '').toLowerCase().includes(userSearch.value.toLowerCase()) ||
            (u.email || '').toLowerCase().includes(userSearch.value.toLowerCase())
        const matchRole = !userRoleFilter.value || u.role === userRoleFilter.value
        return matchSearch && matchRole
    })
})

// ── Sekmeler ──
const setTab = (tab) => {
    activeTab.value = tab
    isSidebarOpen.value = false
}

// ── Yardımcılar ──
const formatRole = (role) => {
    const map = { student: 'Öğrenci', teacher: 'Öğretmen', donor: 'Bağışçı', admin: 'Admin' }
    return map[role] || role || '—'
}

const formatDate = (val) => {
    if (!val) return '—'
    const d = new Date(val)
    if (isNaN(d)) return '—'
    return d.toLocaleDateString('tr-TR')
}

const formatTimestamp = (val) => {
    if (!val) return '—'
    const d = val.toDate ? val.toDate() : new Date(val.seconds ? val.seconds * 1000 : val)
    if (isNaN(d)) return '—'
    return d.toLocaleDateString('tr-TR') + ' ' + d.toLocaleTimeString('tr-TR').slice(0, 5)
}

// ── Veri çekme ──
const fetchAll = async () => {
    if (!db) db = getFirestore()

    // Kullanıcılar
    const usersSnap = await getDocs(collection(db, 'users'))
    allUsers.value = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }))

    // Öğretmenler
    allTeachers.value = allUsers.value.filter(u => u.role === 'teacher')

    // Testler
    const testsSnap = await getDocs(collection(db, 'tests'))
    allTests.value = testsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

    // Bağışlar
    const donSnap = await getDocs(collection(db, 'donations'))
    allDonations.value = donSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

    // Randevu sayısı
    const bookSnap = await getDocs(collection(db, 'bookings'))
    bookingCount.value = bookSnap.size

    // Dağıtım geçmişi
    const distSnap = await getDocs(collection(db, 'distributions'))
    const rawDists = distSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))

    // Her dağıtım için o dağıtımda işlenen bağışların komisyonunu hesapla
    // Dağıtım logunda breakdown var — toplam dağıtılan puan = totalPoints
    // Komisyon = o dağıtımdaki tüm donations'ın (totalPoints - points) toplamı
    // Basit yaklaşım: dağıtılan net puana göre oranla komisyonu hesapla (%8 / %92)
    distributionHistory.value = rawDists.map(d => {
        const netPoints = d.totalPoints || 0
        // net = %92, gross = net / 0.92, komisyon = gross - net
        const grossPoints = netPoints > 0 ? Math.round(netPoints / 0.92) : 0
        const calcCommission = grossPoints - netPoints
        return {
            ...d,
            calcCommission,
            grossPoints
        }
    })

    // Ana Kasa istatistikleri ve işlem geçmişi
    vaultData.value = await getVaultStats(db)
    vaultTransactions.value = await getVaultTransactions(db, 50)
}

// ── Öğretmen yayın toggle ──
const toggleTeacherPublish = async (teacher) => {
    if (!db) db = getFirestore()
    const newVal = !teacher.isPublished
    await updateDoc(doc(db, 'users', teacher.id), { isPublished: newVal })
    teacher.isPublished = newVal
}

// ── Kullanıcı düzenle ──
const openUserModal = (u) => {
    editingUser.value = { ...u }
    isUserModalOpen.value = true
}

const saveUserEdit = async () => {
    if (!db) db = getFirestore()
    await updateDoc(doc(db, 'users', editingUser.value.id), {
        displayName: editingUser.value.displayName,
        role: editingUser.value.role
    })
    const idx = allUsers.value.findIndex(u => u.id === editingUser.value.id)
    if (idx !== -1) allUsers.value[idx] = { ...allUsers.value[idx], ...editingUser.value }
    allTeachers.value = allUsers.value.filter(u => u.role === 'teacher')
    isUserModalOpen.value = false
}

// ── Kullanıcı sil ──
const openDeleteModal = (u) => {
    if (u.id === currentAdminUid.value) return
    deletingUser.value = u
    isDeleteModalOpen.value = true
}

const confirmDeleteUser = async () => {
    if (!db || !deletingUser.value) return
    await deleteDoc(doc(db, 'users', deletingUser.value.id))
    allUsers.value = allUsers.value.filter(u => u.id !== deletingUser.value.id)
    allTeachers.value = allUsers.value.filter(u => u.role === 'teacher')
    isDeleteModalOpen.value = false
    deletingUser.value = null
}

// ── Test sil ──
const deleteTest = async (test) => {
    if (!confirm(`"${test.title}" testini silmek istediğine emin misin?`)) return
    if (!db) db = getFirestore()
    await deleteDoc(doc(db, 'tests', test.id))
    allTests.value = allTests.value.filter(t => t.id !== test.id)
}

const handleLogout = async () => {
    await signOut($auth)
    router.push('/')
}

onMounted(() => {
    db = getFirestore()
    onAuthStateChanged($auth, async (user) => {
        if (!user) { router.push('/'); return }
        currentAdminUid.value = user.uid
        userEmail.value = user.email

        const snap = await getDoc(doc(db, 'users', user.uid))
        if (snap.exists() && snap.data().role === 'admin') {
            isAdmin.value = true
            userDisplayName.value = snap.data().displayName || user.email
            await fetchAll()
        } else {
            isAdmin.value = false
        }
        isLoading.value = false
    })
})
</script>


<style scoped>
/* ── CSS Değişkenleri (Lacivert & Gümüş Tema) ── */
:root {
    --navy-deep: #060c18;
    --navy-mid: #0d1526;
    --navy-light: #152038;
    --navy-border: #1e2d4a;
    --accent: #5b8dd9;
    --accent-dim: #3a6ab5;
    --silver: #c8d8f0;
    --silver-dim: #8aa4c8;
    --silver-muted: #4a6080;
    --success: #10b981;
    --danger: #ef4444;
    --warn: #f59e0b;
}

.dashboard-container {
    display: flex;
    min-height: 100vh;
    background-color: #070d1a;
    color: #c8d8f0;
    font-family: 'Montserrat', sans-serif;
}

/* ── Loading ── */
.loading-screen {
    height: 100vh; display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    background: #070d1a; color: #c8d8f0;
}
.spinner {
    width: 40px; height: 40px;
    border: 4px solid #1e2d4a;
    border-top: 4px solid #5b8dd9;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Mobil ── */
.mobile-toggle-btn {
    display: none; position: fixed; top: 15px; left: 15px;
    z-index: 10002; background: #0d1526; border: 1px solid #1e2d4a;
    color: #c8d8f0; font-size: 1.5rem; padding: 8px 12px;
    border-radius: 8px; cursor: pointer;
}
.sidebar-overlay {
    display: none; position: fixed; inset: 0;
    background: rgba(0,0,0,0.85); z-index: 9998;
}

/* ── Sidebar ── */
.sidebar {
    width: 280px;
    background: linear-gradient(180deg, #0a1020 0%, #060c18 100%);
    border-right: 1px solid #1e2d4a;
    display: flex; flex-direction: column;
    padding: 40px 20px;
    position: sticky; top: 0; height: 100vh;
    overflow-y: auto; flex-shrink: 0;
    scrollbar-width: thin; scrollbar-color: #1e2d4a #060c18;
}
.sidebar-logo-container { padding: 0 10px 30px; display: flex; justify-content: center; }
.sidebar-logo-link { display: flex; align-items: center; text-decoration: none; gap: 15px; }
.sidebar-logo-img { height: 40px; width: auto; }
.eduty-text { font-size: 1.8rem; font-weight: 800; display: flex; gap: 1px; }
.eduty-text span:nth-child(1), .eduty-text span:nth-child(2) { color: #5b8dd9; }
.eduty-text span:nth-child(3), .eduty-text span:nth-child(4), .eduty-text span:nth-child(5) { color: #3a6ab5; }

.profile-section { text-align: center; margin-bottom: 30px; }
.admin-avatar { font-size: 3.5rem; margin-bottom: 10px; filter: drop-shadow(0 0 12px rgba(91,141,217,0.4)); }
.user-name { font-size: 1.1rem; color: #e8f0ff; margin-bottom: 4px; font-weight: 600; }
.user-email { font-size: 0.8rem; color: #3a6080; word-break: break-all; margin-bottom: 10px; }
.admin-badge {
    display: inline-block;
    background: linear-gradient(135deg, #0d2040, #152a50);
    color: #5b8dd9; border: 1px solid #1e3a6a;
    font-size: 0.6rem; font-weight: 800;
    padding: 5px 14px; border-radius: 20px; letter-spacing: 1.5px;
}

.sidebar-nav { display: flex; flex-direction: column; gap: 4px; flex-grow: 1; margin-bottom: 20px; }
.sidebar-nav button, .nav-link-home {
    background: transparent; border: none; color: #4a6080;
    text-align: left; padding: 11px 15px; border-radius: 8px;
    cursor: pointer; font-size: 0.9rem;
    display: flex; align-items: center; gap: 10px;
    text-decoration: none; font-family: inherit; transition: 0.2s;
}
.sidebar-nav button:hover, .sidebar-nav button.active {
    background: rgba(91,141,217,0.1); color: #5b8dd9;
    border-left: 2px solid #5b8dd9;
    padding-left: 13px;
}
.nav-link-home:hover { background: #0d1526; color: #c8d8f0; }
.nav-count {
    margin-left: auto; background: #0d1526; color: #3a6080;
    font-size: 0.7rem; padding: 2px 8px; border-radius: 10px; border: 1px solid #1e2d4a;
}
.sidebar-divider { height: 1px; background: #1e2d4a; margin: 8px 0; }
.logout-btn {
    padding: 12px; background: transparent; border: 1px solid #2a1a1a;
    color: #ef4444; border-radius: 8px; cursor: pointer; width: 100%;
    transition: 0.2s;
}
.logout-btn:hover { background: rgba(239,68,68,0.08); border-color: #ef4444; }

/* ── Main ── */
.main-content {
    flex-grow: 1; padding: 30px 40px 40px;
    min-width: 0; display: flex; flex-direction: column;
}
.tab-spacer { height: 0; }
.tab-content { flex: 1; }

/* ── Content Header ── */
.content-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 35px;
    background: linear-gradient(135deg, #0d1526, #0a1020);
    padding: 25px 30px; border-radius: 16px;
    border: 1px solid #1e2d4a;
    flex-wrap: wrap; gap: 20px;
    position: relative; z-index: 1;
}
.page-title { font-size: 1.5rem; color: #e8f0ff; margin: 0 0 4px; font-weight: 700; letter-spacing: 0.5px; }
.page-sub { font-size: 0.82rem; color: #3a6080; margin: 0; }

.header-stats {
    display: flex; align-items: center; gap: 0;
    background: rgba(0,0,0,0.3); border: 1px solid #1e2d4a;
    border-radius: 12px; overflow: hidden;
}
.hs-item { display: flex; flex-direction: column; align-items: center; padding: 12px 22px; min-width: 115px; }
.hs-val { font-size: 1.3rem; font-weight: 800; color: #5b8dd9; }
.hs-lab { font-size: 0.65rem; color: #3a6080; white-space: nowrap; margin-top: 3px; letter-spacing: 0.3px; }
.hs-divider { width: 1px; height: 38px; background: #1e2d4a; flex-shrink: 0; }
.commission-val { color: #10b981 !important; }

.section-title { font-size: 1.5rem; margin-bottom: 25px; color: #c8d8f0; font-family: 'Times New Roman', serif; border-bottom: 1px solid #1e2d4a; padding-bottom: 12px; }
.animate-fade { animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

/* ── Overview ── */
.overview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; margin-bottom: 30px; }
.ov-card {
    background: #0d1526; border: 1px solid #1e2d4a; border-radius: 12px;
    padding: 18px 20px; display: flex; align-items: center; gap: 14px; transition: 0.2s;
}
.ov-card:hover { transform: translateY(-2px); border-color: #2a3d60; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
.ov-icon { font-size: 2rem; }
.ov-val { display: block; font-size: 1.7rem; font-weight: 800; line-height: 1; }
.ov-lab { font-size: 0.72rem; color: #3a6080; margin-top: 3px; }
.ov-card.blue .ov-val { color: #5b8dd9; }
.ov-card.green .ov-val { color: #10b981; }
.ov-card.purple .ov-val { color: #8b5cf6; }
.ov-card.orange .ov-val { color: #f97316; }
.ov-card.teal .ov-val { color: #06b6d4; }
.ov-card.gold .ov-val { color: #c8d8f0; }

.recent-section { background: #0d1526; border: 1px solid #1e2d4a; border-radius: 14px; padding: 20px; }
.recent-title { font-size: 0.9rem; color: #3a6080; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; }
.recent-list { display: flex; flex-direction: column; gap: 8px; }
.recent-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 8px; background: #060c18; border: 1px solid #1e2d4a; }
.ri-avatar { width: 34px; height: 34px; background: #152038; border: 1px solid #1e2d4a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #5b8dd9; font-size: 0.9rem; flex-shrink: 0; }
.ri-info { flex: 1; display: flex; flex-direction: column; }
.ri-name { font-size: 0.88rem; color: #c8d8f0; }
.ri-date { font-size: 0.72rem; color: #3a6080; }
.ri-role { font-size: 0.7rem; padding: 3px 10px; border-radius: 10px; font-weight: 600; }

/* ── Roller ── */
.role-student, .role-badge.role-student { background: rgba(91,141,217,0.12); color: #5b8dd9; }
.role-teacher, .role-badge.role-teacher { background: rgba(16,185,129,0.12); color: #10b981; }
.role-donor, .role-badge.role-donor { background: rgba(139,92,246,0.12); color: #8b5cf6; }
.role-admin, .role-badge.role-admin { background: rgba(200,216,240,0.1); color: #c8d8f0; }
.role-badge { display: inline-block; padding: 3px 10px; border-radius: 10px; font-size: 0.72rem; font-weight: 600; }

/* ── Tablo ── */
.section-header-row { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 15px; margin-bottom: 20px; }
.filter-row { display: flex; gap: 10px; flex-wrap: wrap; }
.search-input, .filter-select {
    background: #0d1526; color: #c8d8f0; border: 1px solid #1e2d4a;
    padding: 10px 15px; border-radius: 8px; font-size: 0.88rem;
}
.search-input:focus, .filter-select:focus { outline: none; border-color: #5b8dd9; }
.search-input { min-width: 250px; }
.filter-select { min-width: 140px; }

.table-wrapper { overflow-x: auto; border-radius: 12px; border: 1px solid #1e2d4a; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th {
    background: #0a1020; padding: 13px 16px; text-align: left;
    font-size: 0.72rem; color: #3a6080; letter-spacing: 0.8px; white-space: nowrap;
    text-transform: uppercase; border-bottom: 1px solid #1e2d4a;
}
.data-table td { padding: 13px 16px; border-bottom: 1px solid #0d1526; font-size: 0.88rem; color: #8aa4c8; background: #060c18; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: #0d1526; }
.td-user { display: flex; align-items: center; gap: 10px; }
.td-avatar { width: 30px; height: 30px; background: #152038; border: 1px solid #1e2d4a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #5b8dd9; font-size: 0.8rem; flex-shrink: 0; }
.td-email { color: #3a6080; font-size: 0.82rem; }
.td-score { color: #5b8dd9; font-weight: 700; }
.td-date { color: #3a6080; font-size: 0.8rem; }
.empty-row { text-align: center; color: #3a6080; padding: 35px !important; font-style: italic; }

.td-actions { display: flex; gap: 6px; }
.btn-edit, .btn-del {
    background: #0d1526; border: 1px solid #1e2d4a;
    border-radius: 6px; width: 32px; height: 32px;
    cursor: pointer; transition: 0.2s;
    display: flex; align-items: center; justify-content: center; font-size: 0.85rem;
}
.btn-edit:hover { background: rgba(91,141,217,0.15); border-color: #5b8dd9; }
.btn-del:hover { background: rgba(239,68,68,0.12); border-color: #ef4444; }
.btn-del:disabled { opacity: 0.25; cursor: not-allowed; }

/* ── Öğretmen kartları ── */
.teachers-admin-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
.teacher-admin-card { background: #0d1526; border: 1px solid #1e2d4a; border-radius: 14px; padding: 20px; transition: 0.2s; }
.teacher-admin-card:hover { border-color: #2a4070; }
.tac-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.tac-avatar { width: 50px; height: 50px; border-radius: 50%; background: #152038; border: 1px solid #1e2d4a; overflow: hidden; flex-shrink: 0; }
.tac-info h4 { color: #e8f0ff; margin: 0 0 4px; font-size: 1rem; }
.tac-branch { background: rgba(91,141,217,0.12); color: #5b8dd9; font-size: 0.72rem; padding: 2px 8px; border-radius: 4px; }
.tac-meta { display: flex; gap: 12px; color: #3a6080; font-size: 0.8rem; margin-bottom: 12px; flex-wrap: wrap; }
.tac-status-row { display: flex; justify-content: space-between; align-items: center; }
.tac-status { font-size: 0.82rem; font-weight: 600; }
.status-on { color: #10b981; }
.status-off { color: #ef4444; }
.btn-toggle-publish { font-size: 0.76rem; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: 0.2s; }
.btn-publish { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.25); }
.btn-publish:hover { background: #10b981; color: #000; }
.btn-unpublish { background: rgba(239,68,68,0.08); color: #ef4444; border: 1px solid rgba(239,68,68,0.25); }
.btn-unpublish:hover { background: #ef4444; color: white; }

.badge-subject { background: rgba(91,141,217,0.15); color: #5b8dd9; border: 1px solid rgba(91,141,217,0.25); padding: 3px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 600; }

/* ── Bağış ── */
.donation-summary { display: flex; gap: 14px; flex-wrap: wrap; }
.ds-item { background: #0d1526; border: 1px solid #1e2d4a; border-radius: 12px; padding: 20px 25px; text-align: center; flex: 1; min-width: 140px; }
.ds-val { display: block; font-size: 1.6rem; font-weight: 800; color: #5b8dd9; }
.ds-lab { font-size: 0.72rem; color: #3a6080; margin-top: 4px; }
.green-val { color: #10b981 !important; }
.orange-val { color: #f97316 !important; }
.status-pill { padding: 4px 12px; border-radius: 10px; font-size: 0.75rem; font-weight: 600; }
.pill-done { background: rgba(16,185,129,0.1); color: #10b981; }
.pill-pending { background: rgba(245,158,11,0.1); color: #f59e0b; }

/* ── Gelir raporu ── */
.revenue-card {
    background: linear-gradient(135deg, #0a1020, #0d1830);
    border: 1px solid #1e3050; border-radius: 16px; padding: 30px;
}
.rev-main { display: flex; align-items: center; gap: 20px; }
.rev-icon { font-size: 3.5rem; }
.rev-label { display: block; color: #3a6080; font-size: 0.85rem; margin-bottom: 6px; }
.rev-val { display: block; font-size: 2.2rem; font-weight: 800; color: #10b981; margin-bottom: 6px; }
.rev-sub { font-size: 0.8rem; color: #3a6080; }

/* ── Dağıtım geçmişi ── */
.dist-log-card { background: #0d1526; border: 1px solid #1e2d4a; border-radius: 14px; padding: 20px; margin-bottom: 14px; }
.dlc-header { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 15px; padding-bottom: 12px; border-bottom: 1px solid #1e2d4a; align-items: center; }
.dlc-date { color: #3a6080; font-size: 0.82rem; }
.dlc-total { color: #10b981; font-weight: 700; font-size: 0.9rem; }
.dlc-commission { color: #5b8dd9; font-size: 0.82rem; background: rgba(91,141,217,0.08); border: 1px solid rgba(91,141,217,0.15); padding: 3px 10px; border-radius: 6px; }
.dlc-gross { color: #8aa4c8; font-size: 0.78rem; }
.dlc-breakdown { display: flex; flex-direction: column; gap: 8px; }
.dlc-row { display: flex; align-items: center; gap: 12px; }
.dlc-name { width: 150px; font-size: 0.83rem; color: #8aa4c8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 0; }
.dlc-bar-wrap { flex: 1; height: 5px; background: #152038; border-radius: 3px; overflow: hidden; }
.dlc-bar { height: 100%; background: linear-gradient(90deg, #3a6ab5, #5b8dd9); border-radius: 3px; transition: width 0.6s ease; }
.dlc-rate { width: 45px; text-align: right; font-size: 0.75rem; color: #3a6080; flex-shrink: 0; }
.dlc-pts { width: 80px; text-align: right; font-size: 0.82rem; color: #5b8dd9; font-weight: 700; flex-shrink: 0; }

/* ── Modaller ── */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.88); display: flex; justify-content: center; align-items: center; z-index: 9999; backdrop-filter: blur(4px); }
.modal-content { background: #0d1526; padding: 30px; border-radius: 16px; width: 90%; max-width: 420px; border: 1px solid #1e2d4a; }
.modal-danger { border-color: rgba(239,68,68,0.4); background: #100d14; }
.modal-content h3 { color: #e8f0ff; margin: 0 0 20px; font-size: 1.1rem; }
.modal-body label { display: block; color: #3a6080; font-size: 0.78rem; margin-bottom: 5px; margin-top: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
.modal-body input, .modal-select { width: 100%; padding: 10px 14px; background: #060c18; border: 1px solid #1e2d4a; color: #c8d8f0; border-radius: 8px; box-sizing: border-box; }
.modal-body input:focus, .modal-select:focus { outline: none; border-color: #5b8dd9; }
.input-disabled { opacity: 0.4; cursor: not-allowed; }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 22px; }
.btn-cancel { background: transparent; color: #3a6080; border: 1px solid #1e2d4a; padding: 10px 20px; border-radius: 8px; cursor: pointer; transition: 0.2s; }
.btn-cancel:hover { color: #c8d8f0; border-color: #4a6080; }
.btn-save { background: #5b8dd9; color: white; border: none; padding: 10px 22px; border-radius: 8px; cursor: pointer; font-weight: 700; transition: 0.2s; }
.btn-save:hover { background: #4a7bc8; }
.btn-delete { background: #ef4444; color: white; border: none; padding: 10px 22px; border-radius: 8px; cursor: pointer; font-weight: 700; transition: 0.2s; }
.btn-delete:hover { background: #dc2626; }

/* ── Erişim reddedildi ── */
.access-denied { height: 100vh; display: flex; align-items: center; justify-content: center; background: #070d1a; }
.denied-box { text-align: center; padding: 50px; }
.denied-icon { font-size: 5rem; margin-bottom: 20px; }
.denied-box h2 { color: #ef4444; font-size: 2rem; margin-bottom: 10px; }
.denied-box p { color: #3a6080; margin-bottom: 25px; }
.btn-home { background: #5b8dd9; color: white; padding: 12px 30px; border-radius: 8px; font-weight: 700; text-decoration: none; transition: 0.2s; }
.btn-home:hover { background: #4a7bc8; }

/* ── Empty state ── */
.empty-state { text-align: center; padding: 60px; color: #3a6080; border: 2px dashed #1e2d4a; border-radius: 16px; font-style: italic; }

/* ── Responsive ── */
@media (max-width: 1024px) {
    .mobile-toggle-btn { display: block; }
    .sidebar { position: fixed; left: 0; top: 0; bottom: 0; z-index: 9999; transform: translateX(-100%); transition: transform 0.3s ease; box-shadow: 4px 0 20px rgba(0,0,0,0.6); }
    .sidebar.open { transform: translateX(0); }
    .sidebar-overlay { display: block; }
    .main-content { margin-left: 0; width: 100%; padding: 70px 20px 20px; }
    .header-stats { flex-wrap: wrap; }
    .hs-item { min-width: 90px; padding: 10px 14px; }
}
/* ── Ana Kasa ── */
.vault-hero-card {
    background: linear-gradient(135deg, #0a1020, #0d1830);
    border: 1px solid #1e3050; border-radius: 16px;
    padding: 25px; margin-bottom: 20px;
    display: flex; gap: 30px; flex-wrap: wrap;
}
.vh-left { display: flex; align-items: center; gap: 16px; min-width: 220px; }
.vh-icon { font-size: 3rem; }
.vh-label { font-size: 0.72rem; color: #3a6080; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
.vh-balance { font-size: 2rem; font-weight: 800; color: #10b981; }
.vh-balance span { font-size: 0.9rem; color: #666; }
.vault-low { color: #ef4444 !important; }
.vh-warn { color: #ef4444; font-size: 0.78rem; margin-top: 6px; font-weight: 600; }
.vh-stats { display: flex; flex: 1; align-items: center; background: rgba(0,0,0,0.3); border-radius: 12px; overflow: hidden; }
.vh-stat { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 14px; }
.vh-val { font-size: 1.4rem; font-weight: 800; color: #5b8dd9; }
.vh-lab { font-size: 0.7rem; color: #3a6080; margin-top: 3px; }
.vh-stat small { font-size: 0.62rem; color: #2a4060; margin-top: 2px; }
.vh-divider { width: 1px; height: 50px; background: #1e2d4a; flex-shrink: 0; }

</style>