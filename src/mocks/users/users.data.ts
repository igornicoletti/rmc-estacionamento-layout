import * as z from "zod"

import { DemoUserSchema } from "@/features/users/users.schema"

export const MOCK_USERS = z.array(DemoUserSchema).length(12).parse([
  { id: "USR-001", name: "Ana Martins", email: "ana.martins@rmc.local", role: "administrator", status: "active", lastAccessAt: "2026-09-17T12:10:00.000Z" },
  { id: "USR-002", name: "Bruno Lima", email: "bruno.lima@rmc.local", role: "operator", status: "active", lastAccessAt: "2026-09-17T10:35:00.000Z" },
  { id: "USR-003", name: "Carla Nunes", email: "carla.nunes@rmc.local", role: "manager", status: "invited", lastAccessAt: null },
  { id: "USR-004", name: "Diego Rocha", email: "diego.rocha@rmc.local", role: "operator", status: "suspended", lastAccessAt: "2026-08-28T14:20:00.000Z" },
  { id: "USR-005", name: "Elisa Prado", email: "elisa.prado@rmc.local", role: "manager", status: "active", lastAccessAt: "2026-09-16T18:45:00.000Z" },
  { id: "USR-006", name: "Fábio Souza", email: "fabio.souza@rmc.local", role: "operator", status: "active", lastAccessAt: "2026-09-16T15:05:00.000Z" },
  { id: "USR-007", name: "Gabriela Melo", email: "gabriela.melo@rmc.local", role: "administrator", status: "invited", lastAccessAt: null },
  { id: "USR-008", name: "Hugo Alves", email: "hugo.alves@rmc.local", role: "manager", status: "active", lastAccessAt: "2026-09-15T11:30:00.000Z" },
  { id: "USR-009", name: "Isabela Costa", email: "isabela.costa@rmc.local", role: "operator", status: "active", lastAccessAt: "2026-09-14T09:15:00.000Z" },
  { id: "USR-010", name: "João Ribeiro", email: "joao.ribeiro@rmc.local", role: "operator", status: "invited", lastAccessAt: null },
  { id: "USR-011", name: "Karen Dias", email: "karen.dias@rmc.local", role: "administrator", status: "active", lastAccessAt: "2026-09-13T16:40:00.000Z" },
  { id: "USR-012", name: "Lucas Ferreira", email: "lucas.ferreira@rmc.local", role: "manager", status: "suspended", lastAccessAt: "2026-08-20T08:00:00.000Z" },
])
