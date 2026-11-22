// composables/useDutySocial.js
// Duty'de öğrencinin tepkileri (beğen / beğenme / biliyordum), kart bildirimleri
// ve favorilerin hesaba senkronu. Koleksiyonlar:
//   users/{uid}/dutyFavorites/{cardId}   → favoriler (yalnızca sahibi)
//   dutyReactions/{uid}_{cardId}         → tepki (öğrenci kendi kaydını yazar, admin okur)
//   dutyReports/{uid}_{cardId}           → bildirim (kart başına bir kez)
import { ref } from 'vue'
import {
    getFirestore, collection, doc, getDocs, setDoc, deleteDoc, query, where, orderBy, serverTimestamp
} from 'firebase/firestore'

export const REPORT_REASONS = [
    { value: 'wrong', label: 'Yanlış bilgi' },
    { value: 'missing', label: 'Eksik bilgi' },
    { value: 'other', label: 'Diğer' }
]

export const useDutySocial = () => {
    const { $auth } = useNuxtApp()
    const reactions = ref({})   // cardId -> { reaction: 'like'|'dislike'|null, known: boolean }
    const reported = ref({})    // cardId -> true
    let db = null
    const getDb = () => (db || (db = getFirestore()))
    const uid = () => ($auth.currentUser ? $auth.currentUser.uid : null)

    async function load() {
        const u = uid()
        if (!u) return
        try {
            const [rs, ps] = await Promise.all([
                getDocs(query(collection(getDb(), 'dutyReactions'), where('uid', '==', u))),
                getDocs(query(collection(getDb(), 'dutyReports'), where('uid', '==', u)))
            ])
            const rmap = {}
            rs.docs.forEach(d => { const x = d.data(); rmap[x.cardId] = { reaction: x.reaction || null, known: !!x.known } })
            const pmap = {}
            ps.docs.forEach(d => { pmap[d.data().cardId] = true })
            reactions.value = rmap
            reported.value = pmap
        } catch (e) {
            console.warn('[Duty] tepkiler yüklenemedi:', e && e.code ? e.code : e)
        }
    }

    function favoritesRemote() {
        const u = uid()
        if (!u) return null
        return {
            uid: u,
            load: async () => {
                const snap = await getDocs(query(collection(getDb(), 'users', u, 'dutyFavorites'), orderBy('createdAt')))
                return snap.docs.map(d => d.data().cardId || d.id)
            },
            add: (id) => setDoc(doc(getDb(), 'users', u, 'dutyFavorites', id), { cardId: id, createdAt: serverTimestamp() }),
            remove: (id) => deleteDoc(doc(getDb(), 'users', u, 'dutyFavorites', id))
        }
    }

    async function writeReaction(cardId, next) {
        const u = uid()
        if (!u) return false
        const prev = reactions.value[cardId] || { reaction: null, known: false }
        reactions.value = { ...reactions.value, [cardId]: next }       // anında yansıt
        try {
            await setDoc(doc(getDb(), 'dutyReactions', `${u}_${cardId}`), {
                uid: u, cardId, reaction: next.reaction, known: !!next.known, updatedAt: serverTimestamp()
            })
            return true
        } catch (e) {
            reactions.value = { ...reactions.value, [cardId]: prev }     // hata: geri al
            console.warn('[Duty] tepki kaydedilemedi:', e && e.code ? e.code : e)
            return false
        }
    }

    /** kind: 'like' | 'dislike' — aynıya tekrar basınca geri alınır. */
    const react = (cardId, kind) => {
        const cur = reactions.value[cardId] || { reaction: null, known: false }
        return writeReaction(cardId, { reaction: cur.reaction === kind ? null : kind, known: cur.known })
    }

    const toggleKnown = (cardId) => {
        const cur = reactions.value[cardId] || { reaction: null, known: false }
        return writeReaction(cardId, { reaction: cur.reaction, known: !cur.known })
    }

    /** Bildirim gönderir (kart başına bir kez). */
    async function report(card, reason, note) {
        const u = uid()
        if (!u || !card) return false
        if (!REPORT_REASONS.some(r => r.value === reason)) return false
        try {
            await setDoc(doc(getDb(), 'dutyReports', `${u}_${card.id}`), {
                uid: u,
                cardId: card.id,
                cardVersion: card.version || 1,
                reason,
                note: String(note || '').trim().slice(0, 300),
                status: 'open',
                createdAt: serverTimestamp()
            })
            reported.value = { ...reported.value, [card.id]: true }
            return true
        } catch (e) {
            console.warn('[Duty] bildirim gönderilemedi:', e && e.code ? e.code : e)
            return false
        }
    }

    return { reactions, reported, load, favoritesRemote, react, toggleKnown, report }
}
