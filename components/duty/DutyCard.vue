<template>
    <article class="duty-card" :data-type="card.type" :aria-label="card.title">
        <div class="duty-card-top">
            <div class="duty-chips">
                <span class="duty-chip duty-chip-exam">{{ card.exam }}</span>
                <span class="duty-chip">{{ card.subject }}</span>
            </div>
            <button type="button" class="duty-heart" :class="{ on: favorite }" data-no-drag
                :aria-pressed="favorite" :aria-label="favorite ? 'Favorilerden çıkar' : 'Favorilere ekle'"
                @click.stop="$emit('toggle-favorite')">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                        d="M12 21s-7.5-4.6-9.6-9.2C1 8.6 2.7 5 6.2 5c2 0 3.2 1 3.8 2 .6-1 1.8-2 3.8-2 3.5 0 5.2 3.6 3.8 6.8C19.5 16.4 12 21 12 21z" />
                </svg>
            </button>
        </div>

        <div class="duty-kicker">{{ typeLabel }} · {{ card.topic }}</div>
        <div class="duty-card-title" role="heading" aria-level="3">{{ card.title }}</div>

        <div ref="bodyEl" class="duty-body" :class="{ scrollable }" :style="{ '--duty-scale': scale }">
            <template v-for="(b, i) in card.blocks" :key="i">

                <p v-if="b.kind === 'text'" class="duty-text">
                    <template v-for="(p, pi) in parts(b.text)" :key="pi">
                        <strong v-if="p.b">{{ p.t }}</strong><template v-else>{{ p.t }}</template>
                    </template>
                </p>

                <ul v-else-if="b.kind === 'list'" class="duty-list">
                    <li v-for="(it, li) in b.items" :key="li">
                        <template v-for="(p, pi) in parts(it)" :key="pi">
                            <strong v-if="p.b">{{ p.t }}</strong><template v-else>{{ p.t }}</template>
                        </template>
                    </li>
                </ul>

                <div v-else-if="b.kind === 'formula'" class="duty-formula">{{ b.text }}</div>

                <div v-else-if="b.kind === 'callout'" class="duty-callout" :data-tone="b.tone || 'tip'">
                    <template v-for="(p, pi) in parts(b.text)" :key="pi">
                        <strong v-if="p.b">{{ p.t }}</strong><template v-else>{{ p.t }}</template>
                    </template>
                </div>

                <div v-else-if="b.kind === 'compare'" class="duty-compare">
                    <div v-for="side in ['left', 'right']" :key="side" class="duty-compare-col"
                        :data-side="side">
                        <div class="duty-compare-title">{{ b[side].title }}</div>
                        <ul>
                            <li v-for="(it, li) in b[side].items" :key="li">{{ it }}</li>
                        </ul>
                    </div>
                </div>

                <div v-else-if="b.kind === 'table'" class="duty-table-wrap">
                    <table class="duty-table">
                        <thead>
                            <tr>
                                <th v-for="(h, hi) in b.headers" :key="hi" scope="col">{{ h }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(row, ri) in b.rows" :key="ri">
                                <th scope="row">{{ row[0] }}</th>
                                <td v-for="(c, ci) in row.slice(1)" :key="ci">{{ c }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <figure v-else-if="b.kind === 'image'" class="duty-figure">
                    <img :src="b.src" :alt="b.alt" loading="lazy" draggable="false" />
                    <figcaption v-if="b.caption">{{ b.caption }}</figcaption>
                </figure>

            </template>
        </div>
    </article>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
    card: { type: Object, required: true },
    favorite: { type: Boolean, default: false }
})
defineEmits(['toggle-favorite'])

const TYPE_LABELS = {
    confusion: 'Sık karıştırılır',
    compare: 'Karşılaştırma',
    exception: 'İstisna',
    tip: 'Sınav ipucu'
}
const typeLabel = computed(() => TYPE_LABELS[props.card.type] || '')

// **kalın** işaretlerini güvenli biçimde (v-html KULLANMADAN) parçalara ayırır.
const parts = (text) =>
    String(text)
        .split(/(\*\*[^*]+\*\*)/g)
        .filter(s => s !== '')
        .map(s => (s.startsWith('**') && s.endsWith('**') && s.length > 4 ? { t: s.slice(2, -2), b: true } : { t: s, b: false }))

