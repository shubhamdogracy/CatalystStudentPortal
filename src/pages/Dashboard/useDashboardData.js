import { useState, useEffect, useCallback, useMemo } from 'react';
import { satService } from '../../services/api';

// Score-based SAT scaling — works from raw score/max_score, no breakdown needed
function scaleToSAT(score, max, tier) {
  if (!max) return 200;
  const ratio = score / max;
  const raw   = tier === 'hard' ? 350 + ratio * 450 : 200 + ratio * 440;
  return Math.round(raw / 10) * 10;
}

function computeScoreFromModules(rwData, mathData) {
  const rwM1  = rwData?.module_1  || {};
  const rwM2  = rwData?.module_2  || {};
  const mM1   = mathData?.module_1 || {};
  const mM2   = mathData?.module_2 || {};
  const rwScore   = scaleToSAT((rwM1.score || 0) + (rwM2.score || 0),   (rwM1.max_score || 0) + (rwM2.max_score || 0),   rwM2.tier || 'easy');
  const mathScore = scaleToSAT((mM1.score  || 0) + (mM2.score  || 0),   (mM1.max_score  || 0) + (mM2.max_score  || 0),   mM2.tier  || 'easy');
  const total     = Math.min(1600, Math.max(400, rwScore + mathScore));
  const margin = 60, secMgn = 30;
  return {
    total,
    totalRange: [Math.max(400, total - margin), Math.min(1600, total + margin)],
    rw:   { score: rwScore,   range: [Math.max(200, rwScore   - secMgn), Math.min(800, rwScore   + secMgn)] },
    math: { score: mathScore, range: [Math.max(200, mathScore - secMgn), Math.min(800, mathScore + secMgn)] },
  };
}

const SERIES_SUFFIX = / — (Math|Reading & Writing)$/;

// Adapted from mentor portal InsightsPage — uses raw module scores (no getResults calls needed)
function sectionScore(module1, module2) {
  const score = (module1?.score || 0) + (module2?.score || 0);
  const max   = (module1?.max_score || 0) + (module2?.max_score || 0);
  return scaleToSAT(score, max, module2?.tier || 'easy');
}

function buildDiagnosticProgression(history, examConfigs) {
  const configMap = Object.fromEntries(examConfigs.map(c => [String(c._id), c]));
  const cid       = s => String(s.exam_config_id?._id || s.exam_config_id || '');

  // Keep only completed diagnostic sessions
  const diagSessions = history.filter(s => {
    const cfg = configMap[cid(s)];
    return cfg?.type === 'diagnostic';
  });

  const seriesMap = {};
  const singles   = [];

  diagSessions.forEach(s => {
    const cfg  = configMap[cid(s)] || {};
    const name = cfg.name || '';
    const match = name.match(SERIES_SUFFIX);
    const at    = +new Date(s.createdAt || 0);

    if (match) {
      const key  = name.replace(SERIES_SUFFIX, '').trim();
      const subj = cfg.subject || '';
      if (!seriesMap[key]) seriesMap[key] = { key, math: null, rw: null, at: 0 };
      if (subj === 'math') {
        if (!seriesMap[key].math || at > +new Date(seriesMap[key].math.createdAt || 0)) seriesMap[key].math = s;
      } else {
        if (!seriesMap[key].rw   || at > +new Date(seriesMap[key].rw.createdAt   || 0)) seriesMap[key].rw   = s;
      }
      seriesMap[key].at = Math.max(seriesMap[key].at, at);
    } else {
      singles.push(s);
    }
  });

  const rows = [
    ...Object.values(seriesMap).map(({ key, math, rw, at }) => {
      const mathSc = math ? sectionScore(math.module_1, math.module_2) : null;
      const rwSc   = rw   ? sectionScore(rw.module_1,   rw.module_2)   : null;
      const total  = mathSc !== null && rwSc !== null
        ? Math.min(1600, Math.max(400, mathSc + rwSc)) : (mathSc ?? rwSc);
      return { name: key, total, math: mathSc, rw: rwSc, at, isPair: !!(mathSc && rwSc),
        date: new Date(at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) };
    }),
    ...singles
      .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
      .map(s => {
        const cfg  = configMap[cid(s)] || {};
        const sc   = sectionScore(s.module_1, s.module_2);
        const at   = +new Date(s.createdAt || 0);
        const isMath = (cfg.subject || '') === 'math';
        return { name: cfg.name || 'Diagnostic', total: sc, math: isMath ? sc : null,
          rw: !isMath ? sc : null, at, isPair: false,
          date: new Date(at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) };
      }),
  ].sort((a, b) => a.at - b.at);

  return rows.map((r, i) => ({ ...r, label: `T${i + 1}` }));
}

