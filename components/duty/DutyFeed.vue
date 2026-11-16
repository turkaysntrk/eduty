<template>
    <section class="duty-root" aria-label="Duty kart akışı">
        <div class="duty-top">
            <div class="duty-brand">
                <span class="duty-brand-mark" role="heading" aria-level="2">Duty</span>
                <span v-if="state.total" class="duty-counter" aria-live="off">{{ state.index + 1 }} / {{ state.total }}</span>
            </div>
            <div class="duty-modes" role="group" aria-label="Akış seçimi">
                <button type="button" :class="{ active: state.mode === 'all' }" @click="changeMode('all')">Tümü</button>
                <button type="button" :class="{ active: state.mode === 'favorites' }"
                    :disabled="state.mode !== 'favorites' && state.favoriteCount === 0"
                    @click="changeMode('favorites')">
                    ♥ Favoriler<span class="duty-mode-count">{{ state.favoriteCount }}</span>
                </button>
            </div>
        </div>

        <div ref="stageEl" class="duty-stage" @pointerdown="onPointerDown" @pointermove="onPointerMove"
            @pointerup="onPointerUp" @pointercancel="onPointerCancel" @wheel.prevent="onWheel">

            <div v-if="!state.ready" class="duty-empty">Yükleniyor…</div>
            <div v-else-if="!state.card" class="duty-empty">
                {{ state.cardCount === 0 ? 'Henüz Duty içeriği yok.' : 'Gösterilecek kart bulunamadı.' }}
            </div>

            <Transition :name="transitionName">
                <div v-if="state.card" :key="state.card.id" class="duty-slot">
                    <div class="duty-drag" :class="{ settle }" :style="dragStyle">
                        <DutyCard :card="state.card" :favorite="state.isFavorite"
                            @toggle-favorite="onHeartClick" />
                    </div>
                </div>
            </Transition>

            <!-- Sola kaydırmada beliren ipucu kalbi -->
            <div class="duty-hint-heart" :style="{ opacity: heartHintOpacity }" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                    <path
                        d="M12 21s-7.5-4.6-9.6-9.2C1 8.6 2.7 5 6.2 5c2 0 3.2 1 3.8 2 .6-1 1.8-2 3.8-2 3.5 0 5.2 3.6 3.8 6.8C19.5 16.4 12 21 12 21z" />
                </svg>
            </div>

            <!-- Favori animasyonu -->
            <div v-if="burst" :key="burstKey" class="duty-burst" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                    <path
                        d="M12 21s-7.5-4.6-9.6-9.2C1 8.6 2.7 5 6.2 5c2 0 3.2 1 3.8 2 .6-1 1.8-2 3.8-2 3.5 0 5.2 3.6 3.8 6.8C19.5 16.4 12 21 12 21z" />
                </svg>
            </div>

            <!-- Fare kullanıcıları için ileri/geri düğmeleri -->
            <div class="duty-arrows" data-no-drag>
                <button type="button" data-no-drag :disabled="!state.canPrev" aria-label="Önceki kart"
                    @click="go('prev')">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6" /></svg>
                </button>
                <button type="button" data-no-drag :disabled="!state.canNext" aria-label="Sonraki kart"
                    @click="go('next')">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
                </button>
            </div>
        </div>

        <p class="duty-hint">
            <template v-if="isCoarse">Yukarı kaydır: sonraki · Aşağı: önceki · Sola: favori</template>
            <template v-else>↓ / ↑ ya da fare tekerleği: gez · ← ya da sola sürükle: favori</template>
        </p>

        <div class="duty-sr" aria-live="polite">{{ state.card ? state.card.title : '' }}</div>
    </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { createGestureTracker } from '~/utils/dutyGestures.js'

const feed = useDutyFeed()
const state = feed.state

// ── Görünüm durumu ──
const stageEl = ref(null)
const transitionName = ref('duty-next')
const drag = ref({ x: 0, y: 0 })
const dragging = ref(false)
const settle = ref(false)          // true iken dragStyle geçişli (yaylanma)
const burst = ref(false)
const burstKey = ref(0)
const isCoarse = ref(false)
let reduceMotion = false

