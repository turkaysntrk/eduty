import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { getDutyAccess, filterCardsForProfile, validateCards, normalizeGrade, trackRequiredForGrade, createDutyFeed } from '../../utils/dutyFeed.js'

const load = (f) => JSON.parse(fs.readFileSync(new URL(`../../content/duty/${f}.json`, import.meta.url), 'utf8'))
const { cards, errors } = validateCards([...load('tyt'), ...load('ayt')])
const ids = (list) => list.map(c => c.id)

test('içerik doğrulaması hatasız ve 24 kart', () => {
    assert.deepEqual(errors, [])
    assert.equal(cards.length, 24)
})

test('normalizeGrade', () => {
    assert.equal(normalizeGrade('9'), 9)
    assert.equal(normalizeGrade(10), 10)
    assert.equal(normalizeGrade('Mezun'), 13)
    assert.equal(normalizeGrade('9. Sınıf'), 9)
    assert.equal(normalizeGrade(null), null)
    assert.equal(normalizeGrade('abc'), null)
})

test('erişim: 1-8 pasif, sınıf yok, bölüm zorunluluğu', () => {
    assert.equal(getDutyAccess({ grade: '5' }).status, 'inactive')
    assert.equal(getDutyAccess({ grade: 8 }).status, 'inactive')
    assert.equal(getDutyAccess({}).status, 'noGrade')
    assert.equal(getDutyAccess({ grade: 9 }).status, 'ok')
    assert.equal(getDutyAccess({ grade: 10 }).status, 'ok')
    for (const g of [11, 12, 'Mezun']) {
        assert.equal(trackRequiredForGrade(g), true)
        assert.equal(getDutyAccess({ grade: g }).status, 'needTrack')
        assert.equal(getDutyAccess({ grade: g, track: 'xx' }).status, 'needTrack')
        assert.equal(getDutyAccess({ grade: g, track: 'sayisal' }).status, 'ok')
    }
})

test('9. sınıf: yalnızca TYT ve minGrade ≤ 9', () => {
    const r = filterCardsForProfile(cards, { grade: 9 })
    assert.ok(r.length > 0)
    assert.ok(r.every(c => c.exam === 'TYT' && c.minGrade <= 9))
    assert.ok(!ids(r).includes('duty_tyt_mat_0003')) // minGrade 10
})

test('10. sınıf: yalnızca TYT, minGrade ≤ 10', () => {
    const r = filterCardsForProfile(cards, { grade: 10 })
    assert.ok(r.every(c => c.exam === 'TYT' && c.minGrade <= 10))
    assert.ok(ids(r).includes('duty_tyt_mat_0003'))
    assert.ok(!ids(r).includes('duty_tyt_tar_0002')) // minGrade 12
})

test('11. sınıf sayısal: TYT ≤11 + AYT ≤11 ve bölüme uygun', () => {
    const r = filterCardsForProfile(cards, { grade: 11, track: 'sayisal' })
    assert.ok(r.every(c => c.minGrade <= 11))
    assert.ok(r.some(c => c.exam === 'AYT'))
    assert.ok(ids(r).includes('duty_ayt_fiz_0001'))
    assert.ok(!ids(r).includes('duty_ayt_mat_0001'))   // minGrade 12
    assert.ok(!ids(r).includes('duty_ayt_edb_0001'))   // yalnızca ea/sözel
})

test('12. sınıf: bölüme göre AYT süzülür, TYT hepsi', () => {
    const tyt = cards.filter(c => c.exam === 'TYT').length
    for (const track of ['sayisal', 'ea', 'sozel', 'dil']) {
        const r = filterCardsForProfile(cards, { grade: 12, track })
        assert.equal(r.filter(c => c.exam === 'TYT').length, tyt)
    }
    const sozel = ids(filterCardsForProfile(cards, { grade: 12, track: 'sozel' }))
    assert.ok(sozel.includes('duty_ayt_edb_0001'))
    assert.ok(!sozel.includes('duty_ayt_fiz_0001'))
    const ea = ids(filterCardsForProfile(cards, { grade: 'Mezun', track: 'ea' }))
    assert.ok(ea.includes('duty_ayt_mat_0001') && ea.includes('duty_ayt_edb_0002'))
    const dil = ids(filterCardsForProfile(cards, { grade: 12, track: 'dil' }))
    assert.ok(!dil.some(i => i.startsWith('duty_ayt')))
})

test('erişim yoksa boş liste', () => {
    assert.deepEqual(filterCardsForProfile(cards, { grade: 6 }), [])
    assert.deepEqual(filterCardsForProfile(cards, { grade: 12 }), [])
})

test('minGrade/tracks doğrulaması', () => {
    const base = cards[0]
    assert.ok(validateCards([{ ...base, minGrade: 8 }]).errors.length > 0)
    assert.ok(validateCards([{ ...base, tracks: ['xx'] }]).errors.length > 0)
    assert.equal(validateCards([{ ...base, minGrade: 11, tracks: ['ea'] }]).errors.length, 0)
})

test('havuz dışı favoriler bölüm değişince silinmez', () => {
    const store = new Map()
    const storage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) }
    const all = cards.map(c => c.id)
    const sayisal = filterCardsForProfile(cards, { grade: 12, track: 'sayisal' })
    const f1 = createDutyFeed({ cards: sayisal, knownIds: all, storage })
    f1.addFavorite('duty_ayt_fiz_0001')
    const sozel = filterCardsForProfile(cards, { grade: 12, track: 'sozel' })
    const f2 = createDutyFeed({ cards: sozel, knownIds: all, storage })
    assert.equal(f2.getSnapshot().favoriteCount, 0)           // görünmez
    const f3 = createDutyFeed({ cards: sayisal, knownIds: all, storage })
    assert.equal(f3.getSnapshot().favoriteCount, 1)           // geri gelince duruyor
})
