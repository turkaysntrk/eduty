/**
 * =====================================================
 * EDUTY — DUTY AKIŞ MOTORU (utils/dutyFeed.js)
 * =====================================================
 * Vue'dan bağımsız, saf JS. Görevleri:
 *  - Kart verisini doğrulamak (validateCards)
 *  - Fisher-Yates ile tur (round) oluşturmak (shuffle / buildRound)
 *  - Bir turdaki kartlar bitmeden tekrar göstermemek, yeni turda son
 *    gösterilen birkaç kartı hemen tekrar etmemek
 *  - Favori / görüntülenen / tur durumunu localStorage'a (enjekte edilen
 *    "storage" ile) kaydedip geri yüklemek
 *
 * Firestore'a bağlı DEĞİLDİR. İleride Firestore'a geçilirse yalnızca
 * "storage" katmanı (load/persist) değişir; kart ID'leri aynı kalır.
 */

export const STORAGE_KEY = 'eduty.duty.v1'
export const STORAGE_VERSION = 1
export const RECENT_LIMIT = 5   // yeni turun başında tekrar etmeyecek kart sayısı
const RECENT_KEEP = 12          // saklanan "son gösterilenler" uzunluğu

export const EXAMS = ['TYT', 'AYT']
export const CARD_TYPES = ['confusion', 'compare', 'exception', 'tip']
export const BLOCK_KINDS = ['text', 'list', 'compare', 'table', 'formula', 'callout', 'image']
export const CALLOUT_TONES = ['tip', 'warning', 'info']

const isStr = (v) => typeof v === 'string' && v.trim().length > 0
const isStrArray = (v, min = 1) => Array.isArray(v) && v.length >= min && v.every(isStr)

// ────────────────────────────────────────────────────
// DOĞRULAMA
// ────────────────────────────────────────────────────
function validateBlock(b, where, errors) {
    if (!b || typeof b !== 'object' || !BLOCK_KINDS.includes(b.kind)) {
        errors.push(`${where}: bilinmeyen blok türü`)
        return false
    }
    switch (b.kind) {
        case 'text':
        case 'formula':
            if (!isStr(b.text)) { errors.push(`${where}: "${b.kind}" bloğunda text yok`); return false }
            return true
        case 'callout':
            if (!isStr(b.text)) { errors.push(`${where}: callout text yok`); return false }
            if (b.tone !== undefined && !CALLOUT_TONES.includes(b.tone)) { errors.push(`${where}: geçersiz callout tone`); return false }
            return true
        case 'list':
            if (!isStrArray(b.items)) { errors.push(`${where}: list items geçersiz`); return false }
            return true
        case 'compare':
            for (const side of ['left', 'right']) {
                const s = b[side]
                if (!s || !isStr(s.title) || !isStrArray(s.items)) {
                    errors.push(`${where}: compare.${side} geçersiz`)
                    return false
                }
            }
            return true
        case 'table':
            if (!Array.isArray(b.headers) || b.headers.length < 2 || !b.headers.every(h => typeof h === 'string')) {
                errors.push(`${where}: table.headers geçersiz`); return false
            }
            if (!Array.isArray(b.rows) || b.rows.length < 1 ||
                !b.rows.every(r => Array.isArray(r) && r.length === b.headers.length && r.every(c => typeof c === 'string'))) {
                errors.push(`${where}: table.rows geçersiz (sütun sayısı headers ile aynı olmalı)`); return false
            }
            return true
        case 'image':
            // Yalnızca public/duty/ altındaki yerel görseller (video yok, dış kaynak yok)
            if (!isStr(b.src) || !b.src.startsWith('/duty/') || b.src.includes('..')) {
                errors.push(`${where}: image.src "/duty/" ile başlamalı`); return false
            }
            if (!isStr(b.alt)) { errors.push(`${where}: image.alt zorunlu`); return false }
            return true
    }
    return false
}

/**
 * Ham kart dizisini doğrular. Yalnızca status === 'published' olanlar döner.
 * @returns {{ cards: object[], errors: string[] }}
 */
export function validateCards(raw) {
    const errors = []
    const cards = []
    if (!Array.isArray(raw)) return { cards, errors: ['İçerik bir dizi olmalı'] }

    const ids = new Set()
    raw.forEach((c, i) => {
        const where = `kart[${i}]${c && c.id ? ` (${c.id})` : ''}`
        if (!c || typeof c !== 'object') { errors.push(`${where}: nesne değil`); return }
        if (!isStr(c.id)) { errors.push(`${where}: id yok`); return }
        if (ids.has(c.id)) { errors.push(`${where}: yinelenen id`); return }
        ids.add(c.id)

        const problems = []
        if (!EXAMS.includes(c.exam)) problems.push('exam TYT veya AYT olmalı')
        if (!isStr(c.subject)) problems.push('subject yok')
        if (!isStr(c.topic)) problems.push('topic yok')
        if (!CARD_TYPES.includes(c.type)) problems.push('type geçersiz')
        if (!isStr(c.title)) problems.push('title yok')
        if (!Array.isArray(c.tags) || !c.tags.every(isStr)) problems.push('tags dizi olmalı')
        if (!['published', 'draft', 'archived'].includes(c.status)) problems.push('status geçersiz')
        if (!Number.isInteger(c.version) || c.version < 1) problems.push('version >= 1 tam sayı olmalı')
        if (!Array.isArray(c.blocks) || c.blocks.length === 0) problems.push('blocks boş')
        if (problems.length) { errors.push(`${where}: ${problems.join('; ')}`); return }

        let blocksOk = true
        c.blocks.forEach((b, bi) => { if (!validateBlock(b, `${where}.blocks[${bi}]`, errors)) blocksOk = false })
        if (!blocksOk) return

        if (c.status === 'published') cards.push(c)
    })
    return { cards, errors }
}

