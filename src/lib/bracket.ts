// FIFA World Cup 2026 knockout bracket template
// 12 groups (A-L) → 32 teams advance: 12 winners + 12 runners-up + 8 best thirds

export type R32Template = {
  slot: string
  homeSlot: string
  awaySlot: string
  r16Slot: string
  r16Side: 'home' | 'away'
  kickoff: Date
}

export type AdvancementTemplate = {
  slot: string
  stage: 'R16' | 'QF' | 'SF' | 'THIRD' | 'FINAL'
  homeFromSlot: string
  awayFromSlot: string
  homeIsLoser?: boolean
  awayIsLoser?: boolean
  kickoff: Date
}

// Approximate official FIFA WC 2026 dates (UTC)
const D = {
  R32: [
    '2026-06-28T22:00:00Z', '2026-06-29T01:00:00Z',
    '2026-06-29T22:00:00Z', '2026-06-30T01:00:00Z',
    '2026-06-30T22:00:00Z', '2026-07-01T01:00:00Z',
    '2026-07-01T22:00:00Z', '2026-07-02T01:00:00Z',
    '2026-07-02T22:00:00Z', '2026-07-03T01:00:00Z',
    '2026-07-03T22:00:00Z', '2026-07-04T01:00:00Z',
    '2026-07-04T22:00:00Z', '2026-07-05T01:00:00Z',
    '2026-07-05T22:00:00Z', '2026-07-06T01:00:00Z',
  ],
  R16: [
    '2026-07-08T22:00:00Z', '2026-07-09T01:00:00Z',
    '2026-07-09T22:00:00Z', '2026-07-10T01:00:00Z',
    '2026-07-10T22:00:00Z', '2026-07-11T01:00:00Z',
    '2026-07-11T22:00:00Z', '2026-07-12T01:00:00Z',
  ],
  QF: [
    '2026-07-14T22:00:00Z', '2026-07-15T01:00:00Z',
    '2026-07-15T22:00:00Z', '2026-07-16T01:00:00Z',
  ],
  SF: ['2026-07-19T22:00:00Z', '2026-07-21T22:00:00Z'],
  THIRD: '2026-07-25T18:00:00Z',
  FINAL: '2026-07-26T20:00:00Z',
}

const d = (s: string) => new Date(s)

// R32: 16 matches pairing winners, runners-up, and best 8 thirds
// W_X = group winner, RU_X = runner-up, T3_N = Nth best third
export const R32_BRACKET: R32Template[] = [
  { slot: 'R32_1',  homeSlot: 'W_A',  awaySlot: 'T3_1',  r16Slot: 'R16_1', r16Side: 'home', kickoff: d(D.R32[0]) },
  { slot: 'R32_2',  homeSlot: 'W_C',  awaySlot: 'RU_D',  r16Slot: 'R16_1', r16Side: 'away', kickoff: d(D.R32[1]) },
  { slot: 'R32_3',  homeSlot: 'W_E',  awaySlot: 'T3_2',  r16Slot: 'R16_2', r16Side: 'home', kickoff: d(D.R32[2]) },
  { slot: 'R32_4',  homeSlot: 'W_G',  awaySlot: 'RU_H',  r16Slot: 'R16_2', r16Side: 'away', kickoff: d(D.R32[3]) },
  { slot: 'R32_5',  homeSlot: 'W_I',  awaySlot: 'T3_3',  r16Slot: 'R16_3', r16Side: 'home', kickoff: d(D.R32[4]) },
  { slot: 'R32_6',  homeSlot: 'W_K',  awaySlot: 'RU_L',  r16Slot: 'R16_3', r16Side: 'away', kickoff: d(D.R32[5]) },
  { slot: 'R32_7',  homeSlot: 'W_B',  awaySlot: 'T3_4',  r16Slot: 'R16_4', r16Side: 'home', kickoff: d(D.R32[6]) },
  { slot: 'R32_8',  homeSlot: 'W_J',  awaySlot: 'RU_K',  r16Slot: 'R16_4', r16Side: 'away', kickoff: d(D.R32[7]) },
  { slot: 'R32_9',  homeSlot: 'RU_A', awaySlot: 'RU_B',  r16Slot: 'R16_5', r16Side: 'home', kickoff: d(D.R32[8]) },
  { slot: 'R32_10', homeSlot: 'W_D',  awaySlot: 'T3_5',  r16Slot: 'R16_5', r16Side: 'away', kickoff: d(D.R32[9]) },
  { slot: 'R32_11', homeSlot: 'RU_C', awaySlot: 'RU_F',  r16Slot: 'R16_6', r16Side: 'home', kickoff: d(D.R32[10]) },
  { slot: 'R32_12', homeSlot: 'W_F',  awaySlot: 'T3_6',  r16Slot: 'R16_6', r16Side: 'away', kickoff: d(D.R32[11]) },
  { slot: 'R32_13', homeSlot: 'RU_E', awaySlot: 'RU_I',  r16Slot: 'R16_7', r16Side: 'home', kickoff: d(D.R32[12]) },
  { slot: 'R32_14', homeSlot: 'W_H',  awaySlot: 'T3_7',  r16Slot: 'R16_7', r16Side: 'away', kickoff: d(D.R32[13]) },
  { slot: 'R32_15', homeSlot: 'RU_G', awaySlot: 'RU_J',  r16Slot: 'R16_8', r16Side: 'home', kickoff: d(D.R32[14]) },
  { slot: 'R32_16', homeSlot: 'W_L',  awaySlot: 'T3_8',  r16Slot: 'R16_8', r16Side: 'away', kickoff: d(D.R32[15]) },
]

