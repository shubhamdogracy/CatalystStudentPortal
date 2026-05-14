import { masteryLevels, masteryChartColors, chartPalette } from '../theme/tokens';

export { masteryChartColors as MASTERY_CHART_COLORS, chartPalette as CHART_PALETTE };

export function getMasteryLevel(pct) {
  return masteryLevels.find(l => pct >= l.min);
}
