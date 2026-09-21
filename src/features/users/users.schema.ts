import * as z from "zod"

export const DemoUserRoleSchema = z.enum([
  "administrator",
  "manager",
  "operator",
])

export const DemoUserStatusSchema = z.enum([
  "active",
  "invited",
  "suspended",
])

export const DemoUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.email(),
  role: DemoUserRoleSchema,
  status: DemoUserStatusSchema,
  lastAccessAt: z.iso.datetime().nullable(),
})

export type DemoUser = z.infer<typeof DemoUserSchema>
export type DemoUserRole = z.infer<typeof DemoUserRoleSchema>
export type DemoUserStatus = z.infer<typeof DemoUserStatusSchema>
