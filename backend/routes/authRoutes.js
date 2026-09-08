const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');



const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        message: 'Name, email and password are required'
      });
    }

    const existingUser = db
      .prepare('SELECT id FROM users WHERE email = ?')
      .get(email);

    if (existingUser) {
      return res.status(409).json({
        message: 'Email already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = db.prepare(`
      INSERT INTO users (full_name, email, password, role)
      VALUES (?, ?, ?, ?)
    `).run(full_name, email, hashedPassword, 'client');

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: result.lastInsertRowid,
        full_name,
        email,
        role: 'client'
      }
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Registration failed'
    });
  }
});
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    const user = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email);

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1h'
      }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        is_active: user.is_active
      }
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Login failed'
    });
  }
});

module.exports = router;