// ── Sığdırma: içerik kartın yüksekliğini aşarsa yazıyı kademeli küçült. ──
// Dokunmatik hareketler kart üzerinde kaydırma için kullanıldığından içerik
// iç kaydırma gerektirmeyecek şekilde sığdırılır. En küçük ölçekte de
// sığmazsa (çok nadir) gövde kaydırılabilir olur (.scrollable).
const bodyEl = ref(null)
const scale = ref(1)
const scrollable = ref(false)
const MIN_SCALE = 0.78

const overflows = (el) => el.scrollHeight - el.clientHeight > 1

async function fit() {
    await nextTick()
    const el = bodyEl.value
    if (!el) return
    scrollable.value = false
    scale.value = 1
    await nextTick()
    let s = 1
    while (overflows(el) && s > MIN_SCALE) {
        s = Math.round((s - 0.04) * 100) / 100
        scale.value = s
        await nextTick()
    }
    if (overflows(el)) scrollable.value = true
}

let ro = null
let raf = 0
onMounted(() => {
    fit()
    if (typeof ResizeObserver !== 'undefined' && bodyEl.value) {
        let lastH = bodyEl.value.clientHeight
        ro = new ResizeObserver(() => {
            const h = bodyEl.value ? bodyEl.value.clientHeight : 0
            if (h === lastH) return
            lastH = h
            cancelAnimationFrame(raf)
            raf = requestAnimationFrame(fit)
        })
        ro.observe(bodyEl.value)
    }
})
onBeforeUnmount(() => {
    if (ro) ro.disconnect()
    cancelAnimationFrame(raf)
})
watch(() => props.card.id, fit)
</script>

<style scoped>
/* Not: assets/css/main.css içindeki global etiket kuralları (header/footer/nav/h1-h4,
   body{font-weight:bold}, ul{list-style:none}) bu bileşene sızmasın diye
   bu dosyada yalnızca div/article/ul + sınıf kullanılır; yazı tipi ve kalınlık açıkça verilir. */

