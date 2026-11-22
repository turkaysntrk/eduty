// content/duty/*.json dosyalarını derleme zamanında yükler (Duty akışı + admin paneli ortak kullanır).
import { validateCards } from '~/utils/dutyFeed.js'

const contentFiles = import.meta.glob('../content/duty/*.json', { eager: true, import: 'default' })

export function loadDutyCards() {
    const raw = Object.keys(contentFiles).sort().flatMap(k => contentFiles[k])
    const { cards, errors } = validateCards(raw)
    if (errors.length && import.meta.dev) {
        console.warn('[Duty] İçerik doğrulama uyarıları:\n' + errors.join('\n'))
    }
    return cards
}
