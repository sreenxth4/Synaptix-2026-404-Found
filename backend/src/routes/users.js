const express = require('express');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/leaderboard — top citizens by points
router.get('/leaderboard', async (req, res, next) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);

  try {
    const result = await query(
      `SELECT id, name, civic_points, badge,
              (SELECT COUNT(*) FROM issues WHERE reporter_id = u.id) AS issues_reported,
              (SELECT COUNT(*) FROM reports WHERE citizen_id = u.id) AS reports_filed
       FROM users u
       WHERE role = 'citizen'
       ORDER BY civic_points DESC
       LIMIT $1`,
      [limit]
    );

    res.json({ leaderboard: result.rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/profile — own profile with points and badges
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    const userResult = await query(
      `SELECT u.id, u.name, u.email, u.role, u.department_id, u.civic_points, u.badge,
              u.language_preference, u.created_at, d.name AS department_name,
              (SELECT COUNT(*) FROM issues WHERE reporter_id = u.id) AS issues_reported,
              (SELECT COUNT(*) FROM reports WHERE citizen_id = u.id) AS reports_filed
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const recentPoints = await query(
      `SELECT pl.*, i.title AS issue_title
       FROM points_ledger pl
       LEFT JOIN issues i ON pl.issue_id = i.id
       WHERE pl.user_id = $1
       ORDER BY pl.created_at DESC
       LIMIT 10`,
      [req.user.id]
    );

    res.json({
      user: userResult.rows[0],
      recent_points: recentPoints.rows,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id/points — points history for a user
router.get('/:id/points', async (req, res, next) => {
  const { id } = req.params;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;

  try {
    const userResult = await query(
      'SELECT id, name, civic_points, badge FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const countResult = await query(
      'SELECT COUNT(*) FROM points_ledger WHERE user_id = $1',
      [id]
    );

    const ledgerResult = await query(
      `SELECT pl.*, i.title AS issue_title
       FROM points_ledger pl
       LEFT JOIN issues i ON pl.issue_id = i.id
       WHERE pl.user_id = $1
       ORDER BY pl.created_at DESC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    res.json({
      user: userResult.rows[0],
      points_history: ledgerResult.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page,
        limit,
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
