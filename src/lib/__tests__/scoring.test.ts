import { describe, it, expect } from 'vitest'
import { calculatePoints } from '../scoring'

describe('calculatePoints', () => {
  it('returns 10 for exact result', () => {
    expect(calculatePoints(2, 1, 2, 1)).toEqual({ points: 10, category: 'EXACT' })
    expect(calculatePoints(0, 0, 0, 0)).toEqual({ points: 10, category: 'EXACT' })
  })

  it('returns 7 for correct winner and exact difference', () => {
    // pred 2-1 (diff +1), real 3-2 (diff +1) — same diff, same winner
    expect(calculatePoints(2, 1, 3, 2)).toEqual({ points: 7, category: 'WINNER_DIFF' })
    // pred 0-2 (diff -2), real 1-3 (diff -2)
    expect(calculatePoints(0, 2, 1, 3)).toEqual({ points: 7, category: 'WINNER_DIFF' })
  })

  it('returns 5 for correct winner only', () => {
    // pred 2-0, real 1-0 — both home wins, different diff
    expect(calculatePoints(2, 0, 1, 0)).toEqual({ points: 5, category: 'WINNER_ONLY' })
    // pred 1-1, real 2-2 — both draws
    expect(calculatePoints(1, 1, 2, 2)).toEqual({ points: 5, category: 'WINNER_ONLY' })
  })

  it('returns 0 for wrong prediction', () => {
    // pred home win, real away win
    expect(calculatePoints(2, 0, 0, 1)).toEqual({ points: 0, category: 'WRONG' })
    // pred draw, real home win
    expect(calculatePoints(1, 1, 2, 0)).toEqual({ points: 0, category: 'WRONG' })
  })
})
