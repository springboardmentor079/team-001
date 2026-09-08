const express = require('express');
const db = require('../db');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

// Get all projects
router.get('/', authenticateToken, (req, res) => {
  try {
    const projects = db.prepare(`
      SELECT *
      FROM projects
      ORDER BY id DESC
    `).all();

    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to fetch projects'
    });
  }
});

// Create a project
router.post('/', authenticateToken, (req, res) => {
  try {
    const {
      project_code,
      name,
      location,
      budget,
      progress,
      status,
      manager
    } = req.body;

    if (!project_code || !name || !location) {
      return res.status(400).json({
        message: 'Project code, name and location are required'
      });
    }

    const result = db.prepare(`
      INSERT INTO projects
      (project_code, name, location, budget, progress, status, manager)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      project_code,
      name,
      location,
      budget || 0,
      progress || 0,
      status || 'On Track',
      manager || null
    );

    const project = db.prepare(`
      SELECT *
      FROM projects
      WHERE id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Project created successfully',
      project
    });

  } catch (error) {
    console.error(error);

    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({
        message: 'Project code already exists'
      });
    }

    res.status(500).json({
      message: 'Failed to create project'
    });
  }
});

module.exports = router;