import { describe, expect, it } from "vitest"
import { WorkerCpfCrypto } from "../src/auth/worker-cpf-crypto"
import { encodeSecret, hex, unhex } from "../src/auth/worker-crypto"

const key = (n: number) => encodeSecret(new Uint8Array(32).fill(n))
const ring = { currentSourceVersion: 1, source: { "1": key(81) }, lookup: { "1": key(82), "2": key(83) } }
const id = "01000000-0000-4000-8000-000000000001"
const context = () => ({ signal: new AbortController().signal })
describe("CPF private codec in Workers runtime", () => {
  it("matches an independent Node AES-GCM/HMAC vector, not just roundtrip", async () => {
    const codec = new WorkerCpfCrypto(ring, [])
    const ciphertext = new Uint8Array(unhex("0102030405060708090a0b0caf6e500b34148794b3f852a9921b0df8c579c5f0d6cac27bae86a2"))
    expect(await codec.openCpf({ codecVersion: 1, algorithm: "A256GCM", purpose: "CPF",
      identityId: id, generation: 1, keyVersion: 1, ciphertext }, id, 1, context())).toBe("12345678909")
    expect(hex(await codec.lookupCpf("12345678909", 1, context()))).toBe("d83509310cb510e615b94f9cf3a4f977d8442a0c4e068e197531750a82827fde")
  })
  it("recovers canonical synthetic CPF with random IV and denies changed binding/tag/version", async () => {
    const codec = new WorkerCpfCrypto(ring, [key(84)])
    const envelope = await codec.sealCpf("12345678909", id, 1, context())
    expect(envelope.ciphertext).toHaveLength(39)
    expect(await codec.openCpf(envelope, id, 1, context())).toBe("12345678909")
    const second = await codec.sealCpf("12345678909", id, 1, context())
    expect(second.ciphertext).not.toEqual(envelope.ciphertext)
    await expect(codec.openCpf(envelope, id, 2, context())).rejects.toThrow()
    const altered = envelope.ciphertext.slice(); altered[38] ^= 1
    await expect(codec.openCpf({ ...envelope, ciphertext: altered }, id, 1, context())).rejects.toThrow()
    await expect(codec.openCpf({ ...envelope, keyVersion: 99 }, id, 1, context())).rejects.toThrow()
  })
  it("has deterministic versioned HMACs, noninterchangeable keys and old-key restore", async () => {
    const codec = new WorkerCpfCrypto(ring, [])
    const hash = await codec.lookupCpf("12345678909", 1, context())
    expect(await codec.lookupCpf("12345678909", 1, context())).toEqual(hash)
    expect(await codec.lookupCpf("12345678909", 2, context())).not.toEqual(hash)
    const old = await codec.sealCpf("12345678909", id, 1, context())
    const rotated = new WorkerCpfCrypto({ ...ring, currentSourceVersion: 2, source: { ...ring.source, "2": key(85) } }, [])
    expect(await rotated.openCpf(old, id, 1, context())).toBe("12345678909")
    const retired = new WorkerCpfCrypto({ ...ring, currentSourceVersion: 2, source: { "2": key(85) } }, [])
    await expect(retired.openCpf(old, id, 1, context())).rejects.toThrow()
    expect(() => new WorkerCpfCrypto({ ...ring, lookup: { "1": key(81) } }, [])).toThrow()
    expect(() => new WorkerCpfCrypto(ring, [key(81)])).toThrow()
  })
  it("rejects cancellation and noncanonical or malformed input without exposing it", async () => {
    const codec = new WorkerCpfCrypto(ring, [])
    await expect(codec.sealCpf("123.456.789-09", id, 1, context())).rejects.toThrow()
    await expect(codec.lookupCpf("00000000000", 1, context())).rejects.toThrow()
    await expect(codec.lookupCpf("12345678909", 3, context())).rejects.toThrow()
    await expect(codec.sealCpf("12345678909", id, 1, { signal: AbortSignal.abort() })).rejects.toThrow()
  })
})
