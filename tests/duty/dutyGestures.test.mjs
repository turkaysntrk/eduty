import test from 'node:test'
import assert from 'node:assert/strict'
import { createGestureTracker } from '../../utils/dutyGestures.js'

// Bir hareket dizisini simüle eder: pts = [[x, y, t], ...]; ilk nokta start'tır.
function run(pts, size = { width: 360 }) {
    const g = createGestureTracker()
    g.start(pts[0][0], pts[0][1], pts[0][2], size)
    let last
    for (const [x, y, t] of pts.slice(1)) last = g.move(x, y, t)
    return { last, end: g.end() }
}
// Yavaş (fırlatma değil) düz hareket: step başına 16 ms, 2 px → ~0.12 px/ms
const slow = (dx, dy, n = 40) => Array.from({ length: n + 1 }, (_, i) => [200 + (dx * i) / n, 300 + (dy * i) / n, i * 40])

test('yukarı kaydırma (yeterli mesafe) → next', () => assert.equal(run(slow(0, -90)).end.action, 'next'))
test('aşağı kaydırma (yeterli mesafe) → prev', () => assert.equal(run(slow(0, 90)).end.action, 'prev'))
test('sola kaydırma (yeterli mesafe) → favorite', () => assert.equal(run(slow(-120, 0)).end.action, 'favorite'))
test('sağa kaydırma hiçbir şey yapmaz', () => assert.equal(run(slow(160, 0)).end.action, 'none'))
test('kısa dikey hareket eşik altında kalırsa geçiş yok', () => assert.equal(run(slow(0, -40)).end.action, 'none'))
test('kısa yatay hareket eşik altında kalırsa favori yok', () => assert.equal(run(slow(-50, 0)).end.action, 'none'))

test('hızlı kısa fırlatma (flick) de sayılır', () => {
    const pts = [[200, 300, 0], [200, 290, 8], [200, 275, 16], [200, 262, 24], [200, 255, 32]]   // 45px, ~1.5 px/ms
    assert.equal(run(pts).end.action, 'next')
    const left = [[200, 300, 0], [190, 300, 8], [175, 301, 16], [162, 300, 24], [155, 300, 32]]
    assert.equal(run(left).end.action, 'favorite')
})

test('eksen kilidi: dikey kilitlenmiş harekette yanal sapma favori YAPMAZ', () => {
    // Önce net yukarı (kilit y), sonra sola doğru büyük sapma
    const pts = [[200, 300, 0], [200, 280, 40], [198, 260, 80], [150, 255, 120], [60, 250, 160], [40, 250, 200]]
    const r = run(pts)
    assert.equal(r.last.axis, 'y')
    assert.equal(r.last.dx, 0)
    assert.notEqual(r.end.action, 'favorite')
})

test('eksen kilidi: yatay kilitlenmiş harekette dikey sapma kart GEÇİRMEZ', () => {
    const pts = [[200, 300, 0], [185, 300, 40], [170, 302, 80], [160, 360, 120], [150, 420, 160]]
    const r = run(pts)
    assert.equal(r.last.axis, 'x')
    assert.equal(r.last.dy, 0)
    assert.notEqual(r.end.action, 'next')
    assert.notEqual(r.end.action, 'prev')
})

test('çapraz (45°) hareket eksen kilitlemez ve hiçbir eylem tetiklemez', () => {
    const pts = Array.from({ length: 31 }, (_, i) => [200 - i * 4, 300 - i * 4, i * 40])   // 120px çapraz
    const r = run(pts)
    assert.equal(r.last.axis, null)
    assert.equal(r.end.action, 'none')
})

test('hafif eğik dikey kaydırma (yaklaşık 20°) yine de dikey sayılır', () => {
    const r = run(slow(-30, -90))      // dx/dy ≈ 0.33
    assert.equal(r.last.axis, 'y')
    assert.equal(r.end.action, 'next')
})

test('dokunma (tap) ve 10px altı titreme eylem üretmez', () => {
    assert.equal(run([[100, 100, 0], [102, 101, 30]]).end.action, 'none')
    assert.equal(run([[100, 100, 0], [100, 100, 20]]).end.action, 'none')
})

test('cancel sonrası end eylem üretmez; start öncesi move/end güvenli', () => {
    const g = createGestureTracker()
    assert.deepEqual(g.move(1, 1, 1), { axis: null, dx: 0, dy: 0 })
    assert.equal(g.end().action, 'none')
    g.start(0, 0, 0, { width: 300 }); g.move(0, -100, 50); g.cancel()
    assert.equal(g.end().action, 'none')
    assert.equal(g.isActive(), false)
})

test('geniş kartta favori eşiği kart genişliğiyle ölçeklenir', () => {
    assert.equal(run(slow(-100, 0), { width: 700 }).end.action, 'none')      // 700*0.2 = 140
    assert.equal(run(slow(-150, 0), { width: 700 }).end.action, 'favorite')
})
