/**
 * =====================================================
 * EDUTY — ANA KASA (mainVault.js)
 * =====================================================
 * 
 * Firestore yapısı:
 * mainVault/stats → { totalBalance, totalIn, totalOut, lastUpdated }
 * mainVault/transactions → alt koleksiyon (log)
 * 
 * Altın Kural:
 * - Kasaya giren = bağışçı ödemesi + öğretmen %20 iadesi
 * - Kasadan çıkan = öğrenci test puanı
 * - Kasa ASLA eksi olamaz
 * - Tüm işlemler atomic transaction ile yapılır
 */

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    runTransaction,
    collection,
    addDoc,
    serverTimestamp,
    increment
} from 'firebase/firestore'

const VAULT_DOC = 'mainVault/stats'

// ── Kasa bakiyesini getir ──
export const getVaultBalance = async (db) => {
    try {
        const snap = await getDoc(doc(db, 'mainVault', 'stats'))
        if (!snap.exists()) return 0
        return snap.data().totalBalance || 0
    } catch (e) {
        console.error('[mainVault] Bakiye alınamadı:', e)
        return 0
    }
}

// ── Kasaya puan ekle (bağışçı / öğretmen iadesi) ──
export const addToVault = async (db, amount, reason, fromUid, fromName) => {
    if (!amount || amount <= 0) return { success: false, error: 'Geçersiz miktar' }
    try {
        await runTransaction(db, async (transaction) => {
            const vaultRef = doc(db, 'mainVault', 'stats')
            const vaultSnap = await transaction.get(vaultRef)

            if (!vaultSnap.exists()) {
                // İlk kez oluştur
                transaction.set(vaultRef, {
                    totalBalance: amount,
                    totalIn: amount,
                    totalOut: 0,
                    lastUpdated: new Date().toISOString()
                })
            } else {
                const current = vaultSnap.data()
                transaction.update(vaultRef, {
                    totalBalance: (current.totalBalance || 0) + amount,
                    totalIn: (current.totalIn || 0) + amount,
                    lastUpdated: new Date().toISOString()
                })
            }
        })

        // Log yaz
        await addDoc(collection(db, 'mainVault', 'stats', 'transactions'), {
            type: 'IN',
            reason,
            amount,
            fromUid: fromUid || 'system',
            fromName: fromName || 'Sistem',
            createdAt: serverTimestamp()
        })

        return { success: true }
    } catch (e) {
        console.error('[mainVault] Ekleme hatası:', e)
        return { success: false, error: e.message }
    }
}

// ── Kasadan puan çek (test ödülü) — atomic ──
// Kasa yetersizse işlemi reddeder
export const withdrawFromVault = async (db, amount, reason, toUid, toName) => {
    if (!amount || amount <= 0) return { success: false, error: 'Geçersiz miktar' }

    try {
        let newBalance = 0

        await runTransaction(db, async (transaction) => {
            const vaultRef = doc(db, 'mainVault', 'stats')
            const vaultSnap = await transaction.get(vaultRef)

            if (!vaultSnap.exists()) {
                throw new Error('INSUFFICIENT_FUNDS')
            }

            const current = vaultSnap.data()
            const balance = current.totalBalance || 0

            if (balance < amount) {
                throw new Error('INSUFFICIENT_FUNDS')
            }

            newBalance = balance - amount
            transaction.update(vaultRef, {
                totalBalance: newBalance,
                totalOut: (current.totalOut || 0) + amount,
                lastUpdated: new Date().toISOString()
            })
        })

        // Log yaz
        await addDoc(collection(db, 'mainVault', 'stats', 'transactions'), {
            type: 'OUT',
            reason,
            amount,
            toUid: toUid || 'system',
            toName: toName || 'Sistem',
            createdAt: serverTimestamp()
        })

        return { success: true, newBalance }
    } catch (e) {
        if (e.message === 'INSUFFICIENT_FUNDS') {
            return { success: false, error: 'INSUFFICIENT_FUNDS', message: 'Kasa yetersiz' }
        }
        console.error('[mainVault] Çekim hatası:', e)
        return { success: false, error: e.message }
    }
}

// ── Kasa istatistiklerini getir ──
export const getVaultStats = async (db) => {
    try {
        const snap = await getDoc(doc(db, 'mainVault', 'stats'))
        if (!snap.exists()) {
            return { totalBalance: 0, totalIn: 0, totalOut: 0 }
        }
        return snap.data()
    } catch (e) {
        console.error('[mainVault] İstatistik alınamadı:', e)
        return { totalBalance: 0, totalIn: 0, totalOut: 0 }
    }
}

// ── İşlem geçmişini getir ──
export const getVaultTransactions = async (db, limitCount = 50) => {
    try {
        const { getDocs, query, orderBy, limit } = await import('firebase/firestore')
        const q = query(
            collection(db, 'mainVault', 'stats', 'transactions'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        )
        const snap = await getDocs(q)
        return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    } catch (e) {
        console.error('[mainVault] İşlem geçmişi alınamadı:', e)
        return []
    }
}