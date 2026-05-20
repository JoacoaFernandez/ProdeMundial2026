export type ScoreResult = {
  points: number;
  category: 'EXACT' | 'WINNER_DIFF' | 'WINNER_ONLY' | 'WRONG';
};

export function calculatePoints(
  predHome: number,
  predAway: number,
  realHome: number,
  realAway: number,
): ScoreResult {
  if (predHome === realHome && predAway === realAway) {
    return { points: 10, category: 'EXACT' };
  }

  const predDiff = predHome - predAway;
  const realDiff = realHome - realAway;
  const predWinner = Math.sign(predDiff);
  const realWinner = Math.sign(realDiff);

  // Solo aplica cuando hay ganador (diff ≠ 0) — empate correcto va a WINNER_ONLY
  if (predDiff !== 0 && predWinner === realWinner && predDiff === realDiff) {
    return { points: 7, category: 'WINNER_DIFF' };
  }

  if (predWinner === realWinner) {
    return { points: 5, category: 'WINNER_ONLY' };
  }

  return { points: 0, category: 'WRONG' };
}