const tracker = createGestureTracker()
let pointerId = null
let timers = []
let lastNav = 0
let wheelAcc = 0
let wheelLockUntil = 0
let burstTimer = null

const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id }
const clearTimers = () => { timers.forEach(clearTimeout); timers = [] }

const dragStyle = computed(() => {
    const { x, y } = drag.value
    if (!x && !y) return null
    const rot = reduceMotion ? 0 : Math.max(-6, Math.min(6, x / 28))
    return { transform: `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg)` }
})

const heartHintOpacity = computed(() => (dragging.value && drag.value.x < 0 ? Math.min(1, -drag.value.x / 90) : 0))

// ── Navigasyon ──
function go(dir) {
    const t = Date.now()
    if (t - lastNav < 240) return false          // tuş tekrarı / çift tetiklemeyi sınırla
    lastNav = t
    clearTimers()
    transitionName.value = dir === 'next' ? 'duty-next' : 'duty-prev'
    drag.value = { x: 0, y: 0 }
    settle.value = false
    const moved = dir === 'next' ? feed.next() : feed.prev()
    if (!moved) bounce(dir)
    return moved
}

// Hareket edilemediğinde (ilk kartta geri / tek kartta ileri) küçük bir geri tepme
function bounce(dir) {
    if (reduceMotion) return
    settle.value = true
    drag.value = { x: 0, y: dir === 'next' ? -22 : 22 }
    later(() => { drag.value = { x: 0, y: 0 } }, 130)
    later(() => { settle.value = false }, 480)
}

function playBurst() {
    burstKey.value++
    burst.value = true
    clearTimeout(burstTimer)
    burstTimer = setTimeout(() => { burst.value = false }, 900)   // clearTimers() kalp animasyonunu kesmesin
}

// Sola kaydırma/ok tuşu: yalnızca EKLER (zaten favoriyse ikinci kez kaydetmez).
function favoriteByGesture() {
    const card = state.value.card
    if (!card) return
    feed.addFavorite(card.id)
    playBurst()
    if (reduceMotion) { drag.value = { x: 0, y: 0 }; return }
    settle.value = true
    drag.value = { x: -96, y: 0 }                         // kart kısa süre sola gider
    later(() => { drag.value = { x: 0, y: 0 } }, 230)     // ve yumuşakça yerine döner
    later(() => { settle.value = false }, 760)
}

// Kalp düğmesi: ekle/çıkar
function onHeartClick() {
    const card = state.value.card
    if (!card) return
    const nowFav = feed.toggleFavorite(card.id)
    if (nowFav) playBurst()
}

function changeMode(mode) {
    clearTimers()
    drag.value = { x: 0, y: 0 }
    settle.value = false
    transitionName.value = 'duty-next'
    feed.setMode(mode)
}

// ── Pointer (dokunmatik + fare) ──
function onPointerDown(e) {
    if (!state.value.card) return
    if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return
    if (e.target.closest && e.target.closest('[data-no-drag]')) return
    if (pointerId !== null) return
    clearTimers()
    settle.value = false
    pointerId = e.pointerId
    try { stageEl.value.setPointerCapture(e.pointerId) } catch (_) { /* yoksay */ }
    tracker.start(e.clientX, e.clientY, e.timeStamp, { width: stageEl.value ? stageEl.value.clientWidth : 0 })
}

function onPointerMove(e) {
    if (e.pointerId !== pointerId) return
    const r = tracker.move(e.clientX, e.clientY, e.timeStamp)
    if (!r.axis) return
    dragging.value = true
    if (r.axis === 'y') {
        // İlk kartta aşağı / tek kartta yukarı çekerken direnç hissi
        const blocked = (r.dy > 0 && !state.value.canPrev) || (r.dy < 0 && !state.value.canNext)
        const k = blocked ? 0.2 : 0.55
        drag.value = { x: 0, y: Math.max(-180, Math.min(180, r.dy * k)) }
    } else {
        // Sola tam takip; sağa güçlü direnç (sağa kaydırma bir şey yapmaz)
        const x = r.dx < 0 ? Math.max(-150, r.dx) : Math.min(24, r.dx * 0.15)
        drag.value = { x, y: 0 }
    }
}