export const R16_BRACKET: AdvancementTemplate[] = [
  { slot: 'R16_1', stage: 'R16', homeFromSlot: 'R32_1',  awayFromSlot: 'R32_2',  kickoff: d(D.R16[0]) },
  { slot: 'R16_2', stage: 'R16', homeFromSlot: 'R32_3',  awayFromSlot: 'R32_4',  kickoff: d(D.R16[1]) },
  { slot: 'R16_3', stage: 'R16', homeFromSlot: 'R32_5',  awayFromSlot: 'R32_6',  kickoff: d(D.R16[2]) },
  { slot: 'R16_4', stage: 'R16', homeFromSlot: 'R32_7',  awayFromSlot: 'R32_8',  kickoff: d(D.R16[3]) },
  { slot: 'R16_5', stage: 'R16', homeFromSlot: 'R32_9',  awayFromSlot: 'R32_10', kickoff: d(D.R16[4]) },
  { slot: 'R16_6', stage: 'R16', homeFromSlot: 'R32_11', awayFromSlot: 'R32_12', kickoff: d(D.R16[5]) },
  { slot: 'R16_7', stage: 'R16', homeFromSlot: 'R32_13', awayFromSlot: 'R32_14', kickoff: d(D.R16[6]) },
  { slot: 'R16_8', stage: 'R16', homeFromSlot: 'R32_15', awayFromSlot: 'R32_16', kickoff: d(D.R16[7]) },
]

export const QF_BRACKET: AdvancementTemplate[] = [
  { slot: 'QF_1', stage: 'QF', homeFromSlot: 'R16_1', awayFromSlot: 'R16_2', kickoff: d(D.QF[0]) },
  { slot: 'QF_2', stage: 'QF', homeFromSlot: 'R16_3', awayFromSlot: 'R16_4', kickoff: d(D.QF[1]) },
  { slot: 'QF_3', stage: 'QF', homeFromSlot: 'R16_5', awayFromSlot: 'R16_6', kickoff: d(D.QF[2]) },
  { slot: 'QF_4', stage: 'QF', homeFromSlot: 'R16_7', awayFromSlot: 'R16_8', kickoff: d(D.QF[3]) },
]

export const SF_BRACKET: AdvancementTemplate[] = [
  { slot: 'SF_1', stage: 'SF', homeFromSlot: 'QF_1', awayFromSlot: 'QF_2', kickoff: d(D.SF[0]) },
  { slot: 'SF_2', stage: 'SF', homeFromSlot: 'QF_3', awayFromSlot: 'QF_4', kickoff: d(D.SF[1]) },
]

export const FINAL_THIRD_BRACKET: AdvancementTemplate[] = [
  { slot: 'THIRD', stage: 'THIRD', homeFromSlot: 'SF_1', awayFromSlot: 'SF_2', homeIsLoser: true, awayIsLoser: true, kickoff: d(D.THIRD) },
  { slot: 'FINAL', stage: 'FINAL', homeFromSlot: 'SF_1', awayFromSlot: 'SF_2', kickoff: d(D.FINAL) },
]

export function slotToLabel(slot: string): string {
  if (slot.startsWith('W_')) return `1° Grupo ${slot.slice(2)}`
  if (slot.startsWith('RU_')) return `2° Grupo ${slot.slice(3)}`
  if (slot.startsWith('T3_')) return `3° clasificado #${slot.slice(3)}`
  return slot
}
