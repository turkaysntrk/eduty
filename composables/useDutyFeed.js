// composables/useDutyFeed.js
// Duty akış motorunu (utils/dutyFeed.js) Vue'ya bağlar ve içerik dosyalarını yükler.
// Kullanım (DutyFeed.vue içinde):
//   const feed = useDutyFeed()
//   onMounted(feed.init)          // localStorage yalnızca istemcide okunur
//   feed.state.value.card ...     // reaktif anlık görüntü
import { shallowRef } from 'vue'
import { createDutyFeed, validateCards } from '~/utils/dutyFeed.js'

// content/duty/*.json dosyaları derleme zamanında pakete dahil edilir (yeni bağımlılık yok).
// İleride Firestore'a geçilirse yalnızca bu yükleme kısmı değişir.
const contentFiles = import.meta.glob('../content/duty/*.json', { eager: true, import: 'default' })

function loadCards() {
    const raw = Object.keys(contentFiles).sort().flatMap(k => contentFiles[k])
    const { cards, errors } = validateCards(raw)
    if (errors.length && import.meta.dev) {
        console.warn('[Duty] İçerik doğrulama uyarıları:\n' + errors.join('\n'))
    }
    return cards
}

function getStorage() {
    try {
        const s = window.localStorage
        const k = '__duty_probe__'
        s.setItem(k, '1'); s.removeItem(k)
        return s
    } catch (e) {
        return null   // özel mod / devre dışı: akış çalışır, sadece kalıcılık olmaz
    }
}

const EMPTY = Object.freeze({
    ready: false, mode: 'all', card: null, index: 0, total: 0, isFavorite: false,
    favoriteCount: 0, seenCount: 0, cardCount: 0, canPrev: false, canNext: false
})

export const useDutyFeed = () => {
    const state = shallowRef(EMPTY)
    let engine = null
    let unsubscribe = null

    const init = () => {
        if (engine) return
        engine = createDutyFeed({ cards: loadCards(), storage: getStorage() })
        unsubscribe = engine.subscribe(snap => { state.value = snap })
        state.value = engine.getSnapshot()
    }

    const dispose = () => {
        if (unsubscribe) unsubscribe()
        unsubscribe = null
        engine = null
    }

    return {
        state,
        init,
        dispose,
        next: () => (engine ? engine.next() : false),
        prev: () => (engine ? engine.prev() : false),
        addFavorite: (id) => (engine ? engine.addFavorite(id) : false),
        toggleFavorite: (id) => (engine ? engine.toggleFavorite(id) : false),
        setMode: (mode) => (engine ? engine.setMode(mode) : false)
    }
}
