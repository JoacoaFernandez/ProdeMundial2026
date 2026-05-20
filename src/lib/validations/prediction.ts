import { z } from 'zod'

export const PredictionSchema = z.object({
  matchId: z.string().min(1),
  homeScore: z.number().int().min(0).max(99),
  awayScore: z.number().int().min(0).max(99),
})

export type PredictionInput = z.infer<typeof PredictionSchema>
