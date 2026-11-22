// composables/useDutyFeed.js
// Duty akış motorunu (utils/dutyFeed.js) Vue'ya bağlar ve içerik dosyalarını yükler.
// Kullanım (DutyFeed.vue içinde):
//   const feed = useDutyFeed()
//   onMounted(feed.init)          // localStorage yalnızca istemcide okunur
//   feed.state.value.card ...     // reaktif anlık görüntü
import { shallowRef } from 'vue'
import { createDutyFeed, filterCardsForProfile } from '~/utils/dutyFeed.js'
import { loadDutyCards } from '~/utils/dutyContent.js'
import { startFavoriteSync } from '~/utils/dutySync.js'

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
    let sync = null

    // profile: { grade, track } — kartlar sınıfa ve bölüme göre süzülür.
    // Profil değişince tekrar çağrılabilir (akış yeniden kurulur, favoriler korunur).
    const init = (profile = {}, remote = null) => {
        dispose()
        const all = loadDutyCards()
        const storage = getStorage()
        engine = createDutyFeed({
            cards: filterCardsForProfile(all, profile),
            knownIds: all.map(c => c.id),
            storage
        })
        unsubscribe = engine.subscribe(snap => { state.value = snap })
        state.value = engine.getSnapshot()
        // Favorileri hesapla senkronla (çevrimdışı/izin hatasında yerel çalışmaya devam eder)
        if (remote) {
            sync = startFavoriteSync({ engine, remote, storage, onError: (e) => console.warn('[Duty] favori senkronu:', e && e.code ? e.code : e) })
        }
    }

    const dispose = () => {
        if (sync) sync.stop()
        sync = null
        if (unsubscribe) unsubscribe()
        unsubscribe = null
        engine = null
        state.value = EMPTY
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
