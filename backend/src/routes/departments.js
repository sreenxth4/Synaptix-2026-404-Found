const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/departments — list all departments
router.get('/', async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT d.*, u.name AS head_authority_name,
              (SELECT COUNT(*) FROM issues WHERE department_id = d.id) AS total_issues,
              (SELECT COUNT(*) FROM issues WHERE department_id = d.id AND status = 'resolved') AS resolved_issues
       FROM departments d
       LEFT JOIN users u ON d.head_authority_id = u.id
       ORDER BY d.name`
    );

    res.json({ departments: result.rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/departments/:id/analytics
router.get('/:id/analytics', async (req, res, next) => {
  const { id } = req.params;

  try {
    const deptResult = await query(
      'SELECT id, name, description FROM departments WHERE id = $1',
      [id]
    );

    if (deptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const analyticsResult = await query(
      `SELECT
         COUNT(*) AS total_issues,
         COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_issues,
         COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_issues,
         COUNT(*) FILTER (WHERE status = 'open') AS open_issues,
         ROUND(
           COUNT(*) FILTER (WHERE status = 'resolved')::numeric /
           NULLIF(COUNT(*), 0) * 100, 2
         ) AS resolution_rate,
         ROUND(
           AVG(
             EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600
           ) FILTER (WHERE status = 'resolved' AND resolved_at IS NOT NULL),
           2
         ) AS avg_resolution_hours,
         COUNT(*) FILTER (WHERE escalation_count > 0) AS escalated_issues,
         ROUND(AVG(priority_score), 2) AS avg_priority_score
       FROM issues
       WHERE department_id = $1`,
      [id]
    );

    const categoryBreakdown = await query(
      `SELECT category, COUNT(*) AS count
       FROM issues
       WHERE department_id = $1
       GROUP BY category
       ORDER BY count DESC`,
      [id]
    );

    const monthlyTrend = await query(
      `SELECT
         DATE_TRUNC('month', created_at) AS month,
         COUNT(*) AS reported,
         COUNT(*) FILTER (WHERE status = 'resolved') AS resolved
       FROM issues
       WHERE department_id = $1
         AND created_at >= NOW() - INTERVAL '6 months'
       GROUP BY month
       ORDER BY month`,
      [id]
    );

    res.json({
      department: deptResult.rows[0],
      analytics: analyticsResult.rows[0],
      category_breakdown: categoryBreakdown.rows,
      monthly_trend: monthlyTrend.rows,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/departments — create department (admin only)
router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('description').optional().trim(),
    body('head_authority_id').optional().isInt(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, head_authority_id } = req.body;

    try {
      const result = await query(
        `INSERT INTO departments (name, description, head_authority_id)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [name, description || null, head_authority_id || null]
      );

      res.status(201).json({ department: result.rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
