const express = require('express');
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All admin routes require admin role
router.use(authenticate, authorize('admin'));

// GET /api/admin/heatmap — issue coordinates for heatmap
router.get('/heatmap', async (req, res, next) => {
  const { status, category, days = 30 } = req.query;
  const conditions = [
    'location_lat IS NOT NULL',
    'location_lng IS NOT NULL',
    `created_at >= NOW() - INTERVAL '${parseInt(days)} days'`,
  ];
  const params = [];
  let idx = 1;

  if (status) { conditions.push(`status = $${idx++}`); params.push(status); }
  if (category) { conditions.push(`category = $${idx++}`); params.push(category); }

  const where = `WHERE ${conditions.join(' AND ')}`;

  try {
    const result = await query(
      `SELECT id, location_lat AS lat, location_lng AS lng,
              title, category, status, priority_label, priority_score
       FROM issues
       ${where}`,
      params
    );

    res.json({ heatmap: result.rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/escalations — escalated issues
router.get('/escalations', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT i.*, u.name AS reporter_name, d.name AS department_name
       FROM issues i
       LEFT JOIN users u ON i.reporter_id = u.id
       LEFT JOIN departments d ON i.department_id = d.id
       WHERE i.escalation_count > 0
          OR (i.sla_deadline IS NOT NULL AND i.sla_deadline < NOW() AND i.status != 'resolved')
       ORDER BY i.priority_score DESC, i.sla_deadline ASC`
    );

    res.json({ escalations: result.rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/engagement — civic engagement analytics
router.get('/engagement', async (req, res, next) => {
  try {
    const overview = await query(
      `SELECT
         (SELECT COUNT(*) FROM users WHERE role = 'citizen') AS total_citizens,
         (SELECT COUNT(*) FROM issues) AS total_issues,
         (SELECT COUNT(*) FROM issues WHERE status = 'resolved') AS resolved_issues,
         (SELECT COUNT(*) FROM reports) AS total_reports,
         (SELECT ROUND(AVG(civic_points), 2) FROM users WHERE role = 'citizen') AS avg_citizen_points,
         (SELECT COUNT(*) FROM users WHERE role = 'citizen' AND created_at >= NOW() - INTERVAL '30 days') AS new_citizens_30d,
         (SELECT COUNT(*) FROM issues WHERE created_at >= NOW() - INTERVAL '30 days') AS new_issues_30d,
         (SELECT COUNT(*) FROM issues WHERE status = 'resolved' AND resolved_at >= NOW() - INTERVAL '30 days') AS resolved_30d`
    );

    const topReporters = await query(
      `SELECT u.id, u.name, u.civic_points, u.badge,
              COUNT(i.id) AS issues_reported,
              COUNT(r.id) AS reports_filed
       FROM users u
       LEFT JOIN issues i ON i.reporter_id = u.id
       LEFT JOIN reports r ON r.citizen_id = u.id
       WHERE u.role = 'citizen'
       GROUP BY u.id
       ORDER BY u.civic_points DESC
       LIMIT 10`
    );

    const issuesByCategory = await query(
      `SELECT category,
              COUNT(*) AS total,
              COUNT(*) FILTER (WHERE status = 'resolved') AS resolved,
              ROUND(AVG(priority_score), 2) AS avg_priority
       FROM issues
       GROUP BY category
       ORDER BY total DESC`
    );

    const weeklyActivity = await query(
      `SELECT
         DATE_TRUNC('week', created_at) AS week,
         COUNT(*) AS issues_created,
         COUNT(*) FILTER (WHERE status = 'resolved') AS issues_resolved
       FROM issues
       WHERE created_at >= NOW() - INTERVAL '12 weeks'
       GROUP BY week
       ORDER BY week`
    );

    res.json({
      overview: overview.rows[0],
      top_reporters: topReporters.rows,
      issues_by_category: issuesByCategory.rows,
      weekly_activity: weeklyActivity.rows,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/departments/performance — all dept performance metrics
router.get('/departments/performance', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         d.id,
         d.name,
         COUNT(i.id) AS total_issues,
         COUNT(i.id) FILTER (WHERE i.status = 'resolved') AS resolved_issues,
         COUNT(i.id) FILTER (WHERE i.status = 'in_progress') AS in_progress_issues,
         COUNT(i.id) FILTER (WHERE i.status = 'open') AS open_issues,
         ROUND(
           COUNT(i.id) FILTER (WHERE i.status = 'resolved')::numeric /
           NULLIF(COUNT(i.id), 0) * 100, 2
         ) AS resolution_rate,
         ROUND(
           AVG(
             EXTRACT(EPOCH FROM (i.resolved_at - i.created_at)) / 3600
           ) FILTER (WHERE i.status = 'resolved' AND i.resolved_at IS NOT NULL),
           2
         ) AS avg_resolution_hours,
         COUNT(i.id) FILTER (WHERE i.escalation_count > 0) AS escalated_count,
         ROUND(AVG(i.priority_score), 2) AS avg_priority_score
       FROM departments d
       LEFT JOIN issues i ON i.department_id = d.id
       GROUP BY d.id, d.name
       ORDER BY resolution_rate DESC NULLS LAST`
    );

    res.json({ performance: result.rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
