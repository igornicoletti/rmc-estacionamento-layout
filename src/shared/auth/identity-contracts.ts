import { z } from "zod"

const hasValidCpfCheckDigits = (cpf: string) => {
  if (/^(\d)\1{10}$/.test(cpf)) return false

  const digit = (length: number) => {
    let total = 0
    for (let index = 0; index < length; index += 1) {
      total += Number(cpf[index]) * (length + 1 - index)
    }
    const remainder = (total * 10) % 11
    return remainder === 10 ? 0 : remainder
  }

  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10])
}

export const cpfSchema = z
  .string()
  .regex(/^\d{11}$/)
  .refine(hasValidCpfCheckDigits, "CPF check digits are invalid.")

export const e164PhoneSchema = z.string().regex(/^\+[1-9]\d{7,14}$/)

export const corporateEmailSchema = z
  .email()
  .max(254)
  .refine((email) => {
    const domain = email.slice(email.lastIndexOf("@") + 1).toLowerCase()
    return domain === "redemontecarlo.com" || domain === "redemontecarlo.com.br"
  }, "Email domain is not allowed.")
  .nullable()

export const loginCommandSchema = z
  .object({ cpf: cpfSchema, password: z.string(), commandId: z.string().min(16).max(128) })
  .strict()

export const otpCommandSchema = z
  .object({
    challengeId: z.string().min(16).max(128),
    otp: z.string().regex(/^\d{8}$/),
    commandId: z.string().min(16).max(128),
  })
  .strict()

