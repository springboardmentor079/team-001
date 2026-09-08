const express = require('express');
const db = require('../db');
const authenticateToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const router = express.Router();

router.get('/me', authenticateToken, (req, res) => {
  const user = db
    .prepare(`
      SELECT id, full_name, email, role, is_active, created_at
      FROM users
      WHERE id = ?
    `)
    .get(req.user.id);

  if (!user) {
    return res.status(404).json({
      message: 'User not found'
    });
  }

  res.json(user);
});
router.get('/admin-test', authenticateToken, requireRole('admin'), (req, res) => {
  res.json({
    message: 'Admin access successful',
    user: req.user
  });
});
router.get('/', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const users = db
      .prepare(`
        SELECT id, full_name, email, role, is_active, created_at
        FROM users
        ORDER BY id
      `)
      .all();

    res.json(users);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Failed to fetch users'
    });
  }
});
router.put('/:id/role', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { role } = req.body;

    const allowedRoles = [
      'admin',
      'project_manager',
      'site_engineer',
      'contractor',
      'worker',
      'client'
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: 'Invalid role'
      });
    }

    const user = db
      .prepare('SELECT id, full_name, email, role FROM users WHERE id = ?')
      .get(userId);

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    db
      .prepare('UPDATE users SET role = ? WHERE id = ?')
      .run(role, userId);

    res.json({
      message: 'User role updated successfully',
      user: {
        ...user,
        role
      }
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Failed to update user role'
    });
  }
});
module.exports = router;