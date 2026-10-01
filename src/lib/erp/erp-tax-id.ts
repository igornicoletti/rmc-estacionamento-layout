function readDigits(value: string) {
  return value.replace(/\D/gu, "")
}

function hasRepeatedDigits(value: string) {
  return /^(\d)\1+$/u.test(value)
}

function calculateCheckDigit(
  base: string,
  weights: readonly number[],
) {
  const sum = weights.reduce(
    (total, weight, index) => total + Number(base[index]) * weight,
    0,
  )
  const remainder = sum % 11
  return remainder < 2 ? 0 : 11 - remainder
}

function isValidCpf(digits: string) {
  if (digits.length !== 11 || hasRepeatedDigits(digits)) {
    return false
  }

  const first = calculateCheckDigit(digits.slice(0, 9), [
    10, 9, 8, 7, 6, 5, 4, 3, 2,
  ])
  const second = calculateCheckDigit(`${digits.slice(0, 9)}${first}`, [
    11, 10, 9, 8, 7, 6, 5, 4, 3, 2,
  ])

  return digits.slice(-2) === `${first}${second}`
}

function isValidCnpj(digits: string) {
  if (digits.length !== 14 || hasRepeatedDigits(digits)) {
    return false
  }

  const first = calculateCheckDigit(digits.slice(0, 12), [
    5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2,
  ])
  const second = calculateCheckDigit(`${digits.slice(0, 12)}${first}`, [
    6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2,
  ])

  return digits.slice(-2) === `${first}${second}`
}

function formatCpf(digits: string) {
  return digits.replace(
    /^(\d{3})(\d{3})(\d{3})(\d{2})$/u,
    "$1.$2.$3-$4",
  )
}

function formatCnpjDigits(digits: string) {
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/u,
    "$1.$2.$3/$4-$5",
  )
}

export function formatCpfCnpj(value: string) {
  const digits = readDigits(value)

  if (digits.length === 11) {
    if (!isValidCpf(digits)) {
      throw new TypeError(
        "Registro ERP inválido: CPF não passou na validação.",
      )
    }

    return formatCpf(digits)
  }

  if (digits.length === 14) {
    if (!isValidCnpj(digits)) {
      throw new TypeError(
        "Registro ERP inválido: CNPJ não passou na validação.",
      )
    }

    return formatCnpjDigits(digits)
  }

  throw new TypeError(
    "Registro ERP inválido: CPF/CNPJ deve conter 11 ou 14 dígitos.",
  )
}

export function formatCnpj(value: string) {
  const digits = readDigits(value)

  if (digits.length !== 14) {
    throw new TypeError(
      "Registro ERP inválido: CNPJ deve conter 14 dígitos.",
    )
  }

  if (!isValidCnpj(digits)) {
    throw new TypeError(
      "Registro ERP inválido: CNPJ não passou na validação.",
    )
  }

  return formatCnpjDigits(digits)
}
