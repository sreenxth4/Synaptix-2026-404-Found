const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// POST /api/reports — file a report on an existing issue (citizen only, +10 pts)
router.post(
  '/',
  authenticate,
  authorize('citizen'),
  upload.single('image'),
  [
    body('issue_id').isInt().withMessage('issue_id must be an integer'),
    body('description').trim().notEmpty().withMessage('Description is required'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { issue_id, description } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    try {
      const issueResult = await query('SELECT id FROM issues WHERE id = $1', [issue_id]);
      if (issueResult.rows.length === 0) {
        return res.status(404).json({ error: 'Issue not found' });
      }

      const result = await query(
        `INSERT INTO reports (issue_id, citizen_id, description, image_url)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [issue_id, req.user.id, description, image_url]
      );

      // Increment reports_count on the issue
      await query(
        'UPDATE issues SET reports_count = reports_count + 1, updated_at = NOW() WHERE id = $1',
        [issue_id]
      );

      // Award 10 points for filing a report
      await query(
        'UPDATE users SET civic_points = civic_points + 10 WHERE id = $1',
        [req.user.id]
      );
      await query(
        `INSERT INTO points_ledger (user_id, points, reason, issue_id)
         VALUES ($1, 10, 'report_filed', $2)`,
        [req.user.id, issue_id]
      );

      // Recalculate badge
      await updateBadge(req.user.id);

      res.status(201).json({ report: result.rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/reports/issue/:issue_id — all reports for an issue
router.get('/issue/:issue_id', async (req, res, next) => {
  const { issue_id } = req.params;

  try {
    const issueResult = await query('SELECT id FROM issues WHERE id = $1', [issue_id]);
    if (issueResult.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const result = await query(
      `SELECT r.*, u.name AS citizen_name
       FROM reports r
       LEFT JOIN users u ON r.citizen_id = u.id
       WHERE r.issue_id = $1
       ORDER BY r.created_at DESC`,
      [issue_id]
    );

    res.json({ reports: result.rows });
  } catch (err) {
    next(err);
  }
});

async function updateBadge(userId) {
  const result = await query('SELECT civic_points FROM users WHERE id = $1', [userId]);
  if (result.rows.length === 0) return;

  const points = result.rows[0].civic_points;
  let badge = 'newcomer';
  if (points >= 500) badge = 'champion';
  else if (points >= 200) badge = 'advocate';
  else if (points >= 50) badge = 'active';

  await query('UPDATE users SET badge = $1 WHERE id = $2', [badge, userId]);
}

module.exports = router;