function endPointer(e) {
    if (e.pointerId !== pointerId) return null
    try { stageEl.value.releasePointerCapture(e.pointerId) } catch (_) { /* yoksay */ }
    pointerId = null
    dragging.value = false
    return true
}

function onPointerUp(e) {
    if (!endPointer(e)) return
    const res = tracker.end()
    if (res.action === 'next') { go('next'); return }
    if (res.action === 'prev') { go('prev'); return }
    if (res.action === 'favorite') { favoriteByGesture(); return }
    // Eşik aşılmadı → yerine yaylan
    settle.value = true
    drag.value = { x: 0, y: 0 }
    later(() => { settle.value = false }, 400)
}

function onPointerCancel(e) {
    if (!endPointer(e)) return
    tracker.cancel()
    settle.value = true
    drag.value = { x: 0, y: 0 }
    later(() => { settle.value = false }, 400)
}

// ── Fare tekerleği: tek harekette tek kart ──
function onWheel(e) {
    const t = Date.now()
    if (t < wheelLockUntil) return
    if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return   // yatay izleme dokunuşları kart değiştirmesin
    wheelAcc += e.deltaY
    if (Math.abs(wheelAcc) < 40) return
    const dir = wheelAcc > 0 ? 'next' : 'prev'
    wheelAcc = 0
    wheelLockUntil = t + 550                               // eylemsizlik (inertia) tekrarlarını yut
    go(dir)
}

// ── Klavye ──
function onKeydown(e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return
    const el = e.target
    const tag = el && el.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (el && el.isContentEditable)) return
    switch (e.key) {
        case 'ArrowDown':
        case 'PageDown':
            e.preventDefault(); go('next'); break
        case 'ArrowUp':
        case 'PageUp':
            e.preventDefault(); go('prev'); break
        case ' ':
            if (tag === 'BUTTON' || tag === 'A') return    // odaklı düğmeyi etkinleştirsin
            e.preventDefault(); go('next'); break
        case 'ArrowLeft':
            e.preventDefault(); favoriteByGesture(); break
    }
}

onMounted(() => {
    feed.init()
    isCoarse.value = window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : false
    reduceMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false
    window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown)
    clearTimers()
    clearTimeout(burstTimer)
    tracker.cancel()
    feed.dispose()
})
</script>

<style scoped>
.duty-root {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 560px;
    margin: 0 auto;
    /* .main-content masaüstünde 20px üst + 40px alt, mobilde 70px üst + 20px alt boşluk bırakır */
    height: calc(100vh - 70px);
    height: calc(100dvh - 70px);
    min-height: 500px;
    max-height: 860px;
    font-family: 'DM Sans', 'Segoe UI', sans-serif;
    font-weight: 400;
    color: #e8eefb;
}

