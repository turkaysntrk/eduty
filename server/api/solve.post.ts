// ─────────────────────────────────────────────────────────────
// Mod bazlı system prompt'lar.
// Yeni bir mod eklemek istersen buraya bir anahtar daha eklemen yeterli.
// ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPTS_BASE = {
    fast: [
        'Bu bir TYT/AYT sorusudur. Soruyu HIZLI ÇÖZÜM modunda çöz:',
        '- Cevabı mümkün olduğunca kısa ve net tut, gereksiz uzun açıklama yapma.',
        '- Sadece temel çözüm adımlarını göster, ekstra yorum ekleme.',
        '- Sonunda net bir cevap ver.',
        'Amaç: öğrencinin hızlıca kontrol edebileceği, sade bir çözüm.'
    ].join('\n'),

    detailed: [
        'Bu bir TYT/AYT sorusudur. Soruyu DETAYLI ÇÖZÜM modunda, bir öğretmen gibi çöz:',
        '- Soruyu dikkatle analiz et.',
        '- Çözüm yöntemini adım adım açıkla.',
        '- Neden bu yöntemin kullanıldığını belirt.',
        '- Sorudaki kritik noktalara ve dikkat edilmesi gereken yerlere değin.',
        '- Mümkünse sonucu tekrar kontrol et.',
        '- Amaç öğrencinin konuyu gerçekten anlaması; sadece cevabı vermek yetmez.',
        'Sonunda net bir final cevabı ver.'
    ].join('\n')
}

// ─────────────────────────────────────────────────────────────
// "Eduty formatı" — öğretici, düzenli cevap yapısı.
// Her iki moda da eklenir; model bunu ZORUNLU değil, uygun olduğunda kullanır.
// Markdown başlıkları (##) kullanılır çünkü frontend zaten marked + DOMPurify
// ile markdown'ı render edip .ai-answer-box h1/h2/h3 stiliyle gösteriyor.
// ─────────────────────────────────────────────────────────────
const EDUTY_FORMAT_GUIDE = [
    '',
    'Eduty formatı (yalnızca konuyu gerçekten anlatmaya değer, öğretici bir soruysa kullan):',
    '## Konu Başlığı',
    'Cevabın hangi konuya ait olduğunu kısa ve net şekilde belirt (ör. "Newton\'un Hareket Yasaları").',
    '## Kritik Bilgi',
    'Öğrencinin mutlaka bilmesi gereken ana bilgiyi kısa ve belirgin şekilde ver. Gereksiz uzatma.',
    '## Dikkat Edilmesi Gereken Yer',
    'Bu konuda sık yapılan hataları, karıştırılan noktaları veya sınavda önemli olabilecek ayrıntıları, öğrencinin seviyesine uygun ve anlaşılır şekilde belirt.',
    '',
    'Bu başlıkları ZORUNLU tutma: soru çok kısa/basit ise (tek işlem, doğrudan hesaplama, evet/hayır gibi) başlık açma, sadece doğrudan ve sade bir çözüm ver. Yapıyı yalnızca gerçekten faydalı olduğu durumlarda kullan.'
].join('\n')

const SYSTEM_PROMPTS = {
    fast: SYSTEM_PROMPTS_BASE.fast + '\n' + EDUTY_FORMAT_GUIDE,
    detailed: SYSTEM_PROMPTS_BASE.detailed + '\n' + EDUTY_FORMAT_GUIDE
}

// ─────────────────────────────────────────────────────────────
// "Daha basit anlat" için ayrı bir prompt.
// Görsel gerekmez: var olan cevap metnini girdi olarak alıp
// aynı Gemini modeliyle daha sade bir dille yeniden yazdırır.
// ─────────────────────────────────────────────────────────────
const SIMPLIFY_PROMPT = [
    'Aşağıda bir öğrenciye verilmiş bir soru çözümü/açıklaması var.',
    'Bunu, konuyu hiç bilmeyen veya zorlanan bir öğrencinin kolayca anlayabileceği şekilde,',
    'günlük dille, gerekirse basit bir örnek veya benzetme kullanarak yeniden anlat.',
    'Ders kitabı dilinden kaçın, sanki karşısında oturmuş sözlü anlatıyormuşsun gibi yaz.',
    'Gereksiz uzatma; sade ve anlaşılır ol. Sonunda net bir özet/cevap ver.'
].join('\n')

