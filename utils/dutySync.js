/**
 * Favori senkronu (saf JS, Vue/Firebase'den bağımsız → test edilebilir).
 *
 * İlk senkronda yerel (localStorage) ve uzak favoriler birleştirilir, yalnızca
 * yerelde olanlar uzağa gönderilir (taşıma). Sonrasında uzak kayıt "doğru
 * kaynak" olur: açılışta uzaktan yüklenir, her yerel değişiklik uzağa yazılır.
 * İnternet/izin hatasında akış yerel olarak çalışmaya devam eder.
 *
 * remote: { uid, load(): Promise<string[]>, add(id): Promise, remove(id): Promise }
 */
export function startFavoriteSync({ engine, remote, storage = null, onError = () => { } }) {
    let stopped = false
    let applying = false
    let last = engine.favoriteIds()
    const flagKey = `eduty.duty.favSynced.${remote.uid}`

    const safe = (fn, id) => {
        try { Promise.resolve(fn(id)).catch(onError) } catch (e) { onError(e) }
    }

    const pushDiff = () => {
        if (applying || stopped) return
        const cur = engine.favoriteIds()
        const curSet = new Set(cur)
        const lastSet = new Set(last)
        cur.filter(id => !lastSet.has(id)).forEach(id => safe(remote.add, id))
        last.filter(id => !curSet.has(id)).forEach(id => safe(remote.remove, id))
        last = cur
    }

    const unsubscribe = engine.subscribe(pushDiff)

    const ready = (async () => {
        let remoteIds
        try {
            remoteIds = await remote.load()
        } catch (e) { onError(e); return }
        if (stopped) return

        let synced = false
        try { synced = !!storage && storage.getItem(flagKey) === '1' } catch (_) { /* yoksay */ }

        applying = true
        try {
            if (!synced) {
                const local = engine.favoriteIds()
                const remoteSet = new Set(remoteIds)
                engine.mergeFavorites(remoteIds)
                for (const id of local) if (!remoteSet.has(id)) safe(remote.add, id)
                try { if (storage) storage.setItem(flagKey, '1') } catch (_) { /* yoksay */ }
            } else {
                engine.setFavorites(remoteIds)
            }
        } finally {
            applying = false
            last = engine.favoriteIds()
        }
    })()

    return { ready, stop() { stopped = true; unsubscribe() } }
}
