import { z } from "zod"

import { userCapabilities } from "./authorization-capability-catalog"

export const userCapabilitySchema = z.enum(userCapabilities)