// ─────────────────────────────────────────────────────────────
// "İpucu" sistemi — cevabı DOĞRUDAN vermeyen, kademeli yönlendirme.
// 3 seviye: her seviye bir öncekinden biraz daha somut olur, ama hiçbiri
// son sayısal/nihai cevabı yazmaz. Önceki ipuçları prompt'a eklenir ki
// model aynı şeyi tekrar etmesin, üzerine eklesin.
// ─────────────────────────────────────────────────────────────
const HINT_STAGE_GUIDES = {
    1: [
        'Bu bir İPUCU isteğidir (1. ve en hafif seviye). Öğrenciye sorunun cevabını KESİNLİKLE verme.',
        '- Öğrenciyi doğru konuya/yönteme yönlendirecek çok genel, hafif bir ipucu ver.',
        '- Hiçbir hesap, formül sonucu veya ara sonuç verme.',
        '- 2-3 kısa cümleyi geçme.'
    ].join('\n'),
    2: [
        'Bu bir İPUCU isteğidir (2. seviye). Öğrenciye sorunun cevabını KESİNLİKLE verme.',
        'Öğrenci bir önceki (daha hafif) ipucuyla çözemedi. Şimdi biraz daha somut bir yönlendirme yap:',
        '- Hangi adımdan başlanması gerektiğini veya hangi formül/kuralın kullanılacağını belirt.',
        '- Yine de son sonucu ya da ara sonucu hesaplama; sadece yolu göster.',
        '- Kısa ve öz ol, önceki ipucuyla aynı şeyi tekrar etme.'
    ].join('\n'),
    3: [
        'Bu bir İPUCU isteğidir (son seviye, 3). Öğrenciye sorunun NİHAİ cevabını/sonucunu KESİNLİKLE yazma.',
        '- Çözüm yolunu neredeyse tamamen, somut adımlarla anlat (hangi işlem, hangi sırayla).',
        '- Son sayısal/nihai sonucu hesaplamadan bırak.',
        '- Cevabın sonunda öğrenciye, bu adımları takip ederek sonucu kendisinin bulabileceğini, isterse tam çözümü de görebileceğini belirt.'
    ].join('\n')
}

function buildHintPrompt(level, previousHints) {
    const stageGuide = HINT_STAGE_GUIDES[level] || HINT_STAGE_GUIDES[1]
    if (!previousHints || !previousHints.length) return stageGuide
    const historyBlock = previousHints
        .slice(0, 5)
        .map((h, i) => `${i + 1}. ${h}`)
        .join('\n')
    return `${stageGuide}\n\nDaha önce öğrenciye verilen ipuçları (bunları AYNEN TEKRARLAMA, üzerine ekle):\n${historyBlock}`
}

// ─────────────────────────────────────────────────────────────
// "Çözümümü Kontrol Et" — öğrencinin kendi çözümünü inceleyip,
// doğru adımları onaylayan, hatayı DOĞRUDAN cevap vermeden adım
// numarasıyla işaret eden bir prompt.
// ─────────────────────────────────────────────────────────────
const CHECK_PROMPT = [
    'Bu bir "ÇÖZÜMÜMÜ KONTROL ET" isteğidir.',
    'Öğrenci, ekteki soruyu kendi çözmüş ve kendi çözümünü sana gönderdi.',
    'Görevin:',
    '- Öğrencinin doğru yaptığı adımları kısaca onayla.',
    '- Bir hata varsa, hatanın olduğu adımı numarasıyla işaret et (ör. "3. adımda bir sorun var").',
    '- Doğru sonucu veya doğru cevabı DOĞRUDAN VERME; öğrencinin kendi hatasını fark etmesini sağlayacak',
    '  şekilde yönlendir (ör. "Bu adımda işaret değişimine dikkat et.").',
    '- Çözüm tamamen doğruysa bunu net şekilde belirt ve öğrenciyi kısaca tebrik et.',
    'Kısa, net ve yapıcı ol; resmi bir ders kitabı dili kullanma.'
].join('\n')

// ─────────────────────────────────────────────────────────────
// Mod bazlı model seçimi.
// Şimdilik ikisi de aynı model. İleride 'detailed' için Gemini Pro'ya
// geçmek istersen sadece bu satırı değiştirmen yeterli.
// ─────────────────────────────────────────────────────────────
const MODEL_BY_MODE = {
    fast: 'gemini-3.6-flash',
    detailed: 'gemini-3.6-flash'
}

const DEFAULT_MODE = 'fast'

function resolveMode(rawMode) {
    return rawMode === 'detailed' || rawMode === 'fast' ? rawMode : DEFAULT_MODE
}

function resolveAction(rawAction) {
    if (rawAction === 'simplify' || rawAction === 'hint' || rawAction === 'check') return rawAction
    return 'solve'
}

function resolveHintLevel(rawLevel) {
    const n = Number(rawLevel)
    return [1, 2, 3].includes(n) ? n : 1
}

async function callGemini(config, model, parts) {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.geminiApiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts }] })
        }
    )

    const data = await response.json()

    if (!response.ok || data.error) {
        console.error('[solve] Gemini hata döndü:', JSON.stringify(data))
        return null
    }

    const candidate = data.candidates?.[0]
    const finishReason = candidate?.finishReason

    // Gemini, özellikle uzun/çok adımlı (detaylı) cevaplarda içeriği birden
    // fazla "part" halinde döndürebilir. Sadece parts[0]'ı okumak, cevabın
    // bir kısmının (hatta tamamının) sessizce kaybolmasına yol açıyordu.
    const combinedText = (candidate?.content?.parts ?? [])
        .map(p => p?.text ?? '')
        .join('')
        .trim()

    if (!combinedText) {
        console.error('[solve] Gemini boş/eksik cevap döndü. finishReason:', finishReason, JSON.stringify(data))
        return null
    }

    return combinedText
}

