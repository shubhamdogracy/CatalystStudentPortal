export function buildEnrichedHistory(history, configs) {
  const configMap = new Map();
  configs.forEach(c => configMap.set(String(c._id), c));

  return history
    .filter(s => s.status === 'complete')
    .map(s => {
      const cfgId = String(s.practice_config_id?._id || s.practice_config_id);
      const cfg = configMap.get(cfgId) || {};
      return {
        sessionId: String(s._id),
        subject: s.subject,
        subtopic: cfg.sub_topic || s.sub_topic || 'Unknown',
        topic: cfg.topic || 'Unknown',
        configName: cfg.name || s.sub_topic || 'Unknown',
        percentage: s.percentage ?? 0,
        score: s.score ?? 0,
        maxScore: s.max_score ?? 10,
        submittedAt: new Date(s.submitted_at),
      };
    })
    .sort((a, b) => a.submittedAt - b.submittedAt);
}

export function filterSessions(enriched, subject, topic, subtopic) {
  return enriched.filter(s =>
    (subject === 'all' || s.subject === subject) &&
    (!topic || s.topic === topic) &&
    (!subtopic || s.subtopic === subtopic),
  );
}

export function computeSummary(enriched) {
  const byKey = {};
  enriched.forEach(s => {
    const key = `${s.subject}::${s.topic}::${s.subtopic}`;
    if (!byKey[key]) byKey[key] = { subtopic: s.subtopic, topic: s.topic, subject: s.subject, sessions: [] };
    byKey[key].sessions.push(s);
  });

  return Object.values(byKey).map(({ subtopic, topic, subject, sessions }) => {
    const sorted = [...sessions].sort((a, b) => a.submittedAt - b.submittedAt);
    const scores = sorted.map(s => s.percentage);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const trend = scores.length > 1 && scores.at(-1) > scores[0] + 5
      ? 'improving'
      : scores.length > 1 && scores.at(-1) < scores[0] - 5
        ? 'declining'
        : 'stable';
    const passRate = Math.round((scores.filter(s => s >= 60).length / scores.length) * 100);
    return {
      subtopic, topic, subject,
      attempts: sessions.length,
      avg, passRate, trend,
      firstScore: scores[0],
      lastScore: scores.at(-1),
      bestScore: Math.max(...scores),
    };
  }).sort((a, b) => b.attempts - a.attempts);
}

export function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
