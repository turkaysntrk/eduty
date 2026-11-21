/**
 * Eduty AI cevaplarını güvenli HTML'e çevirir.
 *  - Matematik ($...$, $$...$$, \(...\), \[...\]) KaTeX ile çizilir (üs, kesir, kök...).
 *  - Noktalama ile yan yana kalan **kalın** ifadeler düzeltilir.
 *  - Yazılma animasyonunda yarım kalmış ** işaretleri gizlenir.
 */
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const mathCache = new Map()

function renderMath(tex, displayMode) {
    const key = (displayMode ? 'D:' : 'I:') + tex
    if (mathCache.has(key)) return mathCache.get(key)
    let html
    try {
        html = katex.renderToString(tex, { displayMode, throwOnError: false, strict: 'ignore', trust: false, output: 'html' })
    } catch (e) {
        html = null
    }
    if (html === null) {
        const esc = tex.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        html = `<code>${esc}</code>`
    }
    if (mathCache.size > 500) mathCache.clear()
    mathCache.set(key, html)
    return html
}

// ** ... ** ve __ ... __ → <strong>. CommonMark noktalama bitişikliğinde bunu tanımaz.
function fixBold(text) {
    return text.replace(/\*\*(?=\S)([^*\n]+?)(?<=\S)\*\*/g, '<strong>$1</strong>')
}

// Yazılırken yarım kalan son "**" veya tek "*" görünmesin
function hideDanglingMarkers(text) {
    const count = (text.match(/\*\*/g) || []).length
    if (count % 2 === 1) {
        const i = text.lastIndexOf('**')
        text = text.slice(0, i) + text.slice(i + 2)
    }
    return text
}

export function renderAiMarkdown(raw) {
    if (!raw) return ''
    let text = String(raw)
    const maths = []
    const stash = (tex, display) => {
        maths.push({ tex: tex.trim(), display })
        return `@@MATH${maths.length - 1}@@`
    }

    // 1) Matematik parçalarını sakla (marked * ve _ karakterlerini bozmasın)
    text = text
        .replace(/\$\$([\s\S]+?)\$\$/g, (_, t) => stash(t, true))
        .replace(/\\\[([\s\S]+?)\\\]/g, (_, t) => stash(t, true))
        .replace(/\\\(([\s\S]+?)\\\)/g, (_, t) => stash(t, false))
        .replace(/\$(?=\S)([^$\n]+?)(?<=\S)\$/g, (_, t) => stash(t, false))

    // 2) Kalın düzeltmesi ve yarım işaretler
    text = hideDanglingMarkers(text)
    text = fixBold(text)

    // 3) Markdown → güvenli HTML
    let html = DOMPurify.sanitize(marked.parse(text, { breaks: true }))

    // 4) KaTeX çıktısını (güvenilir, trust:false) sanitize'dan sonra geri koy
    html = html.replace(/@@MATH(\d+)@@/g, (_, i) => {
        const m = maths[Number(i)]
        return m ? renderMath(m.tex, m.display) : ''
    })
    return html
}
