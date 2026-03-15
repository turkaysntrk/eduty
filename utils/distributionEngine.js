/**
 * =====================================================
 * EDUTY — PUAN DAĞITIM MOTORU (distributionEngine.js)
 * =====================================================
 *
 * Algoritma Özeti:
 * 1. Dağıtılmamış bağış puanlarını (pendingPool) Firestore'dan çek.
 * 2. Tüm aktif öğrencileri başarı oranlarına göre sırala.
 * 3. Başarı oranına göre ağırlıklı dağıtım yap:
 *    - Her öğrencinin puanı = (kendi_ağırlık / toplam_ağırlık) × dağıtılacak_puan
 *    - Ağırlık = successPercent (0–100)  → düşük başarılı da 0 almaz, sadece az alır
 * 4. Her öğrencinin Firestore kaydını güncelle.
 * 5. Dağıtım logunu "distributions" koleksiyonuna yaz.
 * 6. Kullanılan bağışları "distributed: true" olarak işaretle.
 *
 * Günlük test puan havuzu (test çözümünden gelen 50pt/test):
 * - Bu motor O puana dokunmaz; test puanları direkt dashboard.vue'da yazılır.
 * - Bu motor SADECE bağışçı puanlarını dağıtır.
 *
 * Kurulum notu:
 * - Bu dosyayı /composables/useDistributionEngine.js veya /utils/ altına koyabilirsin.
 * - Firestore güvenlik kurallarında sadece admin/cloud-function erişimine izin ver.
 * - İleride bu mantığı Firebase Cloud Function'a taşıyarak her bağışta otomatik tetikleyebilirsin.
 */

import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    writeBatch,
    doc,
    serverTimestamp,
    addDoc,
    updateDoc
} from 'firebase/firestore'

// ────────────────────────────────────────────────────
// YARDIMCI: Başarı oranını hesapla
// completedTests = { testId: { successPercent, earnedPoints, ... } }
// ────────────────────────────────────────────────────
const calcStudentSuccessRate = (completedTests = {}) => {
    const tests = Object.values(completedTests)
    if (tests.length === 0) return 0
    const total = tests.reduce((acc, t) => acc + (t.successPercent || 0), 0)
    return Math.round(total / tests.length)
}

// ────────────────────────────────────────────────────
// YARDIMCI: Ağırlıklı dağıtım hesapla
// Her öğrenciye successPercent oranında pay ver.
// Minimum puan garantisi: en az 1 test çözdüyse 0'dan fazla alır.
// ────────────────────────────────────────────────────
const calcWeightedShares = (students, totalPoints) => {
    // Başarı oranı 0 olan ama en az 1 test çözmüş öğrenciye minimum ağırlık ver (5)
    const weights = students.map(s => {
        const base = s.successRate || 0
        const hasActivity = (s.completedTestCount || 0) > 0
        return Math.max(base, hasActivity ? 5 : 0)
    })

    const totalWeight = weights.reduce((a, b) => a + b, 0)
    if (totalWeight === 0) return students.map(() => 0)

    return weights.map(w => Math.floor((w / totalWeight) * totalPoints))
}

