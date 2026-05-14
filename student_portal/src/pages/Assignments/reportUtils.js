import { getMasteryLevel } from '../../utils/colorMapping';

export function getTopicGroupName(section, moduleNum) {
  const name = (section.name || '').toLowerCase();
  const isRW = name.includes('reading') || name.includes('writing') || section.id === 'rw';
  if (isRW) return moduleNum === 1 ? 'Writing Mastery' : 'Reading Mastery';
  return 'Mathematics Mastery';
}

export function computeTopicMastery(assignment, attempt) {
  const result = {};
  (assignment.sections || []).forEach((section) => {
    const sectionId = section.id || section.sid;
    const sectionResult = attempt.sectionResults?.find(
      (sr) => sr.sectionId === sectionId || sr.sectionId === section.sid || sr.sectionId === section.id,
    );
    (section.modules || []).forEach((mod) => {
      const groupName = getTopicGroupName(section, mod.number);
      const moduleResult = sectionResult?.modules?.find((m) => m.moduleNumber === mod.number);
      if (!result[groupName]) result[groupName] = {};
      (mod.questions || []).forEach((q) => {
        const topic = (q.topic || '').trim() || null;
        if (!topic) return;
        if (!result[groupName][topic]) result[groupName][topic] = { correct: 0, total: 0, score: 0, maxScore: 0 };
        const primaryKey  = q.qid || q.id;
        const fallbackKey = q.id  || q.qid;
        const studentAnswer = moduleResult?.answers?.[primaryKey] ?? moduleResult?.answers?.[fallbackKey];
        const isCorrect = studentAnswer && studentAnswer === q.correctAnswer;
        result[groupName][topic].total++;
        result[groupName][topic].maxScore += (q.score || 1);
        if (isCorrect) {
          result[groupName][topic].correct++;
          result[groupName][topic].score += (q.score || 1);
        }
      });
      if (Object.keys(result[groupName]).length === 0) delete result[groupName];
    });
  });
  return result;
}

export function generateAISummary(topicMastery, attempt) {
  const overall = attempt.percentage ?? 0;
  const passed  = attempt.passed;
  const allTopics = [];

  for (const [group, topics] of Object.entries(topicMastery)) {
    for (const [topic, data] of Object.entries(topics)) {
      const pct = data.maxScore > 0 ? Math.round((data.score / data.maxScore) * 100) : 0;
      allTopics.push({ group, topic, pct, masteryLabel: getMasteryLevel(pct).label });
    }
  }

  const strong        = allTopics.filter(t => t.pct >= 70).sort((a, b) => b.pct - a.pct);
  const needsPractice = allTopics.filter(t => t.pct < 40).sort((a, b) => a.pct - b.pct);
  const developing    = allTopics.filter(t => t.pct >= 40 && t.pct < 70).sort((a, b) => b.pct - a.pct);

  let overallMsg;
  if (overall >= 85)      overallMsg = `Outstanding performance! A score of ${overall}% places you at mastery level — exceptional command of this material.`;
  else if (overall >= 70) overallMsg = `Great work! Scoring ${overall}% reflects strong understanding. You're well on your way to mastering this content.`;
  else if (overall >= 55) overallMsg = `Good effort! A score of ${overall}% shows solid progress. Targeted practice can push you into the advanced tier.`;
  else if (overall >= 40) overallMsg = `You scored ${overall}%, showing foundational understanding. Focused practice on weaker areas will yield quick improvements.`;
  else                    overallMsg = `You scored ${overall}%. This is your starting point — every expert begins here. Targeted study makes a significant difference.`;

  const strengthMsg = strong.length > 0
    ? `You excelled in: ${strong.slice(0, 4).map(t => `${t.topic} (${t.pct}%)`).join(', ')}. These are your power areas — keep leveraging them in the test.`
    : `No topic reached the 70%+ threshold yet, but growth is happening. Every practice session moves the needle.`;

  let improveMsg;
  if (needsPractice.length > 0) {
    improveMsg = `Prioritise: ${needsPractice.slice(0, 4).map(t => `${t.topic} (${t.pct}%)`).join(', ')}. These topics need the most focused attention and regular practice to build confidence.`;
  } else if (developing.length > 0) {
    improveMsg = `Keep working on: ${developing.slice(0, 3).map(t => `${t.topic} (${t.pct}%)`).join(', ')}. A little more practice will unlock the next mastery tier.`;
  } else {
    improveMsg = `All topics are performing well. Challenge yourself with harder problems to push toward mastery in every area.`;
  }

  const devMsg = (developing.length > 0 && needsPractice.length > 0)
    ? `Good momentum in: ${developing.slice(0, 3).map(t => `${t.topic} (${t.pct}%)`).join(', ')}. A few more sessions here can move these into your strength zone.`
    : '';

  const nextMsg = passed
    ? `Great achievement — you passed! To keep improving: drill your developing topics to push them into your strong zone, and attempt progressively harder questions to extend your mastery.`
    : `Review every wrong answer carefully, paying close attention to the explanations. Schedule focused practice on your lowest-scoring topics. Even 20 minutes daily on weak areas compounds quickly.`;

  return { overallMsg, strengthMsg, improveMsg, devMsg, nextMsg, strong, needsPractice, developing, allTopics, overall, passed };
}

