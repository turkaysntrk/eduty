// middleware/auth.global.ts
// Tüm sayfalarda çalışır, korumalı sayfalara giriş kontrolü yapar

export default defineNuxtRouteMiddleware(async (to) => {
    // Sadece client tarafında çalış
    if (process.server) return

    // Korumalı sayfalar
    const protectedRoutes = [
        '/dashboard',
        '/dashboard-teacher',
        '/dashboard-bagisci',
        '/dashboard-admin',
        '/meets'
    ]

    const isProtected = protectedRoutes.some(route => to.path.startsWith(route))
    if (!isProtected) return

    // Firebase auth kontrolü
    const { $auth } = useNuxtApp()

    // Auth yüklenene kadar bekle
    await new Promise((resolve) => {
        const unsubscribe = $auth.onAuthStateChanged((user) => {
            unsubscribe()
            resolve()
        })
    })

    const user = $auth.currentUser

    if (!user) {
        return navigateTo('/kayit-giris')
    }
})