import test from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPair, SignJWT, exportJWK, createLocalJWKSet } from 'jose'
import { verifyFirebaseIdToken, bearerToken, createRateLimiter, checkBodyLimits, MAX_IMAGE_CHARS } from '../../server/utils/apiGuard.ts'

const PROJECT = 'eduty-test'
const { publicKey, privateKey } = await generateKeyPair('RS256')
const jwk = { ...(await exportJWK(publicKey)), alg: 'RS256', use: 'sig', kid: 'k1' }
const keys = createLocalJWKSet({ keys: [jwk] })

const sign = (over = {}, key = privateKey, exp = '1h') =>
    new SignJWT({}).setProtectedHeader({ alg: 'RS256', kid: 'k1' })
        .setIssuer(over.iss ?? `https://securetoken.google.com/${PROJECT}`)
        .setAudience(over.aud ?? PROJECT)
        .setSubject(over.sub ?? 'uid-123')
        .setIssuedAt().setExpirationTime(exp).sign(key)

test('geçerli token → uid', async () => {
    assert.equal(await verifyFirebaseIdToken(await sign(), PROJECT, keys), 'uid-123')
})

test('yanlış proje, yanlış yayıncı, süresi dolmuş, bozuk ve sahte imza reddedilir', async () => {
    await assert.rejects(verifyFirebaseIdToken(await sign({ aud: 'baska' }), PROJECT, keys))
    await assert.rejects(verifyFirebaseIdToken(await sign({ iss: 'https://evil.example' }), PROJECT, keys))
    await assert.rejects(verifyFirebaseIdToken(await sign({}, privateKey, '-1h'), PROJECT, keys))
    await assert.rejects(verifyFirebaseIdToken('abc.def.ghi', PROJECT, keys))
    const other = await generateKeyPair('RS256')
    await assert.rejects(verifyFirebaseIdToken(await sign({}, other.privateKey), PROJECT, keys))
    await assert.rejects(verifyFirebaseIdToken('', PROJECT, keys))
    await assert.rejects(verifyFirebaseIdToken(await sign(), '', keys))
})

test('bearerToken', () => {
    assert.equal(bearerToken('Bearer abc'), 'abc')
    assert.equal(bearerToken('bearer  xyz '), 'xyz')
    assert.equal(bearerToken('Basic abc'), '')
    assert.equal(bearerToken(undefined), '')
})

test('hız sınırı: dakikalık / saatlik sınır, kullanıcıya özel, süre dolunca açılır', () => {
    let t = 0
    const rl = createRateLimiter([
        { max: 2, windowMs: 60_000, message: 'dk' },
        { max: 3, windowMs: 3_600_000, message: 'saat' }
    ], () => t)
    assert.equal(rl.check('a'), null)
    assert.equal(rl.check('a'), null)
    const r = rl.check('a')
    assert.equal(r.message, 'dk')
    assert.ok(r.retryAfter >= 1 && r.retryAfter <= 60)
    assert.equal(rl.check('b'), null)                  // başka kullanıcı etkilenmez
    t += 61_000
    assert.equal(rl.check('a'), null)                  // 3. istek (saatlik sınıra kadar)
    t += 61_000
    assert.equal(rl.check('a').message, 'saat')        // saatlik sınır
    t += 3_600_000
    assert.equal(rl.check('a'), null)
})

test('reddedilen istekler sayaç doldurmaz', () => {
    let t = 0
    const rl = createRateLimiter([{ max: 1, windowMs: 1000, message: 'x' }], () => t)
    assert.equal(rl.check('a'), null)
    for (let i = 0; i < 50; i++) assert.ok(rl.check('a'))
    t += 1001
    assert.equal(rl.check('a'), null)
})

test('girdi boyutu sınırları', () => {
    assert.equal(checkBodyLimits({ imageBase64: 'abc', mode: 'fast' }), null)
    assert.ok(checkBodyLimits({ imageBase64: 'x'.repeat(MAX_IMAGE_CHARS + 1) }))
    assert.ok(checkBodyLimits({ imageBase64: 123 }))
    assert.ok(checkBodyLimits({ previousAnswer: 'x'.repeat(20_001) }))
    assert.ok(checkBodyLimits({ previousHints: 'x' }))
    assert.ok(checkBodyLimits({ previousHints: new Array(6).fill('a') }))
    assert.equal(checkBodyLimits({ previousHints: ['a', 'b'] }), null)
    assert.ok(checkBodyLimits(null))
})
