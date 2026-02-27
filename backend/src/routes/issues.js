const express = require('express');
const { body, query: queryValidator, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { findSimilarIssue } = require('../services/clusteringService');
const { calculatePriority, getSeverityLevel } = require('../services/priorityService');

const router = express.Router();

const VALID_CATEGORIES = [
  'roads', 'water', 'electricity', 'sanitation', 'parks',
  'public_safety', 'noise', 'building', 'environment', 'other',
];

// GET /api/issues/my — current authenticated user's issues
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT i.*, d.name AS department_name
       FROM issues i
       LEFT JOIN departments d ON i.department_id = d.id
       WHERE i.reporter_id = $1
       ORDER BY i.created_at DESC`,
      [req.user.id]
    );
    res.json({ issues: result.rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/issues/categories
router.get('/categories', (_req, res) => {
  res.json({ categories: VALID_CATEGORIES });
});

// POST /api/issues — create issue (citizen only)
router.post(
  '/',
  authenticate,
  authorize('citizen'),
  upload.single('image'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').isIn(VALID_CATEGORIES).withMessage('Invalid category'),
    body('location_lat').optional().isFloat({ min: -90, max: 90 }),
    body('location_lng').optional().isFloat({ min: -180, max: 180 }),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title, description, category,
      location_lat, location_lng, location_address,
    } = req.body;

    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    const lat = location_lat ? parseFloat(location_lat) : null;
    const lng = location_lng ? parseFloat(location_lng) : null;

    try {
      const severityLevel = getSeverityLevel(category);
      const { score: priorityScore, label: priorityLabel } = calculatePriority({
        reports_count: 0,
        severity_level: severityLevel,
        days_unresolved: 0,
        upvotes_count: 0,
      });

      // SLA deadline based on severity
      const slaHours = { 1: 72, 2: 48, 3: 24, 4: 12 };
      const slaDeadline = new Date(Date.now() + (slaHours[severityLevel] || 72) * 3600 * 1000);

      // Clustering check
      let isClustered = false;
      let parentIssueId = null;
      if (lat && lng) {
        const similar = await findSimilarIssue(title, description, category, lat, lng);
        if (similar) {
          isClustered = true;
          parentIssueId = similar.id;
          // bump reports_count on parent
          await query(
            'UPDATE issues SET reports_count = reports_count + 1 WHERE id = $1',
            [similar.id]
          );
        }
      }

      const result = await query(
        `INSERT INTO issues
           (title, description, category, location_lat, location_lng, location_address,
            image_url, status, priority_score, priority_label, severity_level,
            reporter_id, escalation_count, reports_count, upvotes_count,
            is_clustered, parent_issue_id, sla_deadline)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'open',$8,$9,$10,$11,0,0,0,$12,$13,$14)
         RETURNING *`,
        [
          title, description, category, lat, lng, location_address || null,
          image_url, priorityScore, priorityLabel, severityLevel,
          req.user.id, isClustered, parentIssueId, slaDeadline,
        ]
      );

      const issue = result.rows[0];

      // Log status creation
      await query(
        `INSERT INTO status_logs (issue_id, old_status, new_status, changed_by, note)
         VALUES ($1, NULL, 'open', $2, 'Issue created')`,
        [issue.id, req.user.id]
      );

      // Award points
      await query(
        `UPDATE users SET civic_points = civic_points + 10 WHERE id = $1`,
        [req.user.id]
      );
      await query(
        `INSERT INTO points_ledger (user_id, points, reason, issue_id)
         VALUES ($1, 10, 'issue_created', $2)`,
        [req.user.id, issue.id]
      );

      res.status(201).json({ issue });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/issues — list with filters
router.get(
  '/',
  [
    queryValidator('status').optional().isIn(['open', 'in_progress', 'resolved']),
    queryValidator('category').optional().isIn(VALID_CATEGORIES),
    queryValidator('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
    queryValidator('department_id').optional().isInt(),
    queryValidator('lat').optional().isFloat(),
    queryValidator('lng').optional().isFloat(),
    queryValidator('radius').optional().isFloat(),
    queryValidator('page').optional().isInt({ min: 1 }),
    queryValidator('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      status, category, priority, department_id,
      lat, lng, radius,
      page = 1, limit = 20,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const params = [];
    let idx = 1;

    if (status) { conditions.push(`i.status = $${idx++}`); params.push(status); }
    if (category) { conditions.push(`i.category = $${idx++}`); params.push(category); }
    if (priority) { conditions.push(`i.priority_label = $${idx++}`); params.push(priority); }
    if (department_id) { conditions.push(`i.department_id = $${idx++}`); params.push(parseInt(department_id)); }

    if (lat && lng && radius) {
      const radiusMeters = parseFloat(radius);
      conditions.push(
        `(6371000 * acos(
            cos(radians($${idx++})) * cos(radians(i.location_lat)) *
            cos(radians(i.location_lng) - radians($${idx++})) +
            sin(radians($${idx - 2})) * sin(radians(i.location_lat))
          )) <= $${idx++}`
      );
      params.push(parseFloat(lat), parseFloat(lng), radiusMeters);
      idx += 0; // already incremented inside template
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    try {
      const countResult = await query(
        `SELECT COUNT(*) FROM issues i ${where}`,
        params
      );
      const total = parseInt(countResult.rows[0].count);

      const dataResult = await query(
        `SELECT i.*, u.name AS reporter_name, d.name AS department_name
         FROM issues i
         LEFT JOIN users u ON i.reporter_id = u.id
         LEFT JOIN departments d ON i.department_id = d.id
         ${where}
         ORDER BY i.priority_score DESC, i.created_at DESC
         LIMIT $${idx++} OFFSET $${idx++}`,
        [...params, parseInt(limit), offset]
      );

      res.json({
        issues: dataResult.rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/issues/:id — single issue with timeline
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;

  try {
    const issueResult = await query(
      `SELECT i.*, u.name AS reporter_name, d.name AS department_name
       FROM issues i
       LEFT JOIN users u ON i.reporter_id = u.id
       LEFT JOIN departments d ON i.department_id = d.id
       WHERE i.id = $1`,
      [id]
    );

    if (issueResult.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const issue = issueResult.rows[0];

    const logsResult = await query(
      `SELECT sl.*, u.name AS changed_by_name
       FROM status_logs sl
       LEFT JOIN users u ON sl.changed_by = u.id
       WHERE sl.issue_id = $1
       ORDER BY sl.created_at ASC`,
      [id]
    );

    const reportsResult = await query(
      `SELECT r.*, u.name AS citizen_name
       FROM reports r
       LEFT JOIN users u ON r.citizen_id = u.id
       WHERE r.issue_id = $1
       ORDER BY r.created_at DESC`,
      [id]
    );

    res.json({
      issue,
      timeline: logsResult.rows,
      reports: reportsResult.rows,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/issues/:id/status — update status (authority, must be assigned dept)
router.put(
  '/:id/status',
  authenticate,
  authorize('authority', 'admin'),
  [body('status').isIn(['open', 'in_progress', 'resolved']).withMessage('Invalid status')],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, note } = req.body;

    try {
      const issueResult = await query('SELECT * FROM issues WHERE id = $1', [id]);
      if (issueResult.rows.length === 0) {
        return res.status(404).json({ error: 'Issue not found' });
      }

      const issue = issueResult.rows[0];

      if (
        req.user.role === 'authority' &&
        issue.department_id !== req.user.department_id
      ) {
        return res.status(403).json({ error: 'You can only update issues assigned to your department' });
      }

      const oldStatus = issue.status;
      const resolvedAt = status === 'resolved' ? new Date() : null;

      const updated = await query(
        `UPDATE issues
         SET status = $1, updated_at = NOW(), resolved_at = COALESCE($2, resolved_at)
         WHERE id = $3
         RETURNING *`,
        [status, resolvedAt, id]
      );

      await query(
        `INSERT INTO status_logs (issue_id, old_status, new_status, changed_by, note)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, oldStatus, status, req.user.id, note || null]
      );

      res.json({ issue: updated.rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/issues/:id/upvote — citizen upvote (one per user per issue)
router.post('/:id/upvote', authenticate, authorize('citizen'), async (req, res, next) => {
  const { id } = req.params;

  try {
    const issueResult = await query('SELECT id FROM issues WHERE id = $1', [id]);
    if (issueResult.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // Prevent duplicate upvotes via INSERT … ON CONFLICT DO NOTHING
    const insertResult = await query(
      `INSERT INTO issue_upvotes (issue_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (issue_id, user_id) DO NOTHING`,
      [id, req.user.id]
    );

    if (insertResult.rowCount === 0) {
      return res.status(409).json({ error: 'You have already upvoted this issue' });
    }

    const updated = await query(
      'UPDATE issues SET upvotes_count = upvotes_count + 1 WHERE id = $1 RETURNING upvotes_count',
      [id]
    );

    res.json({ upvotes_count: updated.rows[0].upvotes_count });
  } catch (err) {
    next(err);
  }
});

// POST /api/issues/:id/assign — assign to department (admin only)
router.post(
  '/:id/assign',
  authenticate,
  authorize('admin'),
  [body('department_id').isInt().withMessage('department_id must be an integer')],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { department_id } = req.body;

    try {
      const deptResult = await query('SELECT id FROM departments WHERE id = $1', [department_id]);
      if (deptResult.rows.length === 0) {
        return res.status(404).json({ error: 'Department not found' });
      }

      const updated = await query(
        `UPDATE issues SET department_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [department_id, id]
      );

      if (updated.rows.length === 0) {
        return res.status(404).json({ error: 'Issue not found' });
      }

      await query(
        `INSERT INTO status_logs (issue_id, old_status, new_status, changed_by, note)
         VALUES ($1, $2, $2, $3, $4)`,
        [id, updated.rows[0].status, req.user.id, `Assigned to department ${department_id}`]
      );

      res.json({ issue: updated.rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
