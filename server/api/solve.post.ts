export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const body = await readBody(event) // { imageBase64: "...", question: "isteğe bağlı metin" }

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${config.geminiApiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: 'Bu bir TYT/AYT sorusu. Soruyu çöz, adım adım anlat, sonunda net bir cevap ver.' },
                        { inline_data: { mime_type: 'image/jpeg', data: body.imageBase64 } }
                    ]
                }]
            })
        }
    )

    const data = await response.json()

    if (!response.ok || data.error) {
        console.error('[solve] Gemini hata döndü:', JSON.stringify(data))
        return { answer: 'Cevap alınamadı, tekrar dener misin?' }
    }

    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Cevap alınamadı, tekrar dener misin?'

    return { answer }
})