const { query } = require('../config/database');

const SEVERITY_MAP = {
  public_safety: 4,
  electricity: 3,
  water: 3,
  environment: 3,
  building: 3,
  roads: 2,
  sanitation: 2,
  noise: 2,
  parks: 1,
  other: 1,
};

const PRIORITY_THRESHOLDS = [
  { max: 20, label: 'Low' },
  { max: 50, label: 'Medium' },
  { max: 100, label: 'High' },
  { max: Infinity, label: 'Critical' },
];

/**
 * Return severity level (1–4) for a given category.
 * @param {string} category
 * @returns {number}
 */
function getSeverityLevel(category) {
  return SEVERITY_MAP[category] || 1;
}

/**
 * Calculate priority score and label for an issue.
 * Formula: (reports_count * 2) + (severity_level * 10) + days_unresolved + upvotes_count
 *
 * @param {{ reports_count: number, severity_level: number, days_unresolved: number, upvotes_count: number }} issue
 * @returns {{ score: number, label: string }}
 */
function calculatePriority(issue) {
  const {
    reports_count = 0,
    severity_level = 1,
    days_unresolved = 0,
    upvotes_count = 0,
  } = issue;

  const score =
    reports_count * 2 +
    severity_level * 10 +
    Math.floor(days_unresolved) +
    upvotes_count;

  const threshold = PRIORITY_THRESHOLDS.find((t) => score <= t.max);
  const label = threshold ? threshold.label : 'Critical';

  return { score, label };
}

/**
 * Recalculate and persist the priority for a single issue.
 * @param {number|string} issueId
 * @returns {Promise<{ score: number, label: string }>}
 */
async function updateIssuePriority(issueId) {
  const result = await query(
    `SELECT reports_count, severity_level, upvotes_count,
            EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400 AS days_unresolved
     FROM issues
     WHERE id = $1`,
    [issueId]
  );

  if (result.rows.length === 0) {
    throw new Error(`Issue ${issueId} not found`);
  }

  const row = result.rows[0];
  const { score, label } = calculatePriority({
    reports_count: parseInt(row.reports_count),
    severity_level: parseInt(row.severity_level),
    days_unresolved: parseFloat(row.days_unresolved),
    upvotes_count: parseInt(row.upvotes_count),
  });

  await query(
    'UPDATE issues SET priority_score = $1, priority_label = $2, updated_at = NOW() WHERE id = $3',
    [score, label, issueId]
  );

  return { score, label };
}

/**
 * Recalculate priorities for ALL open/in-progress issues.
 * Intended for the daily midnight cron job.
 */
async function recalculateAllPriorities() {
  const result = await query(
    `SELECT id FROM issues WHERE status IN ('open', 'in_progress')`
  );

  const updates = result.rows.map((row) =>
    updateIssuePriority(row.id).catch((err) =>
      console.error(`Priority update failed for issue ${row.id}:`, err)
    )
  );

  await Promise.all(updates);
  console.log(`[priorityService] Recalculated priorities for ${result.rows.length} issues`);
}

module.exports = { calculatePriority, getSeverityLevel, updateIssuePriority, recalculateAllPriorities };