.duty-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    padding: 0 4px 12px;
}
.duty-brand { display: flex; align-items: baseline; gap: 10px; }
.duty-brand-mark {
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: 1px;
    color: #4d94ff;
    text-shadow: 0 0 12px rgba(77, 148, 255, 0.45);
}
.duty-counter { font-size: 0.82rem; font-weight: 600; color: #9fb2d6; }

.duty-modes {
    display: inline-flex;
    padding: 3px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.08);
}
.duty-modes button {
    font: inherit;
    font-size: 0.82rem;
    font-weight: 600;
    padding: 6px 14px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: #9fb2d6;
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease;
}
.duty-modes button.active { background: #0055ff; color: #ffffff; }
.duty-modes button:disabled { opacity: 0.45; cursor: default; }
.duty-modes button:focus-visible { outline: 2px solid #4d94ff; outline-offset: 2px; }
.duty-mode-count { margin-left: 6px; opacity: 0.8; }

/* Sahne: kartlar üst üste (absolute) durur, geçiş animasyonu için */
.duty-stage {
    position: relative;
    flex: 1;
    min-height: 0;
    touch-action: none;               /* dokunmatik hareketleri biz yönetiriz */
    overscroll-behavior: contain;
    user-select: none;
    -webkit-user-select: none;
    cursor: grab;
}
.duty-stage:active { cursor: grabbing; }

.duty-slot { position: absolute; inset: 0; padding: 2px 2px 6px; }
.duty-drag { width: 100%; height: 100%; will-change: transform; }
.duty-drag.settle { transition: transform 0.34s cubic-bezier(0.22, 1.2, 0.36, 1); }

/* Kart geçiş animasyonları (yön: sonraki → yukarı çıkar; önceki → aşağı iner) */
.duty-next-enter-active, .duty-next-leave-active,
.duty-prev-enter-active, .duty-prev-leave-active {
    transition: transform 0.38s cubic-bezier(0.22, 0.8, 0.3, 1), opacity 0.3s ease;
}
.duty-next-enter-from { transform: translateY(46px) scale(0.96); opacity: 0; }
.duty-next-leave-to   { transform: translateY(-46px) scale(0.96); opacity: 0; }
.duty-prev-enter-from { transform: translateY(-46px) scale(0.96); opacity: 0; }
.duty-prev-leave-to   { transform: translateY(46px) scale(0.96); opacity: 0; }
.duty-next-leave-active, .duty-prev-leave-active { pointer-events: none; }

.duty-empty {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: #9fb2d6;
    text-align: center;
    padding: 20px;
}

/* Sola kaydırma ipucu kalbi (kartın sağ kenarında belirir) */
.duty-hint-heart {
    position: absolute;
    right: 14px;
    top: 50%;
    width: 44px;
    height: 44px;
    margin-top: -22px;
    pointer-events: none;
    transition: opacity 0.12s linear;
    opacity: 0;
}
.duty-hint-heart svg { width: 100%; height: 100%; fill: rgba(255, 77, 109, 0.85); }

.duty-burst {
    position: absolute;
    left: 50%;
    top: 46%;
    width: 96px;
    height: 96px;
    margin: -48px 0 0 -48px;
    pointer-events: none;
    z-index: 5;
    animation: duty-burst 0.85s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
}
.duty-burst svg { width: 100%; height: 100%; fill: #ff4d6d; filter: drop-shadow(0 6px 18px rgba(255, 77, 109, 0.55)); }

@keyframes duty-burst {
    0%   { transform: scale(0.3); opacity: 0; }
    30%  { transform: scale(1.15); opacity: 1; }
    60%  { transform: scale(1); opacity: 1; }
    100% { transform: scale(1.25) translateY(-18px); opacity: 0; }
}

/* Masaüstü ileri/geri düğmeleri: yalnızca fareyle kullanılan geniş ekranlarda görünür */
.duty-arrows {
    position: absolute;
    right: -58px;
    top: 50%;
    transform: translateY(-50%);
    display: none;
    flex-direction: column;
    gap: 10px;
}
.duty-arrows button {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.06);
    color: #cfe0ff;
    display: grid;
    place-items: center;
    cursor: pointer;
    font: inherit;
    transition: background 0.2s ease, opacity 0.2s ease;
}
.duty-arrows button:hover:not(:disabled) { background: rgba(255, 255, 255, 0.14); }
.duty-arrows button:disabled { opacity: 0.3; cursor: default; }
.duty-arrows button:focus-visible { outline: 2px solid #4d94ff; outline-offset: 2px; }
.duty-arrows svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
@media (hover: hover) and (pointer: fine) and (min-width: 760px) {
    .duty-arrows { display: flex; }
}

.duty-hint {
    margin: 10px 0 0;
    text-align: center;
    font-size: 0.76rem;
    font-weight: 500;
    color: #7f93bb;
}

.duty-sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
}

@media (max-width: 1024px) {
    /* Mobilde .main-content üstte 70px, altta 20px boşluk bırakır */
    .duty-root { height: calc(100vh - 100px); height: calc(100dvh - 100px); }
}

@media (prefers-reduced-motion: reduce) {
    .duty-next-enter-active, .duty-next-leave-active,
    .duty-prev-enter-active, .duty-prev-leave-active { transition: opacity 0.2s ease; }
    .duty-next-enter-from, .duty-next-leave-to,
    .duty-prev-enter-from, .duty-prev-leave-to { transform: none; }
    .duty-drag.settle { transition: none; }
    .duty-burst { animation-duration: 0.01s; }
}
</style>