export function downloadReport(attempt, assignment, topicMastery, aiData) {
  const date = attempt.completedAt
    ? new Date(attempt.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  let topicRowsHtml = '';
  for (const [group, topics] of Object.entries(topicMastery)) {
    topicRowsHtml += `<tr><td colspan="4" style="background:#1e293b;color:#fff;font-weight:700;padding:8px 12px;font-size:13px;">${group}</td></tr>`;
    for (const [topic, data] of Object.entries(topics)) {
      const pct     = data.maxScore > 0 ? Math.round((data.score / data.maxScore) * 100) : 0;
      const mastery = getMasteryLevel(pct);
      topicRowsHtml += `
        <tr>
          <td style="padding:8px 12px;font-size:13px;">${topic}</td>
          <td style="padding:8px 12px;text-align:center;">
            <span style="background:${mastery.bg};color:${mastery.color};padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;">${mastery.label}</span>
          </td>
          <td style="padding:8px 12px;text-align:center;font-size:13px;">${data.correct}/${data.total}</td>
          <td style="padding:8px 12px;text-align:center;font-size:13px;font-weight:700;color:${mastery.color};">${pct}%</td>
        </tr>`;
    }
  }

  const aiHtml = aiData ? `
    <div style="margin-top:24px;padding:16px;background:#f8fafc;border-radius:12px;border-left:4px solid #4f46e5;">
      <h3 style="margin:0 0 12px;color:#4f46e5;font-size:15px;font-weight:700;">AI Performance Summary</h3>
      <p style="margin:0 0 10px;color:#374151;line-height:1.6;font-size:13px;">${aiData.overallMsg}</p>
      <p style="margin:0 0 10px;color:#065f46;line-height:1.6;font-size:13px;"><strong>Strong Areas:</strong> ${aiData.strengthMsg}</p>
      <p style="margin:0 0 10px;color:#7c2d12;line-height:1.6;font-size:13px;"><strong>Focus Areas:</strong> ${aiData.improveMsg}</p>
      ${aiData.devMsg ? `<p style="margin:0 0 10px;color:#92400e;line-height:1.6;font-size:13px;"><strong>Developing:</strong> ${aiData.devMsg}</p>` : ''}
      <p style="margin:0;color:#374151;line-height:1.6;font-size:13px;"><strong>Next Steps:</strong> ${aiData.nextMsg}</p>
    </div>` : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Score Report — ${attempt.studentName || 'Student'}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;color:#1e293b;padding:32px;max-width:820px;margin:0 auto;}
    .header{background:linear-gradient(135deg,#1e1b4b,#312e81);color:#fff;padding:20px 24px;border-radius:12px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;}
    .score-box{background:rgba(255,255,255,0.18);border-radius:10px;padding:10px 18px;text-align:center;}
    .score-box .score{font-size:26px;font-weight:800;}
    .score-box .pts{font-size:12px;opacity:0.75;margin-top:2px;}
    .pass-badge{display:inline-block;margin-top:6px;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700;background:${attempt.passed ? '#10b981' : '#ef4444'};color:#fff;}
    h2{font-size:15px;font-weight:700;margin:24px 0 10px;color:#374151;}
    table{width:100%;border-collapse:collapse;margin-top:6px;}
    th{background:#374151;color:#fff;padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;}
    td{border-bottom:1px solid #e5e7eb;vertical-align:middle;}
    tr:last-child td{border-bottom:none;}
    footer{margin-top:36px;font-size:11px;color:#9ca3af;text-align:center;}
    @media print{body{padding:16px;}}
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div style="font-size:10px;opacity:.65;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px;">Score Report</div>
      <div style="font-size:20px;font-weight:800;color:#fff;margin-bottom:2px;">${attempt.studentName || 'Student'}</div>
      <div style="font-size:13px;opacity:.8;">${assignment.title}</div>
      <div style="font-size:11px;opacity:.6;margin-top:4px;">Completed: ${date}</div>
    </div>
    <div class="score-box">
      <div class="score">${attempt.percentage}%</div>
      <div class="pts">${attempt.score} / ${attempt.maxScore} pts</div>
      <div class="pass-badge">${attempt.passed ? 'PASSED' : 'FAILED'}</div>
    </div>
  </div>
  ${aiHtml}
  ${Object.keys(topicMastery).length > 0 ? `
  <h2>Topic Mastery</h2>
  <table>
    <thead><tr><th>Topic</th><th style="text-align:center">Mastery Level</th><th style="text-align:center">Correct</th><th style="text-align:center">Score %</th></tr></thead>
    <tbody>${topicRowsHtml}</tbody>
  </table>` : ''}
  <div class="footer">Generated by Catalyst Learning Platform &nbsp;·&nbsp; ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `report-${(attempt.studentName || 'student').replace(/\s+/g, '-')}-${Date.now()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
