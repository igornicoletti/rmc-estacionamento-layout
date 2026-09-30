import { z } from "zod"

import { userCapabilities } from "./capability-catalog"

export const userCapabilitySchema = z.enum(userCapabilities)
