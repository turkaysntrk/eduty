// composables/useRateLimit.ts
// Kullanım: const { checkLimit } = useRateLimit('contact-form', 3, 60000)
// 60 saniyede max 3 istek

export const useRateLimit = (key: string, maxRequests: number, windowMs: number) => {
    const checkLimit = (): { allowed: boolean; waitSeconds: number } => {
        const storageKey = `rl_${key}`
        const now = Date.now()

        let data: { requests: number[]; } = { requests: [] }

        try {
            const stored = sessionStorage.getItem(storageKey)
            if (stored) data = JSON.parse(stored)
        } catch (e) {}

        // Eski istekleri temizle
        data.requests = data.requests.filter((t: number) => now - t < windowMs)

        if (data.requests.length >= maxRequests) {
            const oldest = data.requests[0]
            const waitMs = windowMs - (now - oldest)
            return { allowed: false, waitSeconds: Math.ceil(waitMs / 1000) }
        }

        data.requests.push(now)

        try {
            sessionStorage.setItem(storageKey, JSON.stringify(data))
        } catch (e) {}

        return { allowed: true, waitSeconds: 0 }
    }

    return { checkLimit }
}