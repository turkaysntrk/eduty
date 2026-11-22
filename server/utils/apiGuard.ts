// server/utils/apiGuard.ts
// /api/solve için koruma katmanı: kimlik doğrulama, hız sınırı ve girdi boyutu.
// Barındırma ortamından bağımsızdır (Vercel/Netlify/Node). Firebase Admin SDK
// gerekmez: kimlik jetonu (ID token), Google'ın herkese açık anahtarlarıyla doğrulanır.
import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { JWTVerifyGetKey } from 'jose'

const GOOGLE_JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'

let remoteKeys: JWTVerifyGetKey | null = null
const defaultKeys = (): JWTVerifyGetKey => {
    if (!remoteKeys) remoteKeys = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL))
    return remoteKeys
}

/** Firebase ID token'ı doğrular; geçerliyse kullanıcının uid'ini döndürür, değilse hata fırlatır. */
export async function verifyFirebaseIdToken(token: string, projectId: string, getKey?: JWTVerifyGetKey): Promise<string> {
    if (!token || !projectId) throw new Error('missing token or projectId')
    const { payload } = await jwtVerify(token, getKey || defaultKeys(), {
        issuer: `https://securetoken.google.com/${projectId}`,
        audience: projectId,
        algorithms: ['RS256']
    })
    if (!payload.sub || typeof payload.sub !== 'string') throw new Error('token has no subject')
    return payload.sub
}

export function bearerToken(authHeader: string | undefined | null): string {
    if (!authHeader) return ''
    const m = /^Bearer\s+(.+)$/i.exec(authHeader.trim())
    return m ? m[1] : ''
}

// ── Hız sınırı (bellek içi; her sunucu örneği için ayrı) ──
// Not: sunucusuz ortamda örnekler arasında paylaşılmaz. Kesin günlük kota için
// Firestore + Admin SDK ya da Redis gerekir; bu katman kötüye kullanımı ciddi ölçüde sınırlar.
export interface RateRule { max: number; windowMs: number; message: string }

export function createRateLimiter(rules: RateRule[], now: () => number = Date.now) {
    const hits = new Map<string, number[]>()
    const longest = Math.max(...rules.map(r => r.windowMs))
    let lastSweep = now()

    return {
        /** İzin varsa null; sınır aşıldıysa kullanıcıya gösterilecek mesaj + bekleme süresi (sn). */
        check(key: string): { message: string; retryAfter: number } | null {
            const t = now()
            if (t - lastSweep > 60_000) {              // eski kayıtları ara sıra temizle
                for (const [k, arr] of hits) {
                    const fresh = arr.filter(x => t - x < longest)
                    if (fresh.length) hits.set(k, fresh); else hits.delete(k)
                }
                lastSweep = t
            }
            const arr = (hits.get(key) || []).filter(x => t - x < longest)
            for (const r of rules) {
                const inWin = arr.filter(x => t - x < r.windowMs)
                if (inWin.length >= r.max) {
                    const retryAfter = Math.max(1, Math.ceil((inWin[0] + r.windowMs - t) / 1000))
                    hits.set(key, arr)
                    return { message: r.message, retryAfter }
                }
            }
            arr.push(t)
            hits.set(key, arr)
            return null
        }
    }
}

// ── Girdi boyut sınırları ──
export const MAX_IMAGE_CHARS = 7_000_000       // ≈ 5 MB'lık görsel (base64)
export const MAX_TEXT_CHARS = 20_000

/** Sınırı aşan alan varsa hata mesajı döndürür, yoksa null. */
export function checkBodyLimits(body: any): string | null {
    if (!body || typeof body !== 'object') return 'Geçersiz istek.'
    for (const k of ['imageBase64', 'studentSolutionImageBase64']) {
        const v = body[k]
        if (v !== undefined && v !== null && (typeof v !== 'string' || v.length > MAX_IMAGE_CHARS)) {
            return 'Görsel çok büyük. Lütfen daha küçük bir fotoğraf yükle.'
        }
    }
    for (const k of ['previousAnswer', 'studentSolutionText']) {
        const v = body[k]
        if (v !== undefined && v !== null && (typeof v !== 'string' || v.length > MAX_TEXT_CHARS)) {
            return 'Metin çok uzun.'
        }
    }
    if (body.previousHints !== undefined) {
        const ok = Array.isArray(body.previousHints) && body.previousHints.length <= 5 &&
            body.previousHints.every((h: unknown) => typeof h === 'string' && h.length <= MAX_TEXT_CHARS)
        if (!ok) return 'Geçersiz istek.'
    }
    return null
}
