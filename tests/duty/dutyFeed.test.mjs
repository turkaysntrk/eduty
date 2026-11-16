// Çalıştırma: npm run test:duty   (Node yerleşik test koşucusu; yeni bağımlılık yok)
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import {
    validateCards, shuffle, buildRound, createDutyFeed,
    STORAGE_KEY, RECENT_LIMIT
} from '../../utils/dutyFeed.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

// ── yardımcılar ──
function seededRng(seed = 1) {            // mulberry32: tekrarlanabilir rastgelelik
    let a = seed >>> 0
    return () => {
        a = (a + 0x6D2B79F5) >>> 0
        let t = a
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}
function memStorage(initial = {}) {
    const m = new Map(Object.entries(initial))
    return {
        getItem: k => (m.has(k) ? m.get(k) : null),
        setItem: (k, v) => { m.set(k, String(v)) },
        _m: m
    }
}
const mkCard = (n, over = {}) => ({
    id: `c${n}`, exam: n % 2 ? 'TYT' : 'AYT', subject: 'Matematik', topic: 'T', type: 'tip',
    title: `Kart ${n}`, blocks: [{ kind: 'text', text: 'x' }], tags: [], status: 'published', version: 1, ...over
})
const mkCards = (n) => Array.from({ length: n }, (_, i) => mkCard(i + 1))
const readAll = () => {
    const dir = path.join(root, 'content/duty')
    return readdirSync(dir).filter(f => f.endsWith('.json')).sort()
        .flatMap(f => JSON.parse(readFileSync(path.join(dir, f), 'utf8')))
}

// ═════════ İÇERİK DOSYALARI ═════════
test('content/duty: tüm kartlar geçerli, ID benzersiz, en az 20 yayında kart', () => {
    const { cards, errors } = validateCards(readAll())
    assert.deepEqual(errors, [])
    assert.ok(cards.length >= 20, `kart sayısı: ${cards.length}`)
    assert.equal(new Set(cards.map(c => c.id)).size, cards.length)
})

test('content/duty: TYT/AYT dengeli, her tür ve blok türleri temsil ediliyor', () => {
    const { cards } = validateCards(readAll())
    const tyt = cards.filter(c => c.exam === 'TYT').length
    const ayt = cards.filter(c => c.exam === 'AYT').length
    assert.ok(Math.abs(tyt - ayt) <= 2, `TYT:${tyt} AYT:${ayt}`)
    for (const t of ['confusion', 'compare', 'exception', 'tip']) {
        assert.ok(cards.some(c => c.type === t), `tür yok: ${t}`)
    }
    const kinds = new Set(cards.flatMap(c => c.blocks.map(b => b.kind)))
    for (const k of ['text', 'list', 'compare', 'table', 'formula', 'callout', 'image']) {
        assert.ok(kinds.has(k), `blok türü kullanılmamış: ${k}`)
    }
})

test('content/duty: görsel dosyaları gerçekten public/ altında var ve video yok', () => {
    const { cards } = validateCards(readAll())
    for (const c of cards) for (const b of c.blocks) {
        if (b.kind === 'image') assert.ok(existsSync(path.join(root, 'public', b.src)), `eksik görsel: ${b.src}`)
    }
    assert.ok(!JSON.stringify(cards).match(/\.(mp4|webm|mov)|<video|youtube/i), 'video referansı bulundu')
})

test('content/duty: ders adları dashboard "lessons" listesindeki adlarla uyumlu', () => {
    const allowed = new Set(['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türk Dili ve Edebiyatı', 'Tarih', 'Coğrafya', 'Felsefe'])
    for (const c of validateCards(readAll()).cards) assert.ok(allowed.has(c.subject), c.subject)
})

// ═════════ DOĞRULAMA ═════════
test('validateCards: eksik/yanlış alanları reddeder, draft kartı akışa almaz', () => {
    const bad = [
        mkCard(1, { exam: 'KPSS' }), mkCard(2, { type: 'video' }), mkCard(3, { blocks: [] }),
        mkCard(4, { blocks: [{ kind: 'video', src: 'x' }] }),
        mkCard(5, { blocks: [{ kind: 'image', src: 'https://evil.example/x.png', alt: 'a' }] }),
        mkCard(6, { blocks: [{ kind: 'table', headers: ['a', 'b'], rows: [['1']] }] }),
        mkCard(7, { version: 0 }), { id: '' }, null
    ]
    const r = validateCards(bad)
    assert.equal(r.cards.length, 0)
    assert.ok(r.errors.length >= bad.length)

    const ok = validateCards([mkCard(8), mkCard(9, { status: 'draft' }), mkCard(8)])
    assert.deepEqual(ok.cards.map(c => c.id), ['c8'])
    assert.ok(ok.errors.some(e => e.includes('yinelenen')))
})

// ═════════ KARIŞTIRMA ═════════
test('shuffle: Fisher-Yates permütasyon verir, girdiyi değiştirmez', () => {
    const src = Array.from({ length: 50 }, (_, i) => i)
    const copy = src.slice()
    const out = shuffle(src, seededRng(7))
    assert.deepEqual(src, copy)
    assert.deepEqual(out.slice().sort((a, b) => a - b), src)
    assert.notDeepEqual(out, src)
})

test('shuffle: tek bir olası dizilime takılmaz (yaklaşık düzgün dağılım)', () => {
    const rng = seededRng(42)
    const counts = {}
    for (let i = 0; i < 6000; i++) {
        const k = shuffle([1, 2, 3], rng).join('')
        counts[k] = (counts[k] || 0) + 1
    }
    assert.equal(Object.keys(counts).length, 6)
    for (const v of Object.values(counts)) assert.ok(v > 800 && v < 1200, JSON.stringify(counts))
})

// ═════════ TUR / TEKRAR ÖNLEME ═════════
test('bir tur bitmeden hiçbir kart tekrar etmez; tur tüm kartları içerir', () => {
    const cards = mkCards(24)
    const feed = createDutyFeed({ cards, rng: seededRng(3) })
    const seen = [feed.getSnapshot().card.id]
    for (let i = 0; i < 23; i++) { assert.equal(feed.next(), true); seen.push(feed.getSnapshot().card.id) }
    assert.equal(new Set(seen).size, 24)
})

test('yeni turun başında son gösterilen kartlar hemen tekrar etmez (200 deneme)', () => {
    const cards = mkCards(20)
    for (let seed = 1; seed <= 200; seed++) {
        const feed = createDutyFeed({ cards, rng: seededRng(seed) })
        const first = []
        for (let i = 0; i < 20; i++) { first.push(feed.getSnapshot().card.id); if (i < 19) feed.next() }
        const tail = first.slice(-RECENT_LIMIT)
        feed.next()                                   // yeni tur
        const head = []
        for (let i = 0; i < RECENT_LIMIT; i++) { head.push(feed.getSnapshot().card.id); feed.next() }
        for (const id of head) assert.ok(!tail.includes(id), `seed ${seed}: ${id} hemen tekrarlandı`)
    }
})

test('buildRound: küçük havuzlarda da turun ilk kartı son gösterilenle aynı olmaz', () => {
    for (const n of [2, 3, 4, 6, 7]) {
        const ids = Array.from({ length: n }, (_, i) => `k${i}`)
        for (let seed = 1; seed <= 100; seed++) {
            const last = ids[seed % n]
            const order = buildRound(ids, [last], seededRng(seed))
            assert.equal(order.length, n)
            assert.equal(new Set(order).size, n)
            assert.notEqual(order[0], last, `n=${n} seed=${seed}`)
        }
    }
})

test('tek kartlı havuzda ileri/geri hareket etmez ve çökmez', () => {
    const feed = createDutyFeed({ cards: mkCards(1), rng: seededRng(1) })
    assert.equal(feed.next(), false)
    assert.equal(feed.prev(), false)
    assert.equal(feed.getSnapshot().card.id, 'c1')
})

test('boş içerikte çökmez', () => {
    const feed = createDutyFeed({ cards: [] })
    const s = feed.getSnapshot()
    assert.equal(s.card, null)
    assert.equal(feed.next(), false)
    assert.equal(feed.prev(), false)
})

// ═════════ GERİ / İLERİ ═════════
test('prev tur içinde geri döner; turun ilk kartında false döner', () => {
    const feed = createDutyFeed({ cards: mkCards(10), rng: seededRng(5) })
    const a = feed.getSnapshot().card.id
    assert.equal(feed.prev(), false)
    feed.next(); const b = feed.getSnapshot().card.id
    feed.next()
    assert.equal(feed.prev(), true)
    assert.equal(feed.getSnapshot().card.id, b)
    assert.equal(feed.prev(), true)
    assert.equal(feed.getSnapshot().card.id, a)
    assert.equal(feed.getSnapshot().canPrev, false)
})

// ═════════ FAVORİLER ═════════
test('favori: tekrar eklenirse ikinci kez kaydedilmez; toggle/çıkarma çalışır', () => {
    const st = memStorage()
    const feed = createDutyFeed({ cards: mkCards(5), storage: st, rng: seededRng(2) })
    assert.equal(feed.addFavorite('c2'), true)
    assert.equal(feed.addFavorite('c2'), false)
    assert.equal(feed.addFavorite('yok'), false)
    assert.deepEqual(feed.favoriteIds(), ['c2'])
    assert.deepEqual(JSON.parse(st.getItem(STORAGE_KEY)).favorites, ['c2'])
    assert.equal(feed.toggleFavorite('c2'), false)
    assert.deepEqual(feed.favoriteIds(), [])
    assert.equal(feed.toggleFavorite('c3'), true)
    assert.equal(feed.removeFavorite('c3'), true)
    assert.equal(feed.removeFavorite('c3'), false)
})

test('favori eklemek kartı akıştan çıkarmaz / mevcut kartı değiştirmez', () => {
    const feed = createDutyFeed({ cards: mkCards(8), rng: seededRng(9) })
    const before = feed.getSnapshot()
    feed.addFavorite(before.card.id)
    const after = feed.getSnapshot()
    assert.equal(after.card.id, before.card.id)
    assert.equal(after.index, before.index)
    assert.equal(after.total, before.total)
    assert.equal(after.isFavorite, true)
})

test('favoriler modu: yalnızca favorileri gezer; favori yoksa reddeder; geri dönüş çalışır', () => {
    const feed = createDutyFeed({ cards: mkCards(10), rng: seededRng(11) })
    assert.equal(feed.setMode('favorites'), false)
    ;['c2', 'c5', 'c7'].forEach(id => feed.addFavorite(id))
    assert.equal(feed.setMode('favorites'), true)
    const ids = []
    for (let i = 0; i < 3; i++) { ids.push(feed.getSnapshot().card.id); feed.next() }
    assert.deepEqual(ids.sort(), ['c2', 'c5', 'c7'])
    assert.equal(feed.getSnapshot().total, 3)
    assert.equal(feed.setMode('all'), true)
    assert.equal(feed.getSnapshot().total, 10)
})

test('favoriler modunda tüm favoriler kaldırılırsa tur sonunda "tümü"ne döner', () => {
    const feed = createDutyFeed({ cards: mkCards(6), rng: seededRng(4) })
    feed.addFavorite('c1'); feed.addFavorite('c2')
    feed.setMode('favorites')
    feed.removeFavorite('c1'); feed.removeFavorite('c2')
    feed.next(); feed.next()
    assert.equal(feed.getSnapshot().mode, 'all')
    assert.ok(feed.getSnapshot().card)
})

// ═════════ KALICILIK ═════════
test('sayfa yenilenince tur, sıra ve kart sıfırlanmaz; favoriler korunur', () => {
    const st = memStorage()
    const cards = mkCards(12)
    const a = createDutyFeed({ cards, storage: st, rng: seededRng(21) })
    a.next(); a.next(); a.next()
    a.addFavorite(a.getSnapshot().card.id)
    const snap = a.getSnapshot(); const order = a._order(); const favs = a.favoriteIds()

    const b = createDutyFeed({ cards, storage: st, rng: seededRng(999) })   // farklı rng: yeniden karıştırılmamalı
    assert.equal(b.getSnapshot().card.id, snap.card.id)
    assert.equal(b.getSnapshot().index, snap.index)
    assert.deepEqual(b._order(), order)
    assert.deepEqual(b.favoriteIds(), favs)
    assert.equal(b.getSnapshot().isFavorite, true)
})

test('yenileme "görüldü" sayacını şişirmez', () => {
    const st = memStorage()
    const cards = mkCards(5)
    createDutyFeed({ cards, storage: st, rng: seededRng(1) })
    for (let i = 0; i < 4; i++) createDutyFeed({ cards, storage: st, rng: seededRng(1) })
    const data = JSON.parse(st.getItem(STORAGE_KEY))
    assert.equal(Object.values(data.seen).reduce((s, v) => s + v.n, 0), 1)
})

test('görüntülenen kartlar kaydedilir (seenCount)', () => {
    const st = memStorage()
    const feed = createDutyFeed({ cards: mkCards(10), storage: st, rng: seededRng(8) })
    feed.next(); feed.next()
    assert.equal(feed.getSnapshot().seenCount, 3)
    assert.equal(Object.keys(JSON.parse(st.getItem(STORAGE_KEY)).seen).length, 3)
})

test('bozuk / uyumsuz / eski sürüm kayıt: çökmeden temiz başlar', () => {
    const cards = mkCards(6)
    for (const bad of ['{{{', 'null', '"x"', JSON.stringify({ v: 999 }), JSON.stringify({ v: 1, favorites: 'x', seen: 5, recent: {}, round: 7 })]) {
        const feed = createDutyFeed({ cards, storage: memStorage({ [STORAGE_KEY]: bad }), rng: seededRng(1) })
        assert.ok(feed.getSnapshot().card, `girdi: ${bad}`)
        assert.equal(feed.getSnapshot().total, 6)
    }
})

test('storage hata fırlatsa da (kota/özel mod) akış çalışır', () => {
    const boom = { getItem() { throw new Error('x') }, setItem() { throw new Error('quota') } }
    const feed = createDutyFeed({ cards: mkCards(5), storage: boom, rng: seededRng(1) })
    assert.equal(feed.next(), true)
    assert.equal(feed.addFavorite('c1'), true)
})

test('içerik değişince (kart silindi/eklendi) kayıtlı tur uyumlanır, kopya/eksik olmaz', () => {
    const st = memStorage()
    const v1 = mkCards(10)
    const a = createDutyFeed({ cards: v1, storage: st, rng: seededRng(31) })
    a.next(); a.next()
    a.addFavorite('c3')
    const v2 = [...v1.filter(c => c.id !== 'c3' && c.id !== 'c4'), mkCard(11), mkCard(12)]
    const b = createDutyFeed({ cards: v2, storage: st, rng: seededRng(5) })
    const order = b._order()
    assert.equal(order.length, 10)
    assert.equal(new Set(order).size, 10)
    assert.deepEqual(order.slice().sort(), v2.map(c => c.id).sort())
    assert.ok(!b.favoriteIds().includes('c3'))
    assert.ok(b.getSnapshot().card)
})

test('subscribe: her değişimde anlık görüntü gönderilir', () => {
    const feed = createDutyFeed({ cards: mkCards(4), rng: seededRng(1) })
    const got = []
    const off = feed.subscribe(s => got.push(s.index))
    feed.next(); feed.next(); feed.prev()
    off(); feed.next()
    assert.deepEqual(got, [1, 2, 1])
})
