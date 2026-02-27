const { query } = require('../config/database');

// SLA hours by severity level
const SLA_HOURS = {
  1: 72,  // Low
  2: 48,  // Medium
  3: 24,  // High
  4: 12,  // Critical
};

/**
 * Check all open/in-progress issues against their SLA deadlines.
 * For any issue past its deadline: increment escalation_count and log to status_logs.
 */
async function checkEscalations() {
  try {
    const result = await query(
      `SELECT id, title, severity_level, status, sla_deadline, escalation_count, department_id
       FROM issues
       WHERE status IN ('open', 'in_progress')
         AND sla_deadline IS NOT NULL
         AND sla_deadline < NOW()`
    );

    if (result.rows.length === 0) {
      console.log('[escalationService] No SLA violations found');
      return;
    }

    console.log(`[escalationService] Processing ${result.rows.length} SLA violation(s)`);

    for (const issue of result.rows) {
      const newEscalationCount = issue.escalation_count + 1;

      // Extend SLA deadline by the same interval for the next check cycle
      const slaHours = SLA_HOURS[issue.severity_level] || 72;
      const newDeadline = new Date(new Date(issue.sla_deadline).getTime() + slaHours * 3600 * 1000);

      await query(
        `UPDATE issues
         SET escalation_count = $1,
             sla_deadline = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [newEscalationCount, newDeadline, issue.id]
      );

      await query(
        `INSERT INTO status_logs (issue_id, old_status, new_status, changed_by, note)
         VALUES ($1, $2, $2, NULL,
           $3)`,
        [
          issue.id,
          issue.status,
          `SLA breach #${newEscalationCount}: issue past deadline. Next check at ${newDeadline.toISOString()}`,
        ]
      );
    }

    console.log(`[escalationService] Escalated ${result.rows.length} issue(s)`);
  } catch (err) {
    console.error('[escalationService] checkEscalations error:', err);
  }
}

/**
 * Return all issues currently past their SLA deadline or with escalation_count > 0.
 * @returns {Promise<object[]>}
 */
async function getEscalatedIssues() {
  const result = await query(
    `SELECT i.*, u.name AS reporter_name, d.name AS department_name
     FROM issues i
     LEFT JOIN users u ON i.reporter_id = u.id
     LEFT JOIN departments d ON i.department_id = d.id
     WHERE i.escalation_count > 0
        OR (i.sla_deadline IS NOT NULL AND i.sla_deadline < NOW() AND i.status != 'resolved')
     ORDER BY i.priority_score DESC, i.sla_deadline ASC`
  );

  return result.rows;
}

module.exports = { checkEscalations, getEscalatedIssues, SLA_HOURS };
