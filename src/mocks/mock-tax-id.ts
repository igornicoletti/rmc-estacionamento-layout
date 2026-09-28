export function createMockCnpj(index: number) {
  const base = `99000000${String(index + 1).padStart(4, "0")}`
  const digit = (value: string, weights: readonly number[]) => {
    const sum = weights.reduce(
      (total, weight, position) => total + Number(value[position]) * weight,
      0,
    )
    const remainder = sum % 11
    return remainder < 2 ? 0 : 11 - remainder
  }
  const first = digit(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const second = digit(
    `${base}${first}`,
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  )

  return `${base}${first}${second}`
}