// ────────────────────────────────────────────────────
// SABİT: Platform komisyon oranı
// ────────────────────────────────────────────────────
// ────────────────────────────────────────────────────
// ANA FONKSİYON: distributePoints
// Çağrı: await distributePoints(db, triggeredByUid)
// triggeredByUid: bağışçının UID'i (loglama için)
// ────────────────────────────────────────────────────
export const distributePoints = async (db, triggeredByUid = 'system') => {
    const result = {
        success: false,
        totalDistributed: 0,
        commissionPoints: 0,
        studentCount: 0,
        processedDonations: 0,
        breakdown: [],
        error: null
    }

    try {
        // ── 1. Bekleyen bağış havuzunu çek ──
        const donationsRef = collection(db, 'donations')
        const pendingQ = query(donationsRef, where('distributed', '==', false))
        const pendingSnap = await getDocs(pendingQ)

        if (pendingSnap.empty) {
            result.error = 'Dağıtılacak bekleyen bağış puanı yok.'
            return result
        }

        const pendingDonations = pendingSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        const pendingPool = pendingDonations.reduce((acc, d) => acc + (d.points || 0), 0)

        if (pendingPool <= 0) {
            result.error = 'Havuzda dağıtılacak puan bulunamadı.'
            return result
        }

        // Komisyon bağış anında zaten kesildi — tüm havuz öğrencilere gider
        const commissionPoints = 0
        const distributablePoints = pendingPool

        // ── 2. Aktif öğrencileri çek ──
        const usersRef = collection(db, 'users')
        const studentsQ = query(usersRef, where('role', '==', 'student'))
        const studentsSnap = await getDocs(studentsQ)

        if (studentsSnap.empty) {
            result.error = 'Sistemde hiç öğrenci bulunamadı.'
            return result
        }

        const students = studentsSnap.docs
            .map(d => ({
                uid: d.id,
                ref: d.ref,
                displayName: d.data().displayName || d.data().email || 'Öğrenci',
                score: d.data().score || 0,
                completedTestCount: d.data().completedTestCount || 0,
                completedTests: d.data().completedTests || {},
                successRate: calcStudentSuccessRate(d.data().completedTests || {})
            }))
            // Sadece en az 1 test çözmüş öğrenciler dağıtıma katılır
            .filter(s => s.completedTestCount > 0)

        if (students.length === 0) {
            result.error = 'Henüz test çözgmüş aktif öğrenci yok. Puan havuzda bekleyecek.'
            return result
        }

        // ── 3. Ağırlıklı payları hesapla (komisyon düşülmüş miktar üzerinden) ──
        const shares = calcWeightedShares(students, distributablePoints)

        // ── 4. Toplu Firestore yazımı (batch) ──
        const batch = writeBatch(db)

        // Komisyon bağış anında kesildiğinden burada adminStats yazılmaz

        const breakdown = []
        students.forEach((student, i) => {
            const share = shares[i]
            if (share <= 0) return
            const newScore = student.score + share
            batch.update(student.ref, { score: newScore })
            breakdown.push({
                uid: student.uid,
                name: student.displayName,
                successRate: student.successRate,
                pointsReceived: share,
                newTotal: newScore
            })
        })

        // Bağışları "distributed: true" olarak işaretle
        pendingDonations.forEach(donation => {
            const donRef = doc(db, 'donations', donation.id)
            batch.update(donRef, {
                distributed: true,
                distributedAt: new Date().toISOString()
            })
        })

        await batch.commit()

        // ── 5. Dağıtım logunu kaydet ──
        await addDoc(collection(db, 'distributions'), {
            triggeredBy: triggeredByUid,
            totalPool: pendingPool,
            commissionPoints: 0,
            commissionNote: 'Komisyon bağış anında kesildi',
            totalPoints: distributablePoints,
            studentCount: breakdown.length,
            processedDonations: pendingDonations.length,
            breakdown,
            createdAt: serverTimestamp()
        })

        result.success = true
        result.totalDistributed = distributablePoints
        result.commissionPoints = commissionPoints
        result.studentCount = breakdown.length
        result.processedDonations = pendingDonations.length
        result.breakdown = breakdown

    } catch (e) {
        result.error = e.message || 'Bilinmeyen hata'
        console.error('[distributionEngine] Hata:', e)
    }

    return result
}

// ────────────────────────────────────────────────────
// YARDIMCI FONKSİYON: Dağıtım geçmişini getir
// ────────────────────────────────────────────────────
export const fetchDistributionHistory = async (db, limit = 10) => {
    try {
        const snap = await getDocs(collection(db, 'distributions'))
        return snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => {
                const aTime = a.createdAt?.seconds || 0
                const bTime = b.createdAt?.seconds || 0
                return bTime - aTime
            })
            .slice(0, limit)
    } catch (e) {
        console.error('[distributionEngine] Geçmiş alınamadı:', e)
        return []
    }
}

// ────────────────────────────────────────────────────
// YARDIMCI FONKSİYON: Bekleyen havuz miktarını getir
// ────────────────────────────────────────────────────
export const fetchPendingPool = async (db) => {
    try {
        const q = query(collection(db, 'donations'), where('distributed', '==', false))
        const snap = await getDocs(q)
        return snap.docs.reduce((acc, d) => acc + (d.data().points || 0), 0)
    } catch (e) {
        console.error('[distributionEngine] Havuz alınamadı:', e)
        return 0
    }
}