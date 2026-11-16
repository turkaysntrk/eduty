/**
 * =====================================================
 * EDUTY — DUTY KAYDIRMA ALGILAYICI (utils/dutyGestures.js)
 * =====================================================
 * DOM'dan bağımsız, saf JS. Pointer olaylarından gelen (x, y, zaman)
 * değerlerini yorumlar:
 *   - İlk ~10px hareketten sonra ekseni KİLİTLER (dikey ya da yatay).
 *     Çapraz/belirsiz hareketlerde eksen seçilmez; kilitlendikten sonra
 *     diğer eksendeki hareket yok sayılır. Böylece dikey kaydırma yanlışlıkla
 *     favorileme yapmaz, yatay kaydırma yanlışlıkla kart değiştirmez.
 *   - Bırakınca: 'next' | 'prev' | 'favorite' | 'none' döndürür.
 *
 * Yön kuralları (parmak hareketi):
 *   yukarı  → next      aşağı → prev      sola → favorite      sağa → none
 */

export const GESTURE_DEFAULTS = {
    lockDistance: 10,        // eksen kilidi için gereken minimum hareket (px)
    axisRatio: 1.25,         // baskın eksen, diğerinin en az bu kadar katı olmalı
    navDistance: 64,         // dikey geçiş için gereken mesafe (px)
    favoriteDistance: 90,    // sola favori için minimum mesafe (px)
    favoriteWidthRatio: 0.2, // ya da kart genişliğinin bu oranı (büyük olan)
    flingVelocity: 0.5,      // hızlı fırlatma eşiği (px/ms)
    flingMinDistance: 28,    // fırlatmanın sayılması için minimum mesafe (px)
    velocityWindowMs: 100    // hız hesabında bakılan son süre
}

export function createGestureTracker(options = {}) {
    const o = { ...GESTURE_DEFAULTS, ...options }
    let active = false
    let axis = null
    let sx = 0, sy = 0, st = 0
    let dx = 0, dy = 0
    let width = 0
    let samples = []

    function reset() {
        active = false; axis = null
        dx = 0; dy = 0; samples = []
    }

    function velocity() {
        if (samples.length < 2) return { vx: 0, vy: 0 }
        const last = samples[samples.length - 1]
        let first = samples[0]
        for (const s of samples) {
            if (last.t - s.t <= o.velocityWindowMs) { first = s; break }
        }
        const dt = last.t - first.t
        if (dt <= 0) return { vx: 0, vy: 0 }
        return { vx: (last.x - first.x) / dt, vy: (last.y - first.y) / dt }
    }

    return {
        start(x, y, t, size = {}) {
            reset()
            active = true
            sx = x; sy = y; st = t
            width = size.width || 0
            samples = [{ x, y, t }]
        },

        /** @returns {{axis: 'x'|'y'|null, dx: number, dy: number}} eksen kilitlenmeden dx/dy 0 döner */
        move(x, y, t) {
            if (!active) return { axis: null, dx: 0, dy: 0 }
            const rawX = x - sx
            const rawY = y - sy
            samples.push({ x, y, t })
            if (samples.length > 12) samples.shift()

            if (axis === null) {
                const ax = Math.abs(rawX), ay = Math.abs(rawY)
                if (Math.max(ax, ay) >= o.lockDistance) {
                    if (ay >= ax * o.axisRatio) axis = 'y'
                    else if (ax >= ay * o.axisRatio) axis = 'x'
                    // aksi halde: çapraz → henüz kilitleme
                }
            }
            if (axis === 'y') { dx = 0; dy = rawY }
            else if (axis === 'x') { dx = rawX; dy = 0 }
            else { dx = 0; dy = 0 }
            return { axis, dx, dy }
        },

        /** @returns {{action: 'next'|'prev'|'favorite'|'none', axis, dx, dy}} */
        end() {
            if (!active) return { action: 'none', axis: null, dx: 0, dy: 0 }
            const { vx, vy } = velocity()
            const out = { action: 'none', axis, dx, dy }

            if (axis === 'y') {
                const dist = Math.abs(dy)
                const fling = dist >= o.flingMinDistance && Math.abs(vy) >= o.flingVelocity
                const goes = dist >= o.navDistance || fling
                // Hızlı fırlatmada yön, son hızın yönüne göre; yavaşta toplam harekete göre.
                const dir = fling ? Math.sign(vy) : Math.sign(dy)
                if (goes && dir < 0) out.action = 'next'
                else if (goes && dir > 0) out.action = 'prev'
            } else if (axis === 'x') {
                const need = Math.max(o.favoriteDistance, width * o.favoriteWidthRatio)
                const dist = -dx
                const fling = dx < 0 && dist >= o.flingMinDistance && vx <= -o.flingVelocity
                if (dx < 0 && (dist >= need || fling)) out.action = 'favorite'
            }
            reset()
            return out
        },

        cancel() { reset() },
        isActive: () => active,
        getAxis: () => axis
    }
}
