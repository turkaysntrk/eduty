// composables/useSanitize.ts
// Kullanıcı inputlarından tehlikeli karakterleri temizler

export const useSanitize = () => {

    // HTML karakterlerini escape et — XSS önler
    const sanitizeText = (input: string): string => {
        if (!input || typeof input !== 'string') return ''
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;')
            .trim()
            .slice(0, 1000) // max 1000 karakter
    }

    // E-posta doğrula
    const validateEmail = (email: string): boolean => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return re.test(email) && email.length <= 254
    }

    // Sayı doğrula (puan, ücret vs)
    const validateNumber = (value: any, min = 0, max = 99999): boolean => {
        const num = parseInt(value)
        return !isNaN(num) && num >= min && num <= max
    }

    // URL doğrula
    const validateUrl = (url: string): boolean => {
        try {
            const u = new URL(url)
            return ['http:', 'https:'].includes(u.protocol)
        } catch {
            return false
        }
    }

    // İsim doğrula (sadece harf, boşluk, tire)
    const validateName = (name: string): boolean => {
        return /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s\-'.]{2,100}$/.test(name)
    }

    return {
        sanitizeText,
        validateEmail,
        validateNumber,
        validateUrl,
        validateName
    }
}