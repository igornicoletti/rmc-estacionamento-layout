import { authPolicy } from "./auth-policy"

export type PasswordValidationError =
  | "INVALID_UNICODE"
  | "TOO_SHORT"
  | "TOO_LONG"
  | "TOO_MANY_UTF8_BYTES"

export type PasswordValidation =
  | { valid: true; normalized: string; codePoints: number; utf8Bytes: number }
  | { valid: false; error: PasswordValidationError }

const containsLoneSurrogate = (value: string) => {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1)
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true
      index += 1
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return true
    }
  }
  return false
}

const utf8ByteLength = (value: string) => new TextEncoder().encode(value).length

export function validateAndNormalizePassword(value: string): PasswordValidation {
  if (containsLoneSurrogate(value)) return { valid: false, error: "INVALID_UNICODE" }

  const normalized = value.normalize("NFC")
  const codePoints = [...normalized].length
  if (codePoints < authPolicy.passwordMinCodePoints) {
    return { valid: false, error: "TOO_SHORT" }
  }
  if (codePoints > authPolicy.passwordMaxCodePoints) {
    return { valid: false, error: "TOO_LONG" }
  }

  const utf8Bytes = utf8ByteLength(normalized)
  if (utf8Bytes > authPolicy.passwordMaxUtf8Bytes) {
    return { valid: false, error: "TOO_MANY_UTF8_BYTES" }
  }

  return { valid: true, normalized, codePoints, utf8Bytes }
}