// Mevcut akış: fotoğraftaki soruyu, seçilen moda göre çöz. (DEĞİŞTİRİLMEDİ)
async function handleSolve(config, body) {
    const mode = resolveMode(body.mode)
    const systemPrompt = SYSTEM_PROMPTS[mode]
    const model = MODEL_BY_MODE[mode]

    const answer = await callGemini(config, model, [
        { text: systemPrompt },
        { inline_data: { mime_type: 'image/jpeg', data: body.imageBase64 } }
    ])

    return { answer: answer ?? 'Cevap alınamadı, tekrar dener misin?', mode }
}

// Yeni akış: "Daha basit anlat" — var olan cevabı görsel olmadan, sadece
// metin girdisiyle daha sade bir dille yeniden anlattırır.
async function handleSimplify(config, body) {
    const previousAnswer = (body.previousAnswer || '').trim()

    if (!previousAnswer) {
        return { answer: 'Basitleştirilecek bir cevap bulunamadı, tekrar dener misin?', action: 'simplify' }
    }

    const model = MODEL_BY_MODE.fast // basitleştirme hafif bir görev, hızlı model yeterli

    const answer = await callGemini(config, model, [
        { text: `${SIMPLIFY_PROMPT}\n\n---\nÖnceki cevap:\n${previousAnswer}` }
    ])

    return { answer: answer ?? 'Basitleştirilemedi, tekrar dener misin?', action: 'simplify' }
}

// Yeni akış: "İpucu" — soruyu tekrar görsel olarak alır (çünkü ipucu, sorunun
// kendisine bakılarak verilir), ama cevabı DOĞRUDAN vermeyen kademeli bir
// prompt kullanır. Aynı Gemini modeli ve aynı callGemini yardımcı fonksiyonu
// kullanılır; yeni bir servis/model eklenmez.
async function handleHint(config, body) {
    const level = resolveHintLevel(body.hintLevel)
    const previousHints = Array.isArray(body.previousHints) ? body.previousHints : []

    if (!body.imageBase64) {
        return { answer: 'İpucu için önce soru fotoğrafının yüklenmiş olması gerekiyor.', action: 'hint', hintLevel: level }
    }

    const model = MODEL_BY_MODE.fast // ipucu kısa ve hızlı bir görevdir

    const answer = await callGemini(config, model, [
        { text: buildHintPrompt(level, previousHints) },
        { inline_data: { mime_type: 'image/jpeg', data: body.imageBase64 } }
    ])

    return { answer: answer ?? 'İpucu alınamadı, tekrar dener misin?', action: 'hint', hintLevel: level }
}

// Yeni akış: "Çözümümü Kontrol Et" — orijinal soru fotoğrafı + öğrencinin
// kendi çözümü (metin ve/veya fotoğraf) birlikte modele gönderilir.
// Doğrudan cevap vermeyen, yönlendirici bir prompt kullanır.
async function handleCheck(config, body) {
    const studentText = (body.studentSolutionText || '').trim()
    const hasStudentImage = !!body.studentSolutionImageBase64

    if (!studentText && !hasStudentImage) {
        return { answer: 'Kontrol edebilmem için çözümünü yazman veya fotoğrafını yüklemen gerekiyor.', action: 'check' }
    }

    if (!body.imageBase64) {
        return { answer: 'Çözümünü kontrol edebilmem için önce soru fotoğrafının yüklenmiş olması gerekiyor.', action: 'check' }
    }

    const model = MODEL_BY_MODE.detailed // hata tespiti, dikkatli okuma gerektirir

    const parts = [
        { text: CHECK_PROMPT },
        { text: '\nSoru fotoğrafı aşağıdadır:' },
        { inline_data: { mime_type: 'image/jpeg', data: body.imageBase64 } }
    ]

    if (hasStudentImage) {
        parts.push({ text: '\nÖğrencinin çözüm fotoğrafı aşağıdadır:' })
        parts.push({ inline_data: { mime_type: 'image/jpeg', data: body.studentSolutionImageBase64 } })
    } else {
        parts.push({ text: `\nÖğrencinin yazdığı çözüm:\n${studentText}` })
    }

    const answer = await callGemini(config, model, parts)

    return { answer: answer ?? 'Çözümün kontrol edilemedi, tekrar dener misin?', action: 'check' }
}

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const body = await readBody(event) // { imageBase64, mode: "fast"|"detailed", action?: "solve"|"simplify", previousAnswer? }

    const action = resolveAction(body.action)

    if (action === 'simplify') {
        return await handleSimplify(config, body)
    }

    if (action === 'hint') {
        return await handleHint(config, body)
    }

    if (action === 'check') {
        return await handleCheck(config, body)
    }

    return await handleSolve(config, body)
})