function deriveWeakAreas(history) {
  const map = {};
  history.forEach(s => {
    if (!s.sub_topic) return;
    if (!map[s.sub_topic]) map[s.sub_topic] = { topic: s.topic || '', subject: s.subject, sum: 0, count: 0 };
    map[s.sub_topic].sum += s.percentage || 0;
    map[s.sub_topic].count++;
  });
  return Object.entries(map)
    .map(([name, d]) => ({ name, topic: d.topic, subject: d.subject, accuracy: Math.round(d.sum / d.count) }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5);
}

function deriveTopicMastery(history, configs) {
  const map = {};
  configs.forEach(c => {
    if (c.sub_topic) map[c.sub_topic] = { topic: c.topic || '', subject: c.subject, sum: 0, count: 0 };
  });
  history.forEach(s => {
    if (!s.sub_topic) return;
    if (!map[s.sub_topic]) map[s.sub_topic] = { topic: s.topic || '', subject: s.subject, sum: 0, count: 0 };
    map[s.sub_topic].sum += s.percentage || 0;
    map[s.sub_topic].count++;
  });
  return Object.entries(map).map(([name, d]) => ({
    name, topic: d.topic, subject: d.subject,
    accuracy: d.count > 0 ? Math.round(d.sum / d.count) : null,
    attempts: d.count,
  }));
}

function deriveContinueLearning(history, configs) {
  const configMap  = Object.fromEntries(configs.map(c => [String(c._id), c]));
  const sorted     = [...history].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const configId   = s => String(s.practice_config_id?._id || s.practice_config_id || '');

  // 1. Prefer an in-progress session
  const inProgress = sorted.find(s => s.status !== 'complete' && s.status !== 'completed');
  if (inProgress) return { session: inProgress, config: configMap[configId(inProgress)] || null, type: 'resume' };

  // 2. Find a config that has never been attempted
  const startedIds    = new Set(history.map(configId).filter(Boolean));
  const unstartedConf = configs.find(c => !startedIds.has(String(c._id)));
  if (unstartedConf)  return { session: null, config: unstartedConf, type: 'start' };

  // 3. All done — show most recently completed for reference
  if (sorted.length)  return { session: sorted[0], config: configMap[configId(sorted[0])] || null, type: 'completed' };

  return null;
}

const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

function toLocalDateStr(date) {
  try { return new Date(date).toLocaleDateString('en-CA', { timeZone: LOCAL_TZ }); } catch { return ''; }
}

function deriveActivityDates(practiceHistory, examHistory) {
  const dates = new Set();
  practiceHistory
    .filter(s => s.status === 'complete' || s.status === 'completed')
    .forEach(s => { const d = toLocalDateStr(s.submitted_at || s.updatedAt); if (d) dates.add(d); });
  examHistory
    .filter(s => s.status === 'complete' || s.status === 'completed')
    .forEach(s => { const d = toLocalDateStr(s.createdAt); if (d) dates.add(d); });
  return dates;
}

export function useDashboardData() {
  const [testStats, setTestStats] = useState({
    diagnostic: { total: 0, completed: 0 },
    practice:   { total: 0, completed: 0 },
    mock:       { total: 0, completed: 0 },
  });
  const [inProgress,      setInProgress]      = useState({ diagnostic: false, mock: false, practice: false });
  const [loadingTests,    setLoadingTests]     = useState(true);
  const [practiceHistory, setPracticeHistory] = useState([]);
  const [practiceConfigs, setPracticeConfigs] = useState([]);
  const [examHistory,     setExamHistory]     = useState([]);
  const [examConfigs,     setExamConfigs]     = useState([]);
  const [predictedScore,  setPredictedScore]  = useState(null);
  const [loadingScore,    setLoadingScore]     = useState(true);

  const load = useCallback(async () => {
    try {
      const [examRes, histRes, practiceRes, practiceHistRes, activeRes] = await Promise.all([
        satService.listExamConfigs().catch(() => ({ data: [] })),
        satService.getHistory().catch(() => ({ data: [] })),
        satService.listPractice().catch(() => ({ data: [] })),
        satService.getPracticeHistory().catch(() => ({ data: [] })),
        satService.getActiveAttempts().catch(() => ({ data: [] })),
      ]);

      const examConfigs    = examRes.data         || [];
      const history        = histRes.data         || [];
      const practiceConfs  = practiceRes.data     || [];
      const practiceHist   = practiceHistRes.data || [];
      const activeAttempts = activeRes.data       || [];

      setPracticeHistory(practiceHist);
      setPracticeConfigs(practiceConfs);
      setExamHistory(history);
      setExamConfigs(examConfigs);

      // ── Test stats ───────────────────────────────────────────────────────────
      const seriesConfigs     = examConfigs.filter(c =>  SERIES_SUFFIX.test(c.name));
      const standaloneConfigs = examConfigs.filter(c => !SERIES_SUFFIX.test(c.name));
      const seriesGroups = Object.values(
        seriesConfigs.reduce((acc, c) => {
          const key = c.name.replace(SERIES_SUFFIX, '').trim();
          if (!acc[key]) acc[key] = { type: c.type || 'mock', math: null, rw: null };
          if (c.subject === 'math') acc[key].math = c; else acc[key].rw = c;
          return acc;
        }, {})
      );
      const diagGroups      = seriesGroups.filter(g => g.type === 'diagnostic');
      const mockGroups      = seriesGroups.filter(g => g.type !== 'diagnostic');
      const diagStandalones = standaloneConfigs.filter(c => c.type === 'diagnostic');
      const mockStandalones = standaloneConfigs.filter(c => c.type !== 'diagnostic');

      const completedExamIds = new Set(
        history.filter(s => s.status === 'complete' || s.status === 'completed')
               .map(s => s.exam_config_id?._id || s.exam_config_id).filter(Boolean)
      );
      const countSeriesCompleted = (groups) =>
        groups.filter(g => completedExamIds.has(g.math?._id) && completedExamIds.has(g.rw?._id)).length;

      const completedPracticeIds = new Set(
        practiceHist.filter(s => s.status === 'complete' || s.status === 'completed')
                    .map(s => s.practice_config_id?._id || s.practice_config_id).filter(Boolean)
      );

      setTestStats({
        diagnostic: { total: diagGroups.length + diagStandalones.length, completed: countSeriesCompleted(diagGroups) + diagStandalones.filter(c => completedExamIds.has(c._id)).length },
        practice:   { total: practiceConfs.length, completed: practiceConfs.filter(c => completedPracticeIds.has(c._id)).length },
        mock:       { total: mockGroups.length + mockStandalones.length, completed: countSeriesCompleted(mockGroups) + mockStandalones.filter(c => completedExamIds.has(c._id)).length },
      });
      setInProgress({
        diagnostic: activeAttempts.some(a => a.type === 'diagnostic'),
        mock:       activeAttempts.some(a => a.type === 'mock'),
        practice:   false,
      });

      // ── Predicted score: try standalone first, then series ──────────────────
      try {
        const isComplete = s => s.status === 'complete' || s.status === 'completed';
        const configId   = s => s.exam_config_id?._id || s.exam_config_id;
        const byNewest   = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);

        // Case 1 — unified/standalone diagnostic (single session covers both sections)
        const diagStandaloneIds = new Set(diagStandalones.map(c => c._id));
        const latestStandalone  = history
          .filter(s => isComplete(s) && diagStandaloneIds.has(configId(s)))
          .sort(byNewest)[0];

        if (latestStandalone) {
          // Unified session — both sections in one result
          const res  = await satService.getResults(latestStandalone._id);
          const data = res.data || res;
          if (data.reading_writing && data.math) {
            setPredictedScore(computeScoreFromModules(data.reading_writing, data.math));
          }
        } else {
          // Series diagnostic — separate Math + Reading & Writing sessions
          const completedSeriesGroup = diagGroups.find(g =>
            completedExamIds.has(g.math?._id) && completedExamIds.has(g.rw?._id)
          );
          if (completedSeriesGroup) {
            const rwSession   = history.filter(s => isComplete(s) && configId(s) === completedSeriesGroup.rw?._id).sort(byNewest)[0];
            const mathSession = history.filter(s => isComplete(s) && configId(s) === completedSeriesGroup.math?._id).sort(byNewest)[0];
            if (rwSession && mathSession) {
              const [rwRes, mathRes] = await Promise.all([
                satService.getResults(rwSession._id),
                satService.getResults(mathSession._id),
              ]);
              setPredictedScore(computeScoreFromModules(rwRes.data || rwRes, mathRes.data || mathRes));
            }
          }
        }
      } catch { /* predicted score unavailable */ }
    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setLoadingTests(false);
      setLoadingScore(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const diagPct     = testStats.diagnostic.total > 0 ? Math.round((testStats.diagnostic.completed / testStats.diagnostic.total) * 100) : 0;
  const practicePct = testStats.practice.total   > 0 ? Math.round((testStats.practice.completed   / testStats.practice.total)   * 100) : 0;
  const mockPct     = testStats.mock.total        > 0 ? Math.round((testStats.mock.completed        / testStats.mock.total)        * 100) : 0;
  const activeTypes = [diagPct, practicePct, mockPct].filter((_, i) => [testStats.diagnostic.total, testStats.practice.total, testStats.mock.total][i] > 0);
  const overallPct  = activeTypes.length > 0 ? Math.round(activeTypes.reduce((a, b) => a + b, 0) / activeTypes.length) : 0;

  const completedPractices = useMemo(() =>
    practiceHistory.filter(s => s.status === 'complete' || s.status === 'completed'),
  [practiceHistory]);

  const practiceAvgScore = useMemo(() =>
    completedPractices.length > 0
      ? Math.round(completedPractices.reduce((sum, s) => sum + (s.percentage || 0), 0) / completedPractices.length)
      : null,
  [completedPractices]);

  const lastPracticeAttempt = useMemo(() => {
    if (!completedPractices.length) return null;
    return [...completedPractices].sort((a, b) => new Date(b.submitted_at || b.updatedAt) - new Date(a.submitted_at || a.updatedAt))[0]?.submitted_at || null;
  }, [completedPractices]);

  const weakAreas        = useMemo(() => deriveWeakAreas(completedPractices),                        [completedPractices]);
  const topicMastery     = useMemo(() => deriveTopicMastery(completedPractices, practiceConfigs),    [completedPractices, practiceConfigs]);
  const continueLearning = useMemo(() => deriveContinueLearning(practiceHistory, practiceConfigs),   [practiceHistory, practiceConfigs]);
  const scoreProgression = useMemo(() => buildDiagnosticProgression(examHistory, examConfigs),       [examHistory, examConfigs]);
  const activityDates    = useMemo(() => deriveActivityDates(practiceHistory, examHistory),           [practiceHistory, examHistory]);

  return {
    testStats, inProgress, loadingTests,
    diagPct, practicePct, mockPct, overallPct,
    practiceAvgScore, lastPracticeAttempt,
    weakAreas, topicMastery, continueLearning,
    predictedScore, loadingScore,
    scoreProgression, activityDates,
  };
}
