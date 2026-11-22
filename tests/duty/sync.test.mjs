import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createDutyFeed, validateCards } from '../../utils/dutyFeed.js'
import { startFavoriteSync } from '../../utils/dutySync.js'

const load = (f) => JSON.parse(fs.readFileSync(new URL(`../../content/duty/${f}.json`, import.meta.url), 'utf8'))
const { cards } = validateCards([...load('tyt'), ...load('ayt')])
const A = cards[0].id, B = cards[1].id, C = cards[2].id

const mem = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) } }
const fakeRemote = (initial = [], { failLoad = false } = {}) => {
    const set = new Set(initial)
    const log = []
    return {
        uid: 'u1', set, log,
        load: async () => { if (failLoad) throw new Error('offline'); return [...set] },
        add: async (id) => { log.push('+' + id); set.add(id) },
        remove: async (id) => { log.push('-' + id); set.delete(id) }
    }
}
const tick = () => new Promise(r => setTimeout(r, 0))

test('engine.setFavorites / mergeFavorites', () => {
    const e = createDutyFeed({ cards, storage: mem() })
    e.addFavorite(A)
    assert.equal(e.mergeFavorites([B, A, 'yok']), true)
    assert.deepEqual(e.favoriteIds(), [A, B])
    assert.equal(e.setFavorites([C, C, 'yok']), true)
    assert.deepEqual(e.favoriteIds(), [C])
    assert.equal(e.setFavorites([C]), false)
    assert.equal(e.getSnapshot().favoriteCount, 1)
})

test('favoriler modundayken uzak liste boşalırsa tümüne döner', () => {
    const e = createDutyFeed({ cards, storage: mem() })
    e.addFavorite(A)
    e.setMode('favorites')
    assert.equal(e.getSnapshot().mode, 'favorites')
    e.setFavorites([])
    assert.equal(e.getSnapshot().mode, 'all')
    assert.ok(e.getSnapshot().card)
})

test('ilk senkron: yerel ve uzak birleşir, yerel-only uzağa gider', async () => {
    const storage = mem()
    const e = createDutyFeed({ cards, storage })
    e.addFavorite(A)
    const remote = fakeRemote([B])
    const s = startFavoriteSync({ engine: e, remote, storage })
    await s.ready
    assert.deepEqual(new Set(e.favoriteIds()), new Set([A, B]))
    await tick()
    assert.deepEqual(new Set(remote.set), new Set([A, B]))
    assert.deepEqual(remote.log, ['+' + A])           // B'yi tekrar yazmaz
})

test('sonraki senkron: uzak kayıt doğru kaynaktır', async () => {
    const storage = mem()
    storage.setItem('eduty.duty.favSynced.u1', '1')
    const e = createDutyFeed({ cards, storage })
    e.addFavorite(A)
    const remote = fakeRemote([B, C])
    await startFavoriteSync({ engine: e, remote, storage }).ready
    assert.deepEqual(e.favoriteIds(), [B, C])
    assert.deepEqual(remote.log, [])                   // uzaktan gelen değişiklik geri yazılmaz
})

test('yerel ekle/çıkar uzağa yazılır', async () => {
    const storage = mem()
    const e = createDutyFeed({ cards, storage })
    const remote = fakeRemote([])
    const s = startFavoriteSync({ engine: e, remote, storage })
    await s.ready
    e.addFavorite(A); e.addFavorite(B); e.removeFavorite(A)
    await tick()
    assert.deepEqual(remote.log, ['+' + A, '+' + B, '-' + A])
    s.stop()
    e.addFavorite(C)
    await tick()
    assert.ok(!remote.log.includes('+' + C))           // durdurulunca yazmaz
})

test('çevrimdışı: yükleme hatası yerel akışı bozmaz', async () => {
    const storage = mem()
    const e = createDutyFeed({ cards, storage })
    e.addFavorite(A)
    const errors = []
    await startFavoriteSync({ engine: e, remote: fakeRemote([], { failLoad: true }), storage, onError: x => errors.push(x) }).ready
    assert.equal(errors.length, 1)
    assert.deepEqual(e.favoriteIds(), [A])
})