// ────────────────────────────────────────────────────
// KARIŞTIRMA VE TUR OLUŞTURMA
// ────────────────────────────────────────────────────

/** Fisher-Yates. Orijinal diziyi değiştirmez. rng: [0,1) döndüren fonksiyon. */
export function shuffle(arr, rng = Math.random) {
    const a = arr.slice()
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.min(i, Math.floor(rng() * (i + 1)))
        const t = a[i]; a[i] = a[j]; a[j] = t
    }
    return a
}

/**
 * Yeni bir tur oluşturur: tüm ID'ler tam bir kez geçer ve son gösterilen
 * kartlar (recent) turun başında yer almaz (mümkün olduğu sürece).
 */
export function buildRound(ids, recent = [], rng = Math.random) {
    const order = shuffle(ids, rng)
    const n = order.length
    if (n < 2) return order

    const idSet = new Set(ids)
    const want = Math.min(RECENT_LIMIT, n - 1)
    const recentSet = new Set()
    for (let i = recent.length - 1; i >= 0 && recentSet.size < want; i--) {
        if (idSet.has(recent[i])) recentSet.add(recent[i])
    }
    if (recentSet.size === 0) return order

    // İlk W konumda "yeni" kart olmalı. Sayım gereği (n - |recent| >= W) yeterli aday vardır.
    const W = Math.min(recentSet.size, n - recentSet.size)
    for (let i = 0; i < W; i++) {
        if (!recentSet.has(order[i])) continue
        const candidates = []
        for (let j = W; j < n; j++) if (!recentSet.has(order[j])) candidates.push(j)
        if (candidates.length === 0) break
        const j = candidates[Math.min(candidates.length - 1, Math.floor(rng() * candidates.length))]
        const t = order[i]; order[i] = order[j]; order[j] = t
    }
    return order
}

/** Kayıtlı bir turu mevcut havuzla uyumlu hale getirir (içerik değişmiş olabilir). */
function reconcileRound(round, poolIds, rng) {
    if (!round || !Array.isArray(round.order)) return null
    const pool = new Set(poolIds)
    const used = new Set()
    const order = []
    for (const id of round.order) {
        if (pool.has(id) && !used.has(id)) { order.push(id); used.add(id) }
    }
    if (order.length === 0) return null

    const currentId = round.order[round.index]
    let index = order.indexOf(currentId)
    if (index === -1) index = Math.max(0, Math.min(Number.isInteger(round.index) ? round.index : 0, order.length - 1))

    // Yeni eklenen kartlar, mevcut kartın ARDINA rastgele yerleştirilir.
    for (const id of poolIds) {
        if (used.has(id)) continue
        const pos = index + 1 + Math.min(order.length - index - 1, Math.floor(rng() * (order.length - index)))
        order.splice(pos, 0, id)
        used.add(id)
    }
    return { order, index }
}

// ────────────────────────────────────────────────────
// ANA FABRİKA
// ────────────────────────────────────────────────────
/**
 * @param {object} opts
 * @param {object[]} opts.cards   doğrulanmış kartlar
 * @param {{getItem:Function,setItem:Function}|null} opts.storage  localStorage benzeri
 * @param {Function} opts.rng
 * @param {Function} opts.now
 */
