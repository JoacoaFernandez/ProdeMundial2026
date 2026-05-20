import { z } from 'zod'

export const CreateRoomSchema = z.object({
  name: z.string().min(3, { error: 'El nombre debe tener al menos 3 caracteres.' }).max(50).trim(),
  requireApproval: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  maxMembers: z.number().int().min(2).max(500).default(50),
})

export const JoinRoomSchema = z.object({
  code: z.string().length(8, { error: 'El código debe tener 8 caracteres.' }).toUpperCase(),
})

export type CreateRoomInput = z.infer<typeof CreateRoomSchema>
export type JoinRoomInput = z.infer<typeof JoinRoomSchema>
