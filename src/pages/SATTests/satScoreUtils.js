/**
 * satScoreUtils.js
 * Pure scoring helpers for the projected SAT score calculation.
 */

function getWeightedScore(breakdown = []) {
  let weighted = 0, maxWeighted = 0;
  breakdown.forEach(b => {
    const w = b.difficulty === 'hard' ? 3 : b.difficulty === 'medium' ? 2 : 1;
    maxWeighted += w;
    if (b.is_correct) weighted += w;
  });
  return { weighted, maxWeighted };
}

function scaleSection(weighted, maxWeighted, tier) {
  if (maxWeighted === 0) return 400;
  const ratio = weighted / maxWeighted;
  const raw   = tier === 'hard'
    ? 350 + ratio * 450   // hard path → 350–800
    : 200 + ratio * 440;  // easy path → 200–640
  return Math.round(raw / 10) * 10;
}

export function computeProjectedSATScore(rwM1, rwM2, mathM1, mathM2) {
  const rw1 = getWeightedScore(rwM1?.breakdown);
  const rw2 = getWeightedScore(rwM2?.breakdown);
  const m1  = getWeightedScore(mathM1?.breakdown);
  const m2  = getWeightedScore(mathM2?.breakdown);

  const rwTier   = rwM2?.tier   || 'easy';
  const mathTier = mathM2?.tier || 'easy';

  const rwScore   = scaleSection(
    rw1.weighted   + rw2.weighted,
    rw1.maxWeighted + rw2.maxWeighted,
    rwTier,
  );
  const mathScore = scaleSection(
    m1.weighted  + m2.weighted,
    m1.maxWeighted + m2.maxWeighted,
    mathTier,
  );
  const total = Math.min(1600, Math.max(400, rwScore + mathScore));

  const margin = 60, secMgn = 30;

  // Aggregate topics across all modules
  const topicMap = {};
  [[rwM1, 'rw'], [rwM2, 'rw'], [mathM1, 'math'], [mathM2, 'math']].forEach(([mod, section]) => {
    (mod?.breakdown || []).forEach(b => {
      const key = (b.topic || '').trim();
      if (!key) return;
      if (!topicMap[key]) topicMap[key] = { correct: 0, total: 0, section };
      topicMap[key].total++;
      if (b.is_correct) topicMap[key].correct++;
    });
  });

  const topicList = Object.entries(topicMap)
    .map(([name, d]) => ({
      name,
      section: d.section,
      pct:     d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0,
      correct: d.correct,
      total:   d.total,
    }))
    .sort((a, b) => b.pct - a.pct);

  return {
    total,
    totalRange: [Math.max(400, total - margin), Math.min(1600, total + margin)],
    rw:         { score: rwScore,   tier: rwTier,   range: [Math.max(200, rwScore   - secMgn), Math.min(800, rwScore   + secMgn)] },
    math:       { score: mathScore, tier: mathTier, range: [Math.max(200, mathScore - secMgn), Math.min(800, mathScore + secMgn)] },
    topicList,
    strongest:  topicList[0]?.name                    || '—',
    focusArea:  topicList[topicList.length - 1]?.name || '—',
  };
}