export function createDutyFeed({ cards, storage = null, rng = Math.random, now = Date.now } = {}) {
    const byId = new Map((cards || []).map(c => [c.id, c]))
    const allIds = (cards || []).map(c => c.id)
    const listeners = new Set()

    let state = {
        favorites: [],              // ekleme sırasına göre
        seen: {},                   // id -> { n, t }
        recent: [],                 // son gösterilen ID'ler (en yeni sonda)
        rounds: { all: null, favorites: null },
        mode: 'all'
    }

    // ── Yükleme ──
    function load() {
        if (!storage) return
        let parsed = null
        try {
            const raw = storage.getItem(STORAGE_KEY)
            parsed = raw ? JSON.parse(raw) : null
        } catch (e) { parsed = null }
        if (!parsed || typeof parsed !== 'object' || parsed.v !== STORAGE_VERSION) return

        if (Array.isArray(parsed.favorites)) {
            const seenFav = new Set()
            state.favorites = parsed.favorites.filter(id => byId.has(id) && !seenFav.has(id) && seenFav.add(id))
        }
        if (parsed.seen && typeof parsed.seen === 'object') {
            for (const [id, v] of Object.entries(parsed.seen)) {
                if (byId.has(id) && v && Number.isFinite(v.n)) state.seen[id] = { n: v.n, t: Number(v.t) || 0 }
            }
        }
        if (Array.isArray(parsed.recent)) state.recent = parsed.recent.filter(id => byId.has(id)).slice(-RECENT_KEEP)
        if (parsed.round) state.rounds.all = reconcileRound(parsed.round, allIds, rng)
    }

    function persist() {
        if (!storage) return
        try {
            storage.setItem(STORAGE_KEY, JSON.stringify({
                v: STORAGE_VERSION,
                favorites: state.favorites,
                seen: state.seen,
                recent: state.recent,
                round: state.rounds.all,
                savedAt: now()
            }))
        } catch (e) { /* kota dolu / özel mod: sessizce yoksay */ }
    }

    // ── Yardımcılar ──
    const poolFor = (mode) => (mode === 'favorites' ? state.favorites.filter(id => byId.has(id)) : allIds)

    function startRound(mode) {
        const pool = poolFor(mode)
        state.rounds[mode] = pool.length ? { order: buildRound(pool, state.recent, rng), index: 0 } : null
        return state.rounds[mode]
    }

    function currentId() {
        const r = state.rounds[state.mode]
        return r ? r.order[r.index] : null
    }

    function markShown(id) {
        if (!id) return
        if (state.recent[state.recent.length - 1] === id) return   // yenilemede sayaç şişmesin
        const prev = state.seen[id]
        state.seen[id] = { n: (prev ? prev.n : 0) + 1, t: now() }
        state.recent.push(id)
        if (state.recent.length > RECENT_KEEP) state.recent = state.recent.slice(-RECENT_KEEP)
    }

    function getSnapshot() {
        const r = state.rounds[state.mode]
        const id = currentId()
        return {
            ready: true,
            mode: state.mode,
            card: id ? byId.get(id) : null,
            index: r ? r.index : 0,
            total: r ? r.order.length : 0,
            isFavorite: id ? state.favorites.includes(id) : false,
            favoriteCount: state.favorites.length,
            seenCount: Object.keys(state.seen).length,
            cardCount: allIds.length,
            canPrev: !!r && r.index > 0,
            canNext: !!r && r.order.length > 1
        }
    }

    function emit() {
        persist()
        const snap = getSnapshot()
        listeners.forEach(fn => fn(snap))
    }

    // ── Başlangıç ──
    load()
    if (!state.rounds.all && allIds.length) startRound('all')
    markShown(currentId())
    persist()

    // ── Genel API ──
    return {
        getSnapshot,
        subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) },

        /** Sonraki karta geç. Hareket olduysa true. */
        next() {
            const r = state.rounds[state.mode]
            if (!r || r.order.length < 2) return false
            if (r.index + 1 < r.order.length) {
                r.index++
            } else {
                // Tur bitti → yeni tur (favori turunda favoriler değişmiş olabilir)
                if (state.mode === 'favorites' && poolFor('favorites').length === 0) state.mode = 'all'
                const nr = startRound(state.mode) || startRound('all')
                if (!nr) return false
            }
            markShown(currentId())
            emit()
            return true
        },

        /** Önceki karta dön (yalnızca mevcut tur içinde). */
        prev() {
            const r = state.rounds[state.mode]
            if (!r || r.index <= 0) return false
            r.index--
            markShown(currentId())
            emit()
            return true
        },

        /** Favoriye ekle. Zaten favoriyse false döner (ikinci kez kaydedilmez). */
        addFavorite(id) {
            if (!byId.has(id) || state.favorites.includes(id)) return false
            state.favorites.push(id)
            emit()
            return true
        },

        removeFavorite(id) {
            const i = state.favorites.indexOf(id)
            if (i === -1) return false
            state.favorites.splice(i, 1)
            emit()
            return true
        },

        /** Favori durumunu tersine çevirir; yeni durumu döndürür. */
        toggleFavorite(id) {
            if (state.favorites.includes(id)) { this.removeFavorite(id); return false }
            return this.addFavorite(id)
        },

        /** 'all' | 'favorites'. Favori yokken 'favorites' reddedilir. */
        setMode(mode) {
            if (mode !== 'all' && mode !== 'favorites') return false
            if (mode === state.mode) return false
            if (mode === 'favorites') {
                if (poolFor('favorites').length === 0) return false
                startRound('favorites')
            } else if (!state.rounds.all) {
                startRound('all')
            }
            state.mode = mode
            markShown(currentId())
            emit()
            return true
        },

        isFavorite: (id) => state.favorites.includes(id),
        favoriteIds: () => state.favorites.slice(),
        /** Test amaçlı: şu anki turun sırası. */
        _order: () => (state.rounds[state.mode] ? state.rounds[state.mode].order.slice() : [])
    }
}