.duty-card {
    --accent: #4d94ff;
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    padding: 20px 20px 18px;
    border-radius: 26px;
    background: linear-gradient(160deg, #0f1f45 0%, #0a1632 100%);
    border: 1px solid rgba(77, 148, 255, 0.22);
    box-shadow: 0 18px 44px rgba(0, 8, 32, 0.55), 0 2px 0 rgba(255, 255, 255, 0.03) inset;
    color: #e8eefb;
    font-family: 'DM Sans', 'Segoe UI', sans-serif;
    font-weight: 400;
    line-height: 1.5;
    overflow: hidden;
    user-select: none;
    -webkit-user-select: none;
}

/* İçerik türüne göre farklı vurgu ve yerleşim */
.duty-card[data-type="confusion"] { --accent: #f59e0b; }
.duty-card[data-type="compare"]   { --accent: #38bdf8; }
.duty-card[data-type="exception"] { --accent: #a78bfa; }
.duty-card[data-type="tip"]       { --accent: #10b981; }

.duty-card::before {
    content: '';
    position: absolute;
    left: 20px;
    top: 0;
    width: 44px;
    height: 4px;
    border-radius: 0 0 4px 4px;
    background: var(--accent);
}

.duty-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 14px;
}

.duty-chips { display: flex; flex-wrap: wrap; gap: 6px; min-width: 0; }

.duty-chip {
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.07);
    color: #c7d6f2;
    font-size: 0.74rem;
    font-weight: 600;
    letter-spacing: 0.2px;
    white-space: nowrap;
}
.duty-chip-exam { background: rgba(0, 85, 255, 0.28); color: #cfe0ff; }

.duty-heart {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.05);
    color: #9fb2d6;
    cursor: pointer;
    font: inherit;
    transition: transform 0.18s ease, background 0.2s ease, color 0.2s ease;
    -webkit-tap-highlight-color: transparent;
}
.duty-heart svg { width: 21px; height: 21px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linejoin: round; }
.duty-heart:hover { background: rgba(255, 255, 255, 0.1); }
.duty-heart:active { transform: scale(0.9); }
.duty-heart:focus-visible { outline: 2px solid #4d94ff; outline-offset: 2px; }
.duty-heart.on { color: #ff4d6d; background: rgba(255, 77, 109, 0.14); border-color: rgba(255, 77, 109, 0.4); }
.duty-heart.on svg { fill: currentColor; }

.duty-kicker {
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 6px;
}

.duty-card-title {
    font-size: clamp(1.15rem, 3.6vw, 1.45rem);
    font-weight: 700;
    line-height: 1.25;
    color: #ffffff;
    margin-bottom: 14px;
}
.duty-card[data-type="tip"] .duty-card-title { font-size: clamp(1.25rem, 4vw, 1.6rem); }

/* Gövde: ölçeklenebilir yazı boyutu */
.duty-body {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    font-size: calc(0.96rem * var(--duty-scale, 1));
    display: flex;
    flex-direction: column;
    gap: 0.8em;
}
.duty-body.scrollable {
    overflow-y: auto;
    touch-action: pan-y;
    scrollbar-width: thin;
}
.duty-card[data-type="tip"] .duty-body { justify-content: center; }

.duty-text { margin: 0; color: #dbe5fa; }
.duty-text strong, .duty-list strong, .duty-callout strong { color: #ffffff; font-weight: 700; }

.duty-list { list-style: none; display: flex; flex-direction: column; gap: 0.5em; }
.duty-list li, .duty-compare li {
    position: relative;
    padding-left: 1.1em;
    color: #dbe5fa;
    list-style: none;
}
.duty-list li::before, .duty-compare li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.62em;
    width: 0.42em;
    height: 0.42em;
    border-radius: 50%;
    background: var(--accent);
}

.duty-formula {
    padding: 0.7em 0.9em;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.08);
    font-family: 'Cambria Math', 'STIX Two Math', 'Times New Roman', serif;
    font-size: 1.12em;
    font-weight: 600;
    text-align: center;
    color: #ffffff;
    overflow-wrap: anywhere;
}

.duty-callout {
    padding: 0.7em 0.9em;
    border-radius: 14px;
    border-left: 4px solid var(--accent);
    background: rgba(255, 255, 255, 0.05);
    color: #e8eefb;
}
.duty-callout[data-tone="warning"] { border-left-color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
.duty-callout[data-tone="info"]    { border-left-color: #38bdf8; background: rgba(56, 189, 248, 0.09); }
.duty-callout[data-tone="tip"]     { border-left-color: #10b981; background: rgba(16, 185, 129, 0.09); }

.duty-compare { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7em; }
.duty-compare-col {
    padding: 0.7em 0.8em;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.07);
    min-width: 0;
}
.duty-compare-col[data-side="left"]  { --accent: #38bdf8; }
.duty-compare-col[data-side="right"] { --accent: #a78bfa; }
.duty-compare-title { font-weight: 700; color: var(--accent); margin-bottom: 0.4em; font-size: 0.95em; }
.duty-compare ul { list-style: none; display: flex; flex-direction: column; gap: 0.4em; font-size: 0.92em; }

.duty-table-wrap { overflow: hidden; border-radius: 14px; border: 1px solid rgba(255, 255, 255, 0.09); }
.duty-table { width: 100%; border-collapse: collapse; font-size: 0.88em; table-layout: fixed; }
.duty-table th, .duty-table td {
    padding: 0.5em 0.55em;
    text-align: left;
    vertical-align: top;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    overflow-wrap: anywhere;
    font-weight: 400;
    color: #dbe5fa;
}
.duty-table thead th { background: rgba(77, 148, 255, 0.16); color: #ffffff; font-weight: 700; }
.duty-table tbody th { color: var(--accent); font-weight: 700; width: 24%; }
.duty-table tbody tr:last-child th, .duty-table tbody tr:last-child td { border-bottom: 0; }

.duty-figure { margin: 0; text-align: center; }
.duty-figure img {
    max-width: 100%;
    max-height: 120px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.04);
    -webkit-user-drag: none;
}
.duty-figure figcaption { margin-top: 0.3em; font-size: 0.8em; color: #9fb2d6; }

@media (max-width: 420px) {
    .duty-card { padding: 18px 16px 16px; border-radius: 22px; }
    .duty-compare { gap: 0.5em; }
}
</style